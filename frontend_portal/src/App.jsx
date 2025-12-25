import React, { useState, useRef, useEffect } from 'react';
import { sendMessage } from './api';
import { Send, Plus, MessageSquare, ChevronDown, ChevronRight, FileText, Download, Loader2, User, Bot, Moon, Sun, Zap } from 'lucide-react';

// ============ THEME CONFIGURATION ============
const themes = {
  dark: {
    name: 'Dark',
    icon: Moon,
    bg: 'bg-zinc-950',
    bgSecondary: 'bg-zinc-900',
    card: 'bg-zinc-800',
    cardHover: 'hover:bg-zinc-700',
    border: 'border-zinc-700',
    text: 'text-zinc-100',
    textMuted: 'text-zinc-400',
    textDimmed: 'text-zinc-500',
    accent: 'blue',
    accentBg: 'bg-blue-600',
    accentHover: 'hover:bg-blue-500',
    accentText: 'text-blue-400',
    gradient: 'from-blue-500 to-purple-600',
  },
  light: {
    name: 'Light',
    icon: Sun,
    bg: 'bg-slate-50',
    bgSecondary: 'bg-white',
    card: 'bg-slate-100',
    cardHover: 'hover:bg-slate-200',
    border: 'border-slate-200',
    text: 'text-slate-900',
    textMuted: 'text-slate-500',
    textDimmed: 'text-slate-400',
    accent: 'blue',
    accentBg: 'bg-blue-600',
    accentHover: 'hover:bg-blue-500',
    accentText: 'text-blue-600',
    gradient: 'from-blue-500 to-indigo-600',
  },
  cyberpunk: {
    name: 'Cyber',
    icon: Zap,
    bg: 'bg-black',
    bgSecondary: 'bg-zinc-950',
    card: 'bg-zinc-900',
    cardHover: 'hover:bg-zinc-800',
    border: 'border-fuchsia-500/40',
    text: 'text-fuchsia-50',
    textMuted: 'text-fuchsia-300',
    textDimmed: 'text-fuchsia-400/60',
    accent: 'fuchsia',
    accentBg: 'bg-fuchsia-600',
    accentHover: 'hover:bg-fuchsia-500',
    accentText: 'text-fuchsia-400',
    gradient: 'from-fuchsia-500 to-cyan-400',
  }
};

function App() {
  // Theme State
  const [theme, setTheme] = useState('dark');
  const t = themes[theme];

  // Case History State
  const [cases, setCases] = useState([
    { id: 1, title: 'Current Case', messages: [{ role: 'assistant', content: 'Hello! I\'m your JurisLink legal assistant. Tell me about your situation and I\'ll help you understand your legal options.' }], facts: {}, strategy: null, docUrl: null }
  ]);
  const [activeCaseId, setActiveCaseId] = useState(1);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Panel States
  const [showDetails, setShowDetails] = useState(false);

  const messagesEndRef = useRef(null);

  // Get active case
  const activeCase = cases.find(c => c.id === activeCaseId) || cases[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeCase?.messages]);

  const createNewCase = () => {
    const newId = Math.max(...cases.map(c => c.id)) + 1;
    const newCase = {
      id: newId,
      title: `Case #${newId}`,
      messages: [{ role: 'assistant', content: 'Hello! I\'m your JurisLink legal assistant. Tell me about your situation and I\'ll help you understand your legal options.' }],
      facts: {},
      strategy: null,
      docUrl: null
    };
    setCases([...cases, newCase]);
    setActiveCaseId(newId);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };

    // Update active case messages
    setCases(prev => prev.map(c =>
      c.id === activeCaseId
        ? { ...c, messages: [...c.messages, userMsg] }
        : c
    ));

    setInput('');
    setLoading(true);

    try {
      const data = await sendMessage(input, activeCase.messages);

      const botMsg = { role: 'assistant', content: data.response };

      // Update case with new message and any extracted data
      setCases(prev => prev.map(c => {
        if (c.id !== activeCaseId) return c;

        let updatedCase = { ...c, messages: [...c.messages, userMsg, botMsg] };

        if (data.facts && Object.keys(data.facts).length > 0) {
          updatedCase.facts = data.facts;
          // Update case title based on client name
          if (data.facts.client_name) {
            updatedCase.title = `${data.facts.client_name} Case`;
          }
        }
        if (data.strategy) {
          updatedCase.strategy = data.strategy;
        }
        if (data.docs && data.docs.demand_letter) {
          const byteCharacters = atob(data.docs.demand_letter);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: "application/pdf" });
          updatedCase.docUrl = URL.createObjectURL(blob);
        }

        return updatedCase;
      }));

    } catch (error) {
      setCases(prev => prev.map(c =>
        c.id === activeCaseId
          ? { ...c, messages: [...c.messages, userMsg, { role: 'assistant', content: "I apologize, but I'm having trouble connecting to the legal analysis service. Please try again." }] }
          : c
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex h-screen ${t.bg} ${t.text} transition-colors duration-300`}>

      {/* SIDEBAR */}
      <div className={`w-72 ${t.bgSecondary} flex flex-col border-r ${t.border} transition-colors duration-300`}>
        {/* Logo */}
        <div className={`p-4 border-b ${t.border}`}>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="JurisLink" className="w-10 h-10 rounded-xl shadow-lg" />
            <div>
              <h1 className="font-bold text-lg">JurisLink</h1>
              <p className={`text-xs ${t.textDimmed}`}>Legal AI Assistant</p>
            </div>
          </div>
        </div>

        {/* New Case Button */}
        <div className="p-3">
          <button
            onClick={createNewCase}
            className={`w-full flex items-center gap-2 px-4 py-3 ${t.card} ${t.cardHover} rounded-xl text-sm font-medium transition-all border ${t.border}`}
          >
            <Plus size={18} /> New Case
          </button>
        </div>

        {/* Case History */}
        <div className="flex-1 overflow-y-auto px-3">
          <p className={`text-xs font-semibold ${t.textDimmed} uppercase tracking-wider mb-2 px-2`}>Case History</p>
          <div className="space-y-1">
            {cases.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCaseId(c.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all text-left ${c.id === activeCaseId
                  ? `${t.card} ${t.text} border ${t.border}`
                  : `${t.textMuted} ${t.cardHover}`
                  }`}
              >
                <MessageSquare size={16} />
                <span className="truncate flex-1">{c.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme Toggle */}
        <div className={`p-3 border-t ${t.border}`}>
          <div className={`flex ${t.card} rounded-xl p-1 gap-1`}>
            {Object.entries(themes).map(([key, themeConfig]) => {
              const IconComponent = themeConfig.icon;
              return (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  title={themeConfig.name}
                  className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all ${theme === key
                      ? `${t.bg} ${t.accentText} shadow-sm`
                      : `${t.textMuted} hover:${t.text}`
                    }`}
                >
                  <IconComponent size={16} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col">
        {/* Cyberpunk grid effect */}
        {theme === 'cyberpunk' && (
          <div
            className="absolute inset-0 pointer-events-none opacity-5"
            style={{
              backgroundImage: `linear-gradient(rgba(217, 70, 239, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(217, 70, 239, 0.3) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />
        )}

        {/* Header */}
        <div className={`h-14 border-b ${t.border} flex items-center justify-between px-6 ${t.bgSecondary}/80 backdrop-blur-sm relative z-10 transition-colors duration-300`}>
          <h2 className="font-medium">{activeCase.title}</h2>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${t.textMuted} hover:${t.text} ${t.cardHover} transition-all`}
          >
            Case Details
            {showDetails ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Collapsible Details Panel */}
        {showDetails && (Object.keys(activeCase.facts).length > 0 || activeCase.strategy || activeCase.docUrl) && (
          <div className={`border-b ${t.border} ${t.bgSecondary}/50 p-4 relative z-10 transition-colors duration-300`}>
            <div className="max-w-4xl mx-auto flex flex-wrap gap-4">
              {/* Facts Dropdown */}
              {Object.keys(activeCase.facts).length > 0 && (
                <div className={`flex-1 min-w-[200px] ${t.card}/50 rounded-xl p-4 border ${t.border}`}>
                  <h4 className={`text-xs font-semibold ${t.accentText} uppercase tracking-wider mb-3`}>Extracted Facts</h4>
                  <div className="space-y-2">
                    {Object.entries(activeCase.facts).map(([k, v]) => (
                      <div key={k} className="text-sm">
                        <span className={`${t.textDimmed} capitalize`}>{k.replace(/_/g, ' ')}:</span>{' '}
                        <span className={t.text}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategy Summary */}
              {activeCase.strategy && (
                <div className={`flex-1 min-w-[200px] ${t.card}/50 rounded-xl p-4 border ${t.border}`}>
                  <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">Strategy Ready</h4>
                  <p className={`text-sm ${t.textMuted} line-clamp-3`}>{activeCase.strategy.substring(0, 150)}...</p>
                  <button
                    className="text-xs text-green-400 hover:underline mt-2"
                    onClick={() => alert(activeCase.strategy)}
                  >
                    View Full Strategy →
                  </button>
                </div>
              )}

              {/* Download Button */}
              {activeCase.docUrl && (
                <div className={`flex-1 min-w-[200px] bg-gradient-to-br ${t.gradient}/20 rounded-xl p-4 border ${t.border}`}>
                  <h4 className={`text-xs font-semibold ${t.accentText} uppercase tracking-wider mb-3`}>Document Ready</h4>
                  <a
                    href={activeCase.docUrl}
                    download="Demand_Letter.pdf"
                    className={`flex items-center justify-center gap-2 w-full ${t.accentBg} ${t.accentHover} text-white py-2 rounded-lg font-medium text-sm transition-all`}
                  >
                    <Download size={16} /> Download PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto relative z-10">
          <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
            {activeCase.messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.gradient} flex items-center justify-center shrink-0 shadow-lg`}>
                    <Bot size={18} className="text-white" />
                  </div>
                )}

                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                  <div className={`px-4 py-3 rounded-2xl ${msg.role === 'user'
                    ? `${t.accentBg} text-white`
                    : `${t.card} ${t.text} border ${t.border}`
                    } transition-colors duration-300`}>
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.content}</p>
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className={`w-8 h-8 rounded-lg ${t.accentBg} flex items-center justify-center shrink-0 shadow-lg`}>
                    <User size={18} className="text-white" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.gradient} flex items-center justify-center animate-pulse`}>
                  <Bot size={18} className="text-white" />
                </div>
                <div className={`${t.card} px-4 py-3 rounded-2xl flex items-center gap-3 border ${t.border}`}>
                  <Loader2 className={`animate-spin ${t.accentText}`} size={18} />
                  <span className={`${t.textMuted} text-sm`}>Analyzing your case...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t ${t.border} ${t.bgSecondary}/80 backdrop-blur-sm relative z-10 transition-colors duration-300`}>
          <div className="max-w-3xl mx-auto">
            <div className={`relative ${t.card} rounded-2xl border ${t.border} focus-within:ring-2 focus-within:ring-${t.accent}-500/50 transition-all`}>
              <input
                type="text"
                className={`w-full bg-transparent px-4 py-4 pr-14 text-[15px] focus:outline-none ${t.text} placeholder:${t.textDimmed}`}
                placeholder="Describe your legal situation..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 ${t.accentBg} ${t.accentHover} rounded-xl text-white transition-all disabled:opacity-30`}
              >
                <Send size={18} />
              </button>
            </div>
            <p className={`text-center text-xs ${t.textDimmed} mt-3`}>
              JurisLink provides legal information, not legal advice. Always consult a licensed attorney.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
