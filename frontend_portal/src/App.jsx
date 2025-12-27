import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TextareaAutosize from 'react-textarea-autosize';
import { sendMessage } from './api';
import { Send, FileText, Download, Briefcase, StopCircle, Bot, X, Menu, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- SUB-COMPONENT: STREAMING MESSAGE ---
const StreamedMessage = ({ content, isFinal }) => {
  const [display, setDisplay] = useState(isFinal ? content : "");

  useEffect(() => {
    if (isFinal) {
      setDisplay(content);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      setDisplay(content.slice(0, i));
      i += 5;
      if (i > content.length) clearInterval(interval);
    }, 10);
    return () => clearInterval(interval);
  }, [content, isFinal]);

  return (
    <ReactMarkdown
      className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 max-w-none"
      remarkPlugins={[remarkGfm]}
    >
      {display}
    </ReactMarkdown>
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

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello. I am JurisLink v2. Please describe your legal issue.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Processing...");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start closed on mobile

  // Data State
  const [facts, setFacts] = useState({});
  const [strategy, setStrategy] = useState(null);
  const [docUrl, setDocUrl] = useState(null);
  const [backendState, setBackendState] = useState(null);
  const messagesEndRef = useRef(null);

  // 🛑 STOP CONTROL: AbortController ref
  const abortControllerRef = useRef(null);

  // Scroll to bottom
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

  // 🛑 STOP GENERATION HANDLER
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      setMessages(prev => [...prev, { role: 'assistant', content: '⏹️ *Generation stopped by user.*' }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Create new AbortController for this request
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

      // Check for backend error state (graceful failure)
      if (data.status === 'error' || data.status === 'critical_error' || data.final_state?.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          isError: true,
          error: data.error,
          errorSource: data.error_source
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }

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

      {/* --- MOBILE SIDEBAR OVERLAY --- */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* --- MAIN CHAT --- */}
      <div className="flex-1 flex flex-col relative">
        {/* HEADER */}
        <div className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/20">JL</div>
            <h1 className="font-semibold text-lg tracking-tight text-slate-200">JURISLINK <span className="text-slate-500 text-xs font-mono ml-2">v2.1</span></h1>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden md:block p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
            <Briefcase size={20} />
          </button>
        </div>

        {/* MESSAGES AREA */}
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

          {/* THINKING INDICATOR */}
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

          {/* DOWNLOAD CARD */}
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

        {/* INPUT AREA */}
        <div className="p-4 bg-slate-950">
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
            {/* 🛑 CONDITIONAL SEND/STOP BUTTON */}
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

      {/* --- SIDEBAR (Desktop: Static, Mobile: Slide-out) --- */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed md:relative right-0 top-0 h-full w-80 flex flex-col bg-slate-900 border-l border-slate-800 z-50"
          >
            {/* Sidebar Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-slate-400 text-sm tracking-wider uppercase">Case Context</h2>
              {/* Mobile close button */}
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden p-1 hover:bg-slate-800 rounded text-slate-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {/* Facts Widget */}
              {Object.keys(facts).length > 0 ? (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Key Facts</div>
                  {Object.entries(facts).map(([k, v]) => (
                    <div key={k} className="text-sm bg-slate-800/50 p-3 rounded-lg text-slate-300 border border-slate-700/50">
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
                  <div className="text-sm bg-blue-900/20 p-4 rounded-lg text-blue-200 border border-blue-800/30">
                    {typeof strategy === 'string' ? strategy : JSON.stringify(strategy, null, 2)}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop: Always visible sidebar toggle */}
      {!isSidebarOpen && (
        <div className="hidden md:flex flex-col bg-slate-900 border-l border-slate-800 w-12 items-center py-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
            title="Open sidebar"
          >
            <Briefcase size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
