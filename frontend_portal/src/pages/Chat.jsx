import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Bot, Menu, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendMessage } from '../api';

// Components
import AppShell from '../components/layout/AppShell';
import Sidebar from '../components/layout/Sidebar';
import IntelligencePanel from '../components/layout/IntelligencePanel';
import MessageBubble from '../components/chat/MessageBubble';
import InputArea from '../components/chat/InputArea';
import WelcomeScreen from '../components/chat/WelcomeScreen';
import ProfileMenu from '../components/ProfileMenu';

// Helpers
const STORAGE_KEYS = {
    SESSIONS_INDEX: 'jurislink_sessions_index',
    SESSION_PREFIX: 'jurislink_session_',
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const loadSessionsIndex = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS_INDEX)) || []; } catch { return []; }
};

const saveSessionToStorage = (sessionId, data, title, isRenamed = false) => {
    localStorage.setItem(STORAGE_KEYS.SESSION_PREFIX + sessionId, JSON.stringify(data));
    const index = loadSessionsIndex();
    const existingEntryIndex = index.findIndex(s => s.id === sessionId);
    const entry = {
        id: sessionId,
        title: title || "New Consultation",
        date: new Date().toLocaleDateString(),
        timestamp: Date.now(),
        isRenamed: isRenamed
    };
    if (existingEntryIndex >= 0) {
        const existing = index[existingEntryIndex];
        entry.isRenamed = isRenamed || existing.isRenamed;
        if (existing.isRenamed && !isRenamed) entry.title = existing.title;
        index[existingEntryIndex] = { ...existing, ...entry };
    } else {
        index.unshift(entry);
    }
    localStorage.setItem(STORAGE_KEYS.SESSIONS_INDEX, JSON.stringify(index));
    return index;
};

const renameSessionInStorage = (sessionId, newTitle) => {
    const index = loadSessionsIndex();
    const entryIndex = index.findIndex(s => s.id === sessionId);
    if (entryIndex >= 0) {
        index[entryIndex].title = newTitle;
        index[entryIndex].isRenamed = true;
        localStorage.setItem(STORAGE_KEYS.SESSIONS_INDEX, JSON.stringify(index));
    }
    return index;
};

const deleteSessionFromStorage = (sessionId) => {
    localStorage.removeItem(STORAGE_KEYS.SESSION_PREFIX + sessionId);
    const index = loadSessionsIndex().filter(s => s.id !== sessionId);
    localStorage.setItem(STORAGE_KEYS.SESSIONS_INDEX, JSON.stringify(index));
    return index;
};

const loadSessionFromStorage = (sessionId) => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION_PREFIX + sessionId)); } catch { return null; }
};

const Chat = () => {
    const { id: caseId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();

    // State
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [facts, setFacts] = useState({});
    const [strategy, setStrategy] = useState(null);
    const [backendState, setBackendState] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(true);

    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Initial Load & Session Management
    useEffect(() => {
        setSessions(loadSessionsIndex());
    }, []);

    useEffect(() => {
        if (caseId && caseId !== 'new') {
            const data = loadSessionFromStorage(caseId);
            if (data) {
                setCurrentSessionId(caseId);
                setMessages(data.messages || []);
                setFacts(data.facts || {});
                setStrategy(data.strategy || null);
                setBackendState(data.backendState || null);
            }
        } else if (caseId === 'new') {
            setCurrentSessionId(null);
            setMessages([]);
            setFacts({});
            setStrategy(null);
            setBackendState(null);
        }
    }, [caseId]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    // Handlers
    const handleSend = async (manualContent = null) => {
        const textToSend = typeof manualContent === 'string' ? manualContent : input;
        if (!textToSend.trim()) return;

        const userMsg = { role: 'user', content: textToSend };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        if (!manualContent) setInput('');

        setLoading(true);
        abortControllerRef.current = new AbortController();

        try {
            const data = await sendMessage(textToSend, updatedMessages, backendState, abortControllerRef.current.signal);

            const newBackendState = data.final_state || backendState;
            const newFacts = data.facts || facts;
            const newStrategy = data.strategy || strategy;

            setBackendState(newBackendState);
            setFacts(newFacts);
            setStrategy(newStrategy);
            setLastUpdated(Date.now());

            const finalMessages = [...updatedMessages, { role: 'assistant', content: data.response, docUrl: data.docUrl }];
            setMessages(finalMessages);

            // Session Management
            const activeSessionId = currentSessionId || generateId();
            if (!currentSessionId) {
                setCurrentSessionId(activeSessionId);
                navigate(`/case/${activeSessionId}`, { replace: true });
            }

            // Auto Title
            let sessionTitle = "New Consultation";
            const cleanIssue = (newFacts.Legal_Issue || "").trim();
            if (cleanIssue && !["hello", "hi"].some(g => cleanIssue.toLowerCase().startsWith(g))) {
                sessionTitle = cleanIssue + (newFacts.Jurisdiction ? ` - ${newFacts.Jurisdiction}` : "");
            } else {
                const current = sessions.find(s => s.id === activeSessionId);
                if (current) sessionTitle = current.title;
            }

            const updatedIndex = saveSessionToStorage(activeSessionId, {
                messages: finalMessages, facts: newFacts, strategy: newStrategy, backendState: newBackendState
            }, sessionTitle);
            setSessions(updatedIndex);

        } catch (error) {
            if (error.message !== "CANCELLED") {
                setMessages(p => [...p, { role: 'assistant', content: "", isError: true }]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setLoading(false);
        }
    };

    const handleNewChat = () => {
        if (messages.length > 0 && !window.confirm("Start new chat? Current view is saved.")) return;
        navigate('/case/new');
    };

    const handleDeleteSession = (sid) => {
        if (window.confirm("Delete this case history?")) {
            setSessions(deleteSessionFromStorage(sid));
            if (currentSessionId === sid) navigate('/case/new');
        }
    };

    const handleRenameSession = (sid, title) => {
        setSessions(renameSessionInStorage(sid, title));
    };

    // Responsive toggle
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) setIsAnalysisOpen(false);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    return (
        <AppShell
            isSidebarOpen={isSidebarOpen}
            isAnalysisOpen={isAnalysisOpen}
            sidebar={
                <Sidebar
                    onNewChat={handleNewChat}
                    onSettings={() => { }}
                    onHistoryClick={(sid) => navigate(`/case/${sid}`)}
                    onDeleteSession={handleDeleteSession}
                    onRenameSession={handleRenameSession}
                    sessions={sessions}
                    currentSessionId={currentSessionId}
                />
            }
            analysisPanel={
                <IntelligencePanel
                    facts={facts}
                    strategy={strategy}
                    caseId={currentSessionId || caseId}
                    lastUpdated={lastUpdated}
                    currentUser={currentUser}
                />
            }
        >
            {/* Header */}
            <header className="flex-none h-16 border-b border-glass-border bg-glass-highlight backdrop-blur flex items-center justify-between px-6 z-30">
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors">
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Bot size={20} className="text-white" />
                        </div>
                        <h1 className="font-semibold text-lg text-text-primary tracking-tight">
                            JURISLINK <span className="ml-2 px-1.5 py-0.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-[10px] uppercase font-bold tracking-wider">v4.0</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
                        className={`p-2 rounded-lg transition-colors ${isAnalysisOpen ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-muted hover:text-text-primary hover:bg-white/5'}`}
                        title="Toggle Intelligence Panel"
                    >
                        <Briefcase size={20} />
                    </button>
                    <div className="w-px h-6 bg-glass-border mx-1" />
                    <ProfileMenu />
                </div>
            </header>

            {/* Chat Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 scrollbar-thin relative z-10">
                {messages.length === 0 ? (
                    <WelcomeScreen onSuggestionClick={(prompt) => handleSend(prompt)} />
                ) : (
                    <div className="max-w-4xl mx-auto pb-4">
                        {messages.map((msg, idx) => (
                            <MessageBubble
                                key={idx}
                                role={msg.role}
                                content={msg.content}
                                isFinal={!loading || idx < messages.length - 1}
                                isError={msg.isError}
                                docUrl={msg.docUrl}
                            />
                        ))}
                        {loading && <MessageBubble role="assistant" content="" isFinal={false} />}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="flex-none p-6 border-t border-glass-border bg-glass-panel backdrop-blur-xl relative z-30">
                <InputArea
                    input={input}
                    setInput={setInput}
                    handleSend={handleSend}
                    handleStop={handleStop}
                    loading={loading}
                />
                <p className="text-center text-xs text-text-muted mt-3">
                    JurisLink AI can make mistakes. Verify important legal information.
                </p>
            </div>
        </AppShell>
    );
};

export default Chat;
