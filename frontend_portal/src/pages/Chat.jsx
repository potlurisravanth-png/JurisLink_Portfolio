import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bot, Menu, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext.jsx';
import { sendMessage, getUserSessions, getSession, saveSessionToAPI, deleteSessionFromAPI } from '../api';

// Components
import AppShell from '../components/layout/AppShell';
import Sidebar from '../components/layout/Sidebar';
import IntelligencePanel from '../components/layout/IntelligencePanel';
import MessageBubble from '../components/chat/MessageBubble';
import InputArea from '../components/chat/InputArea';
import WelcomeScreen from '../components/chat/WelcomeScreen';
import ProfileMenu from '../components/ProfileMenu';

// Helpers
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// User-scoped localStorage keys
const getStorageKey = (userId, suffix) => `jurislink_${userId}_${suffix}`;

const Chat = () => {
    const { id: caseId } = useParams();
    const navigate = useNavigate();
    const { currentUser, getIdToken } = useAuth();
    const { theme, setTheme } = useTheme();

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
    const [sessionsLoading, setSessionsLoading] = useState(true);

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Get user ID (for scoping data)
    const userId = currentUser?.uid || 'anonymous';

    // ==========================================================================
    // SESSION STORAGE (with API + localStorage fallback)
    // ==========================================================================

    // Load sessions from API (with localStorage cache)
    const loadSessions = useCallback(async () => {
        if (!currentUser) {
            setSessions([]);
            setSessionsLoading(false);
            return;
        }

        try {
            const token = await getIdToken();
            const apiSessions = await getUserSessions(token, userId);

            if (apiSessions) {
                setSessions(apiSessions);
                // Cache in localStorage
                localStorage.setItem(getStorageKey(userId, 'sessions'), JSON.stringify(apiSessions));
            } else {
                // Fallback to localStorage
                const cached = localStorage.getItem(getStorageKey(userId, 'sessions'));
                setSessions(cached ? JSON.parse(cached) : []);
            }
        } catch (error) {
            console.error('Failed to load sessions:', error);
            // Fallback to localStorage
            const cached = localStorage.getItem(getStorageKey(userId, 'sessions'));
            setSessions(cached ? JSON.parse(cached) : []);
        } finally {
            setSessionsLoading(false);
        }
    }, [currentUser, getIdToken, userId]);

    // Load specific session
    const loadSession = useCallback(async (sessionId) => {
        if (!currentUser || !sessionId) return null;

        try {
            const token = await getIdToken();
            const session = await getSession(token, userId, sessionId);

            if (session) {
                // Cache locally
                localStorage.setItem(getStorageKey(userId, `session_${sessionId}`), JSON.stringify(session));
                return session;
            }
        } catch (error) {
            console.error('Failed to load session:', error);
        }

        // Fallback to localStorage
        const cached = localStorage.getItem(getStorageKey(userId, `session_${sessionId}`));
        return cached ? JSON.parse(cached) : null;
    }, [currentUser, getIdToken, userId]);

    // Save session (to API + localStorage)
    const saveSession = useCallback(async (sessionId, data, title, isRenamed = false) => {
        const sessionData = {
            session_id: sessionId,
            title: title || "New Consultation",
            date: new Date().toLocaleDateString(),
            timestamp: Date.now(),
            isRenamed: isRenamed,
            messages: data.messages || [],
            facts: data.facts || {},
            strategy: data.strategy,
            backendState: data.backendState
        };

        // Update local state immediately
        setSessions(prev => {
            const existing = prev.find(s => s.id === sessionId);
            if (existing) {
                // Preserve isRenamed if already set
                if (existing.isRenamed && !isRenamed) {
                    sessionData.title = existing.title;
                    sessionData.isRenamed = true;
                }
                return prev.map(s => s.id === sessionId ? { ...s, ...sessionData, id: sessionId } : s);
            }
            return [{ id: sessionId, ...sessionData }, ...prev];
        });

        // Save to localStorage immediately
        localStorage.setItem(getStorageKey(userId, `session_${sessionId}`), JSON.stringify(sessionData));

        // Update sessions index in localStorage
        const sessionsIndex = JSON.parse(localStorage.getItem(getStorageKey(userId, 'sessions')) || '[]');
        const existingIdx = sessionsIndex.findIndex(s => s.id === sessionId);
        const indexEntry = { id: sessionId, title: sessionData.title, date: sessionData.date, timestamp: sessionData.timestamp, isRenamed: sessionData.isRenamed };
        if (existingIdx >= 0) {
            sessionsIndex[existingIdx] = indexEntry;
        } else {
            sessionsIndex.unshift(indexEntry);
        }
        localStorage.setItem(getStorageKey(userId, 'sessions'), JSON.stringify(sessionsIndex));

        // Save to API in background
        if (currentUser) {
            try {
                const token = await getIdToken();
                await saveSessionToAPI(token, userId, sessionId, sessionData);
            } catch (error) {
                console.error('Failed to save session to API:', error);
            }
        }

        return sessionsIndex;
    }, [currentUser, getIdToken, userId]);

    // Delete session
    const deleteSession = useCallback(async (sessionId) => {
        // Update local state immediately
        setSessions(prev => prev.filter(s => s.id !== sessionId));

        // Remove from localStorage
        localStorage.removeItem(getStorageKey(userId, `session_${sessionId}`));
        const sessionsIndex = JSON.parse(localStorage.getItem(getStorageKey(userId, 'sessions')) || '[]');
        const filtered = sessionsIndex.filter(s => s.id !== sessionId);
        localStorage.setItem(getStorageKey(userId, 'sessions'), JSON.stringify(filtered));

        // Delete from API
        if (currentUser) {
            try {
                const token = await getIdToken();
                await deleteSessionFromAPI(token, userId, sessionId);
            } catch (error) {
                console.error('Failed to delete session from API:', error);
            }
        }

        return filtered;
    }, [currentUser, getIdToken, userId]);

    // Rename session
    const renameSession = useCallback(async (sessionId, newTitle) => {
        setSessions(prev => prev.map(s =>
            s.id === sessionId ? { ...s, title: newTitle, isRenamed: true } : s
        ));

        // Update localStorage
        const sessionsIndex = JSON.parse(localStorage.getItem(getStorageKey(userId, 'sessions')) || '[]');
        const idx = sessionsIndex.findIndex(s => s.id === sessionId);
        if (idx >= 0) {
            sessionsIndex[idx].title = newTitle;
            sessionsIndex[idx].isRenamed = true;
            localStorage.setItem(getStorageKey(userId, 'sessions'), JSON.stringify(sessionsIndex));
        }

        // Update session data
        const sessionData = JSON.parse(localStorage.getItem(getStorageKey(userId, `session_${sessionId}`)) || '{}');
        sessionData.title = newTitle;
        sessionData.isRenamed = true;
        localStorage.setItem(getStorageKey(userId, `session_${sessionId}`), JSON.stringify(sessionData));

        // Update API
        if (currentUser) {
            try {
                const token = await getIdToken();
                await saveSessionToAPI(token, userId, sessionId, sessionData);
            } catch (error) {
                console.error('Failed to rename session in API:', error);
            }
        }

        return sessionsIndex;
    }, [currentUser, getIdToken, userId]);

    // ==========================================================================
    // EFFECTS
    // ==========================================================================

    // Load sessions when user changes
    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    // Load session when caseId changes
    useEffect(() => {
        const load = async () => {
            if (caseId && caseId !== 'new') {
                const data = await loadSession(caseId);
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
        };
        load();
    }, [caseId, loadSession]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    // ==========================================================================
    // HANDLERS
    // ==========================================================================

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
            let currentBackendState = backendState || {};

            const data = await sendMessage(textToSend, updatedMessages, currentBackendState, abortControllerRef.current.signal);

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

            // Auto Title Logic
            let sessionTitle = "New Consultation";

            // 1. Prefer AI generated short title
            if (newFacts.short_title && newFacts.short_title !== "Unknown" && newFacts.short_title.length > 3) {
                sessionTitle = newFacts.short_title;
            }
            // 2. Fallback to extracting from keys
            else {
                const titleCandidates = [
                    newFacts.Legal_Issue, newFacts.legal_issue,
                    newFacts.Issue, newFacts.issue,
                    newFacts.Case_Type, newFacts.case_type,
                    newFacts.Summary, newFacts.summary
                ];

                const foundTitle = titleCandidates.find(t => t && typeof t === 'string' && t.length > 3);

                if (foundTitle) {
                    sessionTitle = foundTitle.trim();
                } else {
                    // 3. Last resort: user first message
                    const firstUserMsg = updatedMessages.find(m => m.role === 'user');
                    if (firstUserMsg && firstUserMsg.content) {
                        const preview = firstUserMsg.content.slice(0, 30).replace(/\n/g, ' ').trim();
                        if (preview.length > 3 && !["hello", "hi", "hey"].some(v => preview.toLowerCase().startsWith(v))) {
                            sessionTitle = preview;
                        }
                    }
                }
            }

            // Hard truncate to ensure sidebar fit
            if (sessionTitle.length > 25) {
                sessionTitle = sessionTitle.substring(0, 25) + "...";
            }

            // Only update title if not manually renamed by user
            const current = sessions.find(s => s.id === activeSessionId);
            if (current && current.isRenamed) {
                sessionTitle = current.title;
            }

            await saveSession(activeSessionId, {
                messages: finalMessages, facts: newFacts, strategy: newStrategy, backendState: newBackendState
            }, sessionTitle);

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
        if (caseId === 'new') {
            setCurrentSessionId(null);
            setMessages([]);
            setFacts({});
            setStrategy(null);
            setBackendState(null);
            setInput('');
        } else {
            navigate('/case/new');
        }
    };

    const handleDeleteSession = async (sid) => {
        if (window.confirm("Delete this case history?")) {
            await deleteSession(sid);
            if (currentSessionId === sid) navigate('/case/new');
        }
    };

    const handleRenameSession = async (sid, title) => {
        await renameSession(sid, title);
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
                    onSettings={() => setIsSettingsOpen(true)}
                    onHistoryClick={(sid) => navigate(`/case/${sid}`)}
                    onDeleteSession={handleDeleteSession}
                    onRenameSession={handleRenameSession}
                    sessions={sessions}
                    currentSessionId={currentSessionId}
                    loading={sessionsLoading}
                />
            }
            analysisPanel={
                <IntelligencePanel
                    facts={facts}
                    strategy={strategy}
                    caseId={currentSessionId || caseId}
                    title={sessions.find(s => s.id === (currentSessionId || caseId))?.title}
                    lastUpdated={lastUpdated}
                    currentUser={currentUser}
                />
            }
        >
            {/* Header */}
            <header className="flex-none h-16 border-b border-glass-border bg-glass-highlight backdrop-blur flex items-center justify-between px-6 z-30">
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 text-text-muted hover:text-text-primary hover-bg rounded-lg transition-colors">
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo.png"
                            alt="JurisLink"
                            className="w-8 h-8 rounded-lg shadow-lg shadow-blue-500/20"
                        />
                        <h1 className="font-semibold text-lg text-text-primary tracking-tight">
                            JURISLINK <span className="ml-2 px-1.5 py-0.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-[10px] uppercase font-bold tracking-wider">v4.0</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
                        className={`p-2 rounded-lg transition-colors ${isAnalysisOpen ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-muted hover:text-text-primary hover-bg'}`}
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

            {/* Preferences Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}>
                    <div className="bg-bg-surface border border-glass-border rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-bold text-text-primary mb-4">Preferences</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-text-secondary">Theme</span>
                                <select
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value)}
                                    className="bg-bg-subtle border border-glass-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent-primary cursor-pointer appearance-none pr-8"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                        backgroundPosition: 'right 0.5rem center',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: '1.5em 1.5em'
                                    }}
                                >
                                    <option value="system" className="bg-bg-surface text-text-primary">System Default</option>
                                    <option value="dark" className="bg-bg-surface text-text-primary">Dark Mode</option>
                                    <option value="light" className="bg-bg-surface text-text-primary">Light Mode</option>
                                    <option value="high-contrast" className="bg-bg-surface text-text-primary">High Contrast</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
};

export default Chat;
