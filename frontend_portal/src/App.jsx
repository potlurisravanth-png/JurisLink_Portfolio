import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TextareaAutosize from 'react-textarea-autosize';
import { sendMessage } from './api';
import { Send, FileText, Download, Briefcase, StopCircle, Bot, X, Menu, AlertTriangle, Settings, Trash2, Info, Moon, Sun, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- HELPER: LOCAL STORAGE MANAGEMENT ---
const STORAGE_KEYS = {
  SESSIONS_INDEX: 'jurislink_sessions_index',
  SESSION_PREFIX: 'jurislink_session_',
  THEME_PREF: 'jurislink_theme_pref'
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const loadSessionsIndex = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS_INDEX)) || [];
  } catch {
    return [];
  }
};

const saveSessionToStorage = (sessionId, data, title) => {
  localStorage.setItem(STORAGE_KEYS.SESSION_PREFIX + sessionId, JSON.stringify(data));
  const index = loadSessionsIndex();
  const existingEntryIndex = index.findIndex(s => s.id === sessionId);

  const entry = {
    id: sessionId,
    title: title || "New Consulation",
    date: new Date().toLocaleDateString(),
    timestamp: Date.now()
  };

  if (existingEntryIndex >= 0) {
    index[existingEntryIndex] = { ...index[existingEntryIndex], ...entry };
  } else {
    index.unshift(entry);
  }

  localStorage.setItem(STORAGE_KEYS.SESSIONS_INDEX, JSON.stringify(index));
  return index;
};

const deleteSessionFromStorage = (sessionId) => {
  localStorage.removeItem(STORAGE_KEYS.SESSION_PREFIX + sessionId);
  const index = loadSessionsIndex().filter(s => s.id !== sessionId);
  localStorage.setItem(STORAGE_KEYS.SESSIONS_INDEX, JSON.stringify(index));
  return index;
};

const loadSessionFromStorage = (sessionId) => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION_PREFIX + sessionId));
  } catch {
    return null;
  }
};

// --- THEME DEFINITIONS ---
const THEMES = {
  dark: {
    name: 'Dark',
    bg: 'bg-slate-950',
    sidebar: 'bg-slate-950 border-r border-slate-800',
    text: 'text-slate-100',
    muted: 'text-slate-400',
    accent: 'text-blue-400',
    accentBg: 'bg-blue-600',
    userBubble: 'bg-slate-800 border-slate-700 text-slate-100',
    botBubble: 'text-slate-200',
    inputBg: 'bg-slate-900',
    borderColor: 'border-slate-800',
    hover: 'hover:bg-slate-800'
  },
  light: {
    name: 'Light',
    bg: 'bg-slate-50',
    sidebar: 'bg-white border-r border-slate-200',
    text: 'text-slate-900',
    muted: 'text-slate-500',
    accent: 'text-blue-600',
    accentBg: 'bg-blue-600',
    userBubble: 'bg-white border-slate-200 shadow-sm text-slate-800',
    botBubble: 'text-slate-800',
    inputBg: 'bg-white',
    borderColor: 'border-slate-200 shadow-sm',
    hover: 'hover:bg-slate-100'
  },
  cyberpunk: {
    name: 'Cyberpunk',
    bg: 'bg-black',
    sidebar: 'bg-black border-r border-pink-500/50',
    text: 'text-yellow-400',
    muted: 'text-cyan-600',
    accent: 'text-cyan-400',
    accentBg: 'bg-pink-600',
    userBubble: 'bg-gray-900 border-pink-500 text-yellow-200 shadow-[0_0_10px_rgba(236,72,153,0.3)]',
    botBubble: 'text-cyan-300 font-mono',
    inputBg: 'bg-black border-cyan-500/50',
    borderColor: 'border-pink-500/50',
    hover: 'hover:bg-pink-900/20'
  }
};

// --- SUB-COMPONENT: STREAMING MESSAGE ---
const StreamedMessage = ({ content, isFinal, theme }) => {
  const safeContent = typeof content === 'string' ? content : String(content || '');
  const [display, setDisplay] = useState(isFinal ? safeContent : '');

  useEffect(() => {
    if (isFinal) {
      setDisplay(safeContent);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      setDisplay(safeContent.slice(0, i));
      i += 5;
      if (i > safeContent.length) clearInterval(interval);
    }, 10);
    return () => clearInterval(interval);
  }, [safeContent, isFinal]);

  if (!display) return <span className={THEMES[theme].muted}>Loading...</span>;

  return (
    <div className={`prose max-w-none whitespace-pre-wrap ${theme === 'light' ? 'prose-slate' : 'prose-invert'}`}>
      {display}
    </div>
  );
};

// --- SUB-COMPONENT: SETTINGS MODAL ---
const SettingsModal = ({ isOpen, onClose, onClearHistory, currentTheme, onSetTheme }) => {
  if (!isOpen) return null;
  const t = THEMES[currentTheme];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className={`relative ${currentTheme === 'light' ? 'bg-white' : 'bg-slate-900'} border ${t.borderColor} rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${t.text}`}>Settings</h2>
          <button onClick={onClose} className={`p-1 rounded ${t.hover} transition-colors`}>
            <X size={20} className={t.muted} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Theme Section */}
          <div className="space-y-3">
            <h3 className={`text-sm font-semibold uppercase tracking-wider ${t.muted}`}>Appearance</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light', icon: Sun, label: 'Light' },
                { id: 'dark', icon: Moon, label: 'Dark' },
                { id: 'cyberpunk', icon: Zap, label: 'Cyberpunk' }
              ].map((Mode) => (
                <button
                  key={Mode.id}
                  onClick={() => onSetTheme(Mode.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${currentTheme === Mode.id
                      ? `${t.accentBg} text-white border-transparent`
                      : `bg-transparent ${t.borderColor} ${t.text} ${t.hover}`
                    }`}
                >
                  <Mode.icon size={20} className="mb-2" />
                  <span className="text-xs font-medium">{Mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Data Section */}
          <div className="space-y-3">
            <h3 className={`text-sm font-semibold uppercase tracking-wider ${t.muted}`}>Data & Privacy</h3>
            <button
              onClick={onClearHistory}
              className={`w-full flex items-center justify-between p-3 rounded-xl border ${t.borderColor} hover:bg-red-500/10 hover:border-red-500/50 transition-all group`}
            >
              <div className="flex items-center gap-3">
                <Trash2 size={18} className="text-red-400" />
                <span className={`${t.text} group-hover:text-red-500`}>Clear All History</span>
              </div>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- SUB-COMPONENT: SIDEBAR CONTENT ---
const SidebarContent = ({ onNewChat, onSettings, onHistoryClick, onDeleteSession, sessions = [], currentSessionId, theme }) => {
  const t = THEMES[theme];
  return (
    <div className={`flex flex-col h-full ${t.sidebar} transition-colors duration-300`}>
      <div className="p-4 overflow-hidden w-72">
        {/* Header / New Chat */}
        <button
          onClick={onNewChat}
          className={`w-full ${theme === 'light' ? 'bg-slate-200 hover:bg-slate-300' : 'bg-slate-800 hover:bg-slate-700'} ${t.text} font-medium py-3 px-4 rounded-xl flex items-center gap-3 transition-colors mb-6 border ${t.borderColor} shadow-sm group`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.accent}`}>
            <span className="text-xl leading-none mb-1">+</span>
          </div>
          <span>New Chat</span>
        </button>

        {/* Recent History */}
        <div className="space-y-6">
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 px-2 ${t.muted}`}>Recent</h3>
            <div className="space-y-1">
              {sessions.length > 0 ? (
                sessions.map((session) => (
                  <div key={session.id} className="group relative flex items-center">
                    <button
                      onClick={() => onHistoryClick(session.id)}
                      className={`w-full text-left p-2 pr-8 rounded-lg text-sm truncate transition-colors flex items-center gap-3 ${currentSessionId === session.id
                          ? (theme === 'cyberpunk' ? 'bg-pink-900/40 text-pink-400 border border-pink-500/30' : theme === 'light' ? 'bg-blue-50 text-blue-700' : 'bg-blue-900/30 text-blue-200')
                          : `${t.hover} ${t.muted} hover:${t.text}`
                        }`}
                    >
                      <Briefcase size={14} className={currentSessionId === session.id ? t.accent : 'opacity-50'} />
                      <span className="truncate">{session.title}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                      className="absolute right-2 p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Chat"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <p className={`text-xs px-2 italic ${t.muted}`}>No recent chats.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`mt-auto p-4 border-t ${t.borderColor} w-72`}>
        <button
          onClick={onSettings}
          className={`flex items-center gap-3 text-sm p-2 rounded-lg w-full transition-colors ${t.muted} ${t.hover}`}
        >
          <Settings size={18} />
          Settings
        </button>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: LEFT NAVIGATION ---
const LeftNav = (props) => {
  return (
    <>
      <AnimatePresence>
        {props.isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => props.setIsOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-72 shadow-2xl"
            >
              <SidebarContent {...props} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <div className="hidden md:block w-72 h-full z-30 relative shrink-0">
        <SidebarContent {...props} />
      </div>
    </>
  );
};

// --- SUB-COMPONENT: RIGHT SIDEBAR ---
const RightSidebar = ({ isOpen, setIsOpen, facts, strategy, theme }) => {
  const t = THEMES[theme];
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          className={`fixed md:relative right-0 top-0 h-full w-80 flex flex-col ${t.bg} border-l ${t.borderColor} z-50 shadow-2xl md:shadow-none transition-colors duration-300`}
        >
          <div className={`p-6 border-b ${t.borderColor} flex items-center justify-between`}>
            <h2 className={`font-bold text-sm tracking-wider uppercase ${t.muted}`}>Case Context</h2>
            <button onClick={() => setIsOpen(false)} className={`p-1 rounded ${t.hover} ${t.muted}`}>
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* Content similar to before, but using t.bg, t.text etc */}
            {Object.keys(facts).length > 0 ? (
              <div className="space-y-3">
                <div className={`text-xs font-bold uppercase tracking-wide ${t.muted}`}>Key Facts</div>
                {Object.entries(facts).map(([k, v]) => (
                  <div key={k} className={`text-sm p-3 rounded-lg border ${t.borderColor} ${theme === 'light' ? 'bg-white' : 'bg-slate-900'} ${t.text}`}>
                    <span className={`text-xs block mb-1 ${t.muted}`}>{k}</span>
                    {v}
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-12 ${t.muted}`}>
                <Briefcase size={32} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Context appears here.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function App() {
  // State
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEYS.THEME_PREF) || 'dark');
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hello. I am JurisLink v2. Please describe your legal issue.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Processing...");

  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [facts, setFacts] = useState({});
  const [strategy, setStrategy] = useState(null);
  const [docUrl, setDocUrl] = useState(null);
  const [backendState, setBackendState] = useState(null);

  const [isLeftNavOpen, setIsLeftNavOpen] = useState(false);
  const [isRightNavOpen, setIsRightNavOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const t = THEMES[theme];

  useEffect(() => localStorage.setItem(STORAGE_KEYS.THEME_PREF, theme), [theme]);
  useEffect(() => setSessions(loadSessionsIndex()), []);
  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);

  // Loading Loop
  useEffect(() => {
    if (!loading) return;
    const steps = ["🔍 Analyzing...", "🧠 Reasoning...", "⚖️ Reviewing...", "📝 Drafting..."];
    let i = 0;
    const interval = setInterval(() => { i = (i + 1) % steps.length; setLoadingText(steps[i]); }, 3500);
    return () => clearInterval(interval);
  }, [loading]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      setMessages(p => [...p, { role: 'assistant', content: '⏹️ Stopped.' }]);
    }
  };

  const handleNewChat = () => {
    if (messages.length > 1 && !window.confirm("Start new chat? Current view is saved in history.")) return;
    setMessages([{ role: 'assistant', content: 'Hello. I am JurisLink v2. Please describe your legal issue.' }]);
    setFacts({}); setStrategy(null); setBackendState(null); setDocUrl(null); setCurrentSessionId(null); setInput('');
    setIsLeftNavOpen(false);
  };

  const handleHistoryClick = (sid) => {
    const data = loadSessionFromStorage(sid);
    if (!data) return alert("Error loading session");
    setCurrentSessionId(sid);
    setMessages(data.messages || []);
    setFacts(data.facts || {});
    setStrategy(data.strategy || null);
    setBackendState(data.backendState || null);
    setDocUrl(null);
    setIsLeftNavOpen(false);
  };

  const handleDeleteSession = (sid) => {
    if (window.confirm("Are you sure you want to delete this case? This cannot be undone.")) {
      const newSessions = deleteSessionFromStorage(sid);
      setSessions(newSessions);
      if (currentSessionId === sid) handleNewChat(); // Reset if deleting active
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("WARNING: This will permanently delete ALL chat history!")) {
      localStorage.clear();
      setSessions([]);
      handleNewChat();
      setIsSettingsOpen(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const data = await sendMessage(input, updatedMessages, backendState, abortControllerRef.current.signal);

      // Update State
      const newBackendState = data.final_state || backendState;
      const newFacts = data.facts || facts;
      const newStrategy = data.strategy || strategy;

      setBackendState(newBackendState);
      setFacts(newFacts);
      setStrategy(newStrategy);

      if (data.docs?.demand_letter) {
        const blob = new Blob([Uint8Array.from(atob(data.docs.demand_letter), c => c.charCodeAt(0))], { type: "application/pdf" });
        setDocUrl(URL.createObjectURL(blob));
      }

      const responseMsg = { role: 'assistant', content: data.response, isError: !!data.error, error: data.error, errorSource: data.errorSource };
      const finalMessages = [...updatedMessages, responseMsg];
      setMessages(finalMessages);

      // Persistence & Auto-Title
      const activeSessionId = currentSessionId || generateId();
      if (!currentSessionId) setCurrentSessionId(activeSessionId);

      // Auto-Title Logic
      let sessionTitle = "New Consultation";
      if (newFacts.Legal_Issue && newFacts.Jurisdiction) {
        sessionTitle = `${newFacts.Legal_Issue} - ${newFacts.Jurisdiction}`;
      } else if (finalMessages.find(m => m.role === 'user')) {
        const firstUser = finalMessages.find(m => m.role === 'user');
        sessionTitle = firstUser.content.slice(0, 30) + (firstUser.content.length > 30 ? "..." : "");
      }
      // If editing existing, keep title unless we just established facts? 
      // For now, always update title if facts are present to refine it.

      const updatedIndex = saveSessionToStorage(activeSessionId, {
        messages: finalMessages, facts: newFacts, strategy: newStrategy, backendState: newBackendState
      }, sessionTitle);
      setSessions(updatedIndex);

    } catch (error) {
      if (error.message !== "CANCELLED") setMessages(p => [...p, { role: 'assistant', content: "**Connection Error**" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex h-screen ${t.bg} ${t.text} font-sans overflow-hidden transition-colors duration-300 selection:bg-blue-500/30`}>

      {/* LEFT NAV */}
      <LeftNav
        isOpen={isLeftNavOpen} setIsOpen={setIsLeftNavOpen}
        onNewChat={handleNewChat} onSettings={() => setIsSettingsOpen(true)}
        onHistoryClick={handleHistoryClick}
        onDeleteSession={handleDeleteSession}
        sessions={sessions} currentSessionId={currentSessionId}
        theme={theme}
      />

      {/* SETTINGS */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}
            onClearHistory={handleClearHistory}
            currentTheme={theme} onSetTheme={setTheme}
          />
        )}
      </AnimatePresence>

      {/* MAIN CHAT */}
      <div className={`flex-1 flex flex-col relative w-full h-full ${theme === 'dark' ? 'bg-slate-900/20' : ''}`}>

        {/* Header */}
        <div className={`h-16 border-b ${t.borderColor} ${t.bg}/80 backdrop-blur flex items-center justify-between px-6 z-10 transition-colors`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsLeftNavOpen(true)} className={`md:hidden p-2 rounded-lg ${t.muted}`}>
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg shadow-lg" />
              <h1 className="font-semibold text-lg tracking-tight">JURISLINK <span className={`text-xs font-mono ml-2 ${t.muted}`}>v2.1</span></h1>
            </div>
          </div>
          <button onClick={() => setIsRightNavOpen(!isRightNavOpen)} className={`p-2 rounded-lg flex items-center gap-2 ${t.hover} ${t.muted}`}>
            <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wide">Case Info</span>
            <Briefcase size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 scrollbar-thin">
          {messages.map((msg, idx) => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex gap-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start max-w-4xl mx-auto'}`}>
              {msg.role !== 'user' && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 border border-slate-700/50 ${theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'}`}>
                  <Bot size={16} className={t.accent} />
                </div>
              )}
              <div className={`rounded-2xl p-5 shadow-sm max-w-[85%] ${msg.role === 'user' ? t.userBubble : `bg-transparent w-full px-0 ${t.botBubble}`}`}>
                {msg.role === 'user' ? (<div className="whitespace-pre-wrap">{msg.content}</div>) : (
                  <StreamedMessage content={msg.content} isFinal={!loading || idx < messages.length - 1} theme={theme} />
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="max-w-4xl mx-auto flex gap-6">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center animate-pulse ${theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'}`}>
                <div className={`w-2 h-2 rounded-full ${t.accentBg}`} />
              </div>
              <span className={`text-sm font-mono tracking-wide animate-pulse ${t.muted}`}>{loadingText}</span>
            </div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input */}
        <div className={`p-4 ${t.bg}/80 backdrop-blur border-t ${t.borderColor}`}>
          <div className={`max-w-3xl mx-auto rounded-3xl border focus-within:ring-1 transition-all shadow-xl relative ${t.inputBg} ${t.borderColor} ${theme === 'cyberpunk' ? 'focus-within:ring-cyan-500' : 'focus-within:ring-blue-500'}`}>
            <TextareaAutosize
              minRows={1} maxRows={6}
              className={`w-full bg-transparent placeholder-slate-500 px-6 py-4 pr-14 resize-none outline-none leading-relaxed ${t.text}`}
              placeholder="Describe your legal situation..."
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={loading}
            />
            {loading ? (
              <button onClick={handleStop} className="absolute right-2 bottom-2 p-2 bg-red-600 hover:bg-red-500 rounded-full text-white transition-all shadow-lg">
                <StopCircle size={20} />
              </button>
            ) : (
              <button onClick={handleSend} disabled={!input.trim()} className={`absolute right-2 bottom-2 p-2 rounded-full text-white disabled:opacity-0 disabled:scale-75 transition-all shadow-lg ${t.accentBg}`}>
                <Send size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      <RightSidebar isOpen={isRightNavOpen} setIsOpen={setIsRightNavOpen} facts={facts} strategy={strategy} theme={theme} />
    </div>
  );
}

export default App;
