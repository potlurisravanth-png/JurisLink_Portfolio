import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TextareaAutosize from 'react-textarea-autosize';
import { sendMessage } from './api';
import { Send, FileText, Download, Briefcase, StopCircle, Bot, X, Menu, AlertTriangle, Settings, Trash2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- SUB-COMPONENT: STREAMING MESSAGE ---
const StreamedMessage = ({ content, isFinal }) => {
  // Safeguard: ensure content is always a pure string
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

  // Don't render if nothing to show
  if (!display) {
    return <span className="text-slate-400">Loading...</span>;
  }

  return (
    <div className="prose prose-invert prose-p:leading-relaxed max-w-none whitespace-pre-wrap text-slate-200">
      {display || ""}
    </div>
  );
};

// --- SUB-COMPONENT: ERROR CARD ---
const ErrorCard = ({ error, errorSource }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-2xl mx-auto my-4"
  >
    <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-800/50 rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={20} className="text-red-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-red-200 mb-1">Processing Issue</h3>
          {errorSource && (
            <p className="text-xs text-red-400/80 mb-2 font-mono">Source: {errorSource}</p>
          )}
          <p className="text-sm text-red-100/80">{error}</p>
          <p className="text-xs text-slate-500 mt-3">Try simplifying your query or check back later.</p>
        </div>
      </div>
    </div>
  </motion.div>
);

// --- SUB-COMPONENT: SETTINGS MODAL ---
const SettingsModal = ({ isOpen, onClose, onClearHistory }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-200">Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Theme Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Appearance</h3>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="text-slate-300">Dark Mode</span>
              <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>

          {/* Data Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Data & Privacy</h3>
            <button
              onClick={onClearHistory}
              className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-red-900/20 rounded-xl border border-slate-800 hover:border-red-900/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Trash2 size={18} className="text-slate-400 group-hover:text-red-400" />
                <span className="text-slate-300 group-hover:text-red-200">Clear Conversation History</span>
              </div>
            </button>
          </div>

          {/* About Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">About</h3>
            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-800 text-center">
              <p className="text-slate-300 font-medium">JurisLink v2.1.0</p>
              <p className="text-xs text-slate-500 mt-1">Prod-Ready Build • Powered by Legal Brain</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium text-sm"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- SUB-COMPONENT: SIDEBAR CONTENT ---
const SidebarContent = ({ onNewChat, onSettings, onHistoryClick }) => {
  const history = [
    { title: "Wrongful Termination - CA", date: "Today" },
    { title: "Wage Theft Inquiry", date: "Yesterday" },
    { title: "Harassment Policy Check", date: "Last Week" },
  ];
  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800">
      <div className="p-4 overflow-hidden w-72">
        {/* Header / New Chat */}
        <button
          onClick={onNewChat}
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-3 px-4 rounded-xl flex items-center gap-3 transition-colors mb-6 border border-slate-700 shadow-sm group"
        >
          <div className="w-8 h-8 rounded-full bg-slate-700 group-hover:bg-slate-600 flex items-center justify-center text-blue-400">
            <span className="text-xl leading-none mb-1">+</span>
          </div>
          <span>New Chat</span>
        </button>

        {/* Recent History */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">Recent</h3>
            <div className="space-y-1">
              {history.map((item, i) => (
                <button
                  key={i}
                  onClick={() => onHistoryClick(item.title)}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-sm truncate transition-colors flex items-center gap-3 group"
                >
                  <Briefcase size={14} className="opacity-50 group-hover:opacity-100" />
                  <span className="truncate">{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-slate-900 w-72">
        <button
          onClick={onSettings}
          className="flex items-center gap-3 text-slate-500 hover:text-slate-300 text-sm p-2 rounded-lg hover:bg-slate-900 w-full transition-colors"
        >
          <Settings size={18} />
          Settings
        </button>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: LEFT NAVIGATION (Gemini Style) ---
const LeftNav = ({ isOpen, setIsOpen, onNewChat, onSettings, onHistoryClick }) => {
  return (
    <>
      {/* MOBILE: Slide-out Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 shadow-2xl"
            >
              <SidebarContent onNewChat={onNewChat} onSettings={onSettings} onHistoryClick={onHistoryClick} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP: Static Sidebar */}
      <div className="hidden md:block w-72 h-full z-30 relative shrink-0">
        <SidebarContent onNewChat={onNewChat} onSettings={onSettings} onHistoryClick={onHistoryClick} />
      </div>
    </>
  );
};

// --- SUB-COMPONENT: RIGHT SIDEBAR (Case Context) ---
const RightSidebar = ({ isOpen, setIsOpen, facts, strategy }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed md:relative right-0 top-0 h-full w-80 flex flex-col bg-slate-950 border-l border-slate-800 z-50 shadow-2xl md:shadow-none"
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-slate-400 text-sm tracking-wider uppercase">Case Context</h2>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Facts Widget */}
          {Object.keys(facts).length > 0 ? (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Key Facts</div>
              {Object.entries(facts).map(([k, v]) => (
                <div key={k} className="text-sm bg-slate-900 p-3 rounded-lg text-slate-300 border border-slate-800">
                  <span className="text-slate-500 text-xs block mb-1">{k}</span>
                  {v}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-600">
              <Briefcase size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Case details will appear here as extracted from your conversation.</p>
            </div>
          )}

          {/* Strategy Widget */}
          {strategy && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Strategy Summary</div>
              <div className="text-sm bg-blue-900/10 p-4 rounded-lg text-blue-200 border border-blue-900/30">
                {typeof strategy === 'string' ? strategy : JSON.stringify(strategy, null, 2)}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello. I am JurisLink v2. Please describe your legal issue.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Processing...");

  // Navigation State
  const [isLeftNavOpen, setIsLeftNavOpen] = useState(false); // Mobile toggle
  const [isRightNavOpen, setIsRightNavOpen] = useState(false); // Context toggle
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Settings modal

  // Data State
  const [facts, setFacts] = useState({});
  const [strategy, setStrategy] = useState(null);
  const [docUrl, setDocUrl] = useState(null);
  const [backendState, setBackendState] = useState(null);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Thinking Loop
  useEffect(() => {
    if (!loading) return;
    const steps = ["🔍 Scanning Local Statutes...", "🧠 Drafting Initial Strategy...", "⚖️ Adversarial Critic Review...", "📝 Synthesizing Documents..."];
    let i = 0;
    setLoadingText(steps[0]);
    const interval = setInterval(() => {
      i = (i + 1) % steps.length;
      setLoadingText(steps[i]);
    }, 3500);
    return () => clearInterval(interval);
  }, [loading]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      setMessages(prev => [...prev, { role: 'assistant', content: '⏹️ *Generation stopped by user.*' }]);
    }
  };

  const handleNewChat = () => {
    if (window.confirm("Start a new chat? This will clear current progress.")) {
      window.location.reload();
    }
  };

  const handleSettings = () => setIsSettingsOpen(true);

  const handleHistoryClick = (title) => {
    // In a real app, this would load the chat ID
    alert(`Load chat: ${title}\n(Feature coming in next update!)`);
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all history?")) {
      alert("History cleared!");
      setIsSettingsOpen(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const data = await sendMessage(input, messages, backendState, abortControllerRef.current.signal);

      if (data.final_state) setBackendState(data.final_state);
      if (data.facts) setFacts(data.facts);
      if (data.strategy) setStrategy(data.strategy);

      if (data.docs?.demand_letter) {
        const blob = new Blob([Uint8Array.from(atob(data.docs.demand_letter), c => c.charCodeAt(0))], { type: "application/pdf" });
        setDocUrl(URL.createObjectURL(blob));
      }

      const responseMsg = {
        role: 'assistant',
        content: data.response,
        isError: data.status === 'error' || data.status === 'critical_error' || data.final_state?.error,
        error: data.error,
        errorSource: data.error_source
      };
      setMessages(prev => [...prev, responseMsg]);

    } catch (error) {
      if (error.message !== "CANCELLED") {
        setMessages(prev => [...prev, { role: 'assistant', content: "**Error:** Connection to Legal Brain failed." }]);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden selection:bg-blue-500/30">

      {/* 1. LEFT NAVIGATION */}
      <LeftNav
        isOpen={isLeftNavOpen}
        setIsOpen={setIsLeftNavOpen}
        onNewChat={handleNewChat}
        onSettings={handleSettings}
        onHistoryClick={handleHistoryClick}
      />

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onClearHistory={handleClearHistory}
          />
        )}
      </AnimatePresence>

      {/* 2. MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col relative w-full h-full bg-slate-900/20">

        {/* Header */}
        <div className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center gap-4">
            {/* Mobile: Toggle Left Nav */}
            <button onClick={() => setIsLeftNavOpen(true)} className="md:hidden p-2 hover:bg-slate-800 rounded-lg text-slate-400">
              <Menu size={20} />
            </button>

            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="JurisLink Logo" className="w-8 h-8 rounded-lg shadow-lg shadow-blue-900/20" />
              <h1 className="font-semibold text-lg tracking-tight text-slate-200">JURISLINK <span className="text-slate-500 text-xs font-mono ml-2">v2.1</span></h1>
            </div>
          </div>

          {/* Toggle Right Context Sidebar */}
          <button
            onClick={() => setIsRightNavOpen(!isRightNavOpen)}
            className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${isRightNavOpen ? 'bg-blue-900/20 text-blue-400' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wide">Case Info</span>
            <Briefcase size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {messages.map((msg, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx}
              className={`flex gap-4 sm:gap-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start max-w-4xl mx-auto'}`}
            >
              {msg.role !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot size={16} className="text-blue-400" />
                </div>
              )}

              <div className={`rounded-2xl p-5 shadow-sm ${msg.role === 'user'
                ? 'bg-slate-800 text-slate-100 max-w-[85%] border border-slate-700'
                : 'bg-transparent text-slate-200 w-full px-0'
                }`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : msg.isError ? (
                  <>
                    <StreamedMessage content={msg.content} isFinal={true} />
                    <ErrorCard error={msg.error} errorSource={msg.errorSource} />
                  </>
                ) : (
                  <StreamedMessage content={msg.content} isFinal={!loading || idx < messages.length - 1} />
                )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <div className="max-w-4xl mx-auto flex gap-6">
              <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center animate-pulse">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <span className="text-sm font-mono tracking-wide animate-pulse">{loadingText}</span>
              </div>
            </div>
          )}

          {/* Download Card */}
          <AnimatePresence>
            {docUrl && !loading && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto mt-8">
                <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-800/50 rounded-xl p-6 flex items-center gap-4 hover:border-emerald-500/50 transition-colors cursor-pointer group" onClick={() => window.open(docUrl)}>
                  <div className="w-12 h-12 bg-emerald-600/20 rounded-full flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all text-emerald-400">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-100">Legal Strategy Ready</h3>
                    <p className="text-xs text-emerald-400/80">PDF includes Adversarial Analysis</p>
                  </div>
                  <Download className="ml-auto text-emerald-500 group-hover:translate-y-1 transition-transform" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-950/80 backdrop-blur border-t border-slate-800/50">
          <div className="max-w-3xl mx-auto bg-slate-900 rounded-3xl border border-slate-800 focus-within:border-slate-600 focus-within:ring-1 focus-within:ring-slate-600 transition-all shadow-2xl relative">
            <TextareaAutosize
              minRows={1}
              maxRows={6}
              className="w-full bg-transparent text-slate-200 placeholder-slate-500 px-6 py-4 pr-14 resize-none outline-none leading-relaxed"
              placeholder="Describe your legal situation..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={loading}
            />
            {loading ? (
              <button
                onClick={handleStop}
                className="absolute right-2 bottom-2 p-2 bg-red-600 hover:bg-red-500 rounded-full text-white transition-all shadow-lg"
                title="Stop generation"
              >
                <StopCircle size={20} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="absolute right-2 bottom-2 p-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white disabled:opacity-0 disabled:scale-75 transition-all shadow-lg"
              >
                <Send size={20} />
              </button>
            )}
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-3">
            JurisLink can make mistakes. Please verify important legal information.
          </p>
        </div>
      </div>

      {/* 3. RIGHT SIDEBAR (Context) */}
      <RightSidebar isOpen={isRightNavOpen} setIsOpen={setIsRightNavOpen} facts={facts} strategy={strategy} />

    </div>
  );
}

export default App;
