import React, { useState, useRef, useEffect } from 'react';
import { sendMessage } from './api';
import { Send, Plus, MessageSquare, ChevronDown, ChevronRight, Download, Loader2, User, Bot, Moon, Sun, Zap, Globe, Trash2, Save, FileDown } from 'lucide-react';

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

// ============ LANGUAGE CONFIGURATION ============
const languages = {
  en: { name: 'English', flag: '🇺🇸' },
  es: { name: 'Español', flag: '🇪🇸' },
  fr: { name: 'Français', flag: '🇫🇷' },
  zh: { name: '中文', flag: '🇨🇳' },
  hi: { name: 'हिन्दी', flag: '🇮🇳' }
};

// ============ STATUS BADGES ============
const getStatusBadge = (caseData) => {
  if (caseData.docUrl) return { label: 'Complete', color: 'bg-green-500' };
  if (caseData.strategy) return { label: 'Strategy', color: 'bg-purple-500' };
  if (Object.keys(caseData.facts || {}).length > 0) return { label: 'Research', color: 'bg-blue-500' };
  if (caseData.messages?.length > 1) return { label: 'Interview', color: 'bg-yellow-500' };
  return { label: 'New', color: 'bg-zinc-500' };
};

// ============ LOCAL STORAGE KEYS ============
const STORAGE_KEYS = {
  CASES: 'jurislink_cases',
  THEME: 'jurislink_theme',
  LANGUAGE: 'jurislink_language'
};

function App() {
  // Theme State (with persistence)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  });
  const t = themes[theme];

  // Language State (with persistence)
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'en';
  });
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // Case History State (with persistence)
  const [cases, setCases] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CASES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load cases:', e);
      }
    }
    return [
      { id: 1, title: 'Current Case', messages: [{ role: 'assistant', content: 'Hello! I\'m your JurisLink legal assistant. Tell me about your situation and I\'ll help you understand your legal options.' }], facts: {}, strategy: null, docUrl: null }
    ];
  });
  const [activeCaseId, setActiveCaseId] = useState(1);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Panel States
  const [showDetails, setShowDetails] = useState(false);

  const messagesEndRef = useRef(null);

  // Get active case
  const activeCase = cases.find(c => c.id === activeCaseId) || cases[0];

  // ============ PERSISTENCE EFFECTS ============
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
  }, [language]);

  useEffect(() => {
    // Save cases (excluding blob URLs which can't be serialized)
    const casesToSave = cases.map(c => ({
      ...c,
      docUrl: null // Can't persist blob URLs
    }));
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(casesToSave));
  }, [cases]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeCase?.messages]);

  // ============ CASE MANAGEMENT ============
  const createNewCase = () => {
    const newId = Math.max(...cases.map(c => c.id)) + 1;
    const greetings = {
      en: 'Hello! I\'m your JurisLink legal assistant. Tell me about your situation and I\'ll help you understand your legal options.',
      es: '¡Hola! Soy tu asistente legal de JurisLink. Cuéntame sobre tu situación y te ayudaré a entender tus opciones legales.',
      fr: 'Bonjour! Je suis votre assistant juridique JurisLink. Parlez-moi de votre situation et je vous aiderai à comprendre vos options légales.',
      zh: '您好！我是您的JurisLink法律助手。请告诉我您的情况，我将帮助您了解您的法律选择。',
      hi: 'नमस्ते! मैं आपका JurisLink कानूनी सहायक हूं। मुझे अपनी स्थिति के बारे में बताएं और मैं आपके कानूनी विकल्पों को समझने में आपकी मदद करूंगा।'
    };
    const newCase = {
      id: newId,
      title: `Case #${newId}`,
      messages: [{ role: 'assistant', content: greetings[language] || greetings.en }],
      facts: {},
      strategy: null,
      docUrl: null
    };
    setCases([...cases, newCase]);
    setActiveCaseId(newId);
  };

  const deleteCase = (caseId) => {
    if (cases.length <= 1) {
      alert('Cannot delete the last case');
      return;
    }
    const newCases = cases.filter(c => c.id !== caseId);
    setCases(newCases);
    if (activeCaseId === caseId) {
      setActiveCaseId(newCases[0].id);
    }
  };

  const exportCase = (caseData) => {
    const exportData = {
      ...caseData,
      exportedAt: new Date().toISOString(),
      docUrl: null
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseData.title.replace(/\s+/g, '_')}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
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
      const data = await sendMessage(input, activeCase.messages, language);

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

        {/* Language Selector */}
        <div className={`p-3 border-b ${t.border}`}>
          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className={`w-full flex items-center justify-between px-3 py-2 ${t.card} ${t.cardHover} rounded-lg text-sm transition-all border ${t.border}`}
            >
              <span className="flex items-center gap-2">
                <Globe size={16} />
                <span>{languages[language].flag} {languages[language].name}</span>
              </span>
              <ChevronDown size={14} className={showLanguageMenu ? 'rotate-180' : ''} />
            </button>
            {showLanguageMenu && (
              <div className={`absolute top-full left-0 right-0 mt-1 ${t.card} border ${t.border} rounded-lg shadow-lg z-50 overflow-hidden`}>
                {Object.entries(languages).map(([code, lang]) => (
                  <button
                    key={code}
                    onClick={() => { setLanguage(code); setShowLanguageMenu(false); }}
                    className={`w-full px-3 py-2 text-left text-sm ${t.cardHover} transition-all ${language === code ? t.accentText : ''}`}
                  >
                    {lang.flag} {lang.name}
                  </button>
                ))}
              </div>
            )}
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
            {cases.map(c => {
              const status = getStatusBadge(c);
              return (
                <div
                  key={c.id}
                  className={`group flex items-center gap-2 px-3 py-3 rounded-xl text-sm transition-all ${c.id === activeCaseId
                    ? `${t.card} ${t.text} border ${t.border}`
                    : `${t.textMuted} ${t.cardHover}`
                    }`}
                >
                  <button
                    onClick={() => setActiveCaseId(c.id)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <MessageSquare size={16} />
                    <span className="truncate flex-1">{c.title}</span>
                    <span className={`px-1.5 py-0.5 text-[10px] rounded ${status.color} text-white`}>
                      {status.label}
                    </span>
                  </button>
                  <button
                    onClick={() => deleteCase(c.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                    title="Delete case"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
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
          <div className="flex items-center gap-3">
            <h2 className="font-medium">{activeCase.title}</h2>
            <span className={`px-2 py-0.5 text-xs rounded ${getStatusBadge(activeCase).color} text-white`}>
              {getStatusBadge(activeCase).label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportCase(activeCase)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${t.textMuted} hover:${t.text} ${t.cardHover} transition-all`}
              title="Export case as JSON"
            >
              <FileDown size={16} />
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${t.textMuted} hover:${t.text} ${t.cardHover} transition-all`}
            >
              Case Details
              {showDetails ? <ChevronDown size={16} /> : <ChevronDown size={16} className="rotate-[-90deg]" />}
            </button>
          </div>
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
                  <div className="space-y-2">
                    <a
                      href={activeCase.docUrl}
                      download="Demand_Letter.pdf"
                      className={`flex items-center justify-center gap-2 w-full ${t.accentBg} ${t.accentHover} text-white py-2 rounded-lg font-medium text-sm transition-all`}
                    >
                      <Download size={16} /> Download PDF
                    </a>
                    <a
                      href="https://opensign.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 w-full border ${t.border} ${t.textMuted} hover:${t.text} py-2 rounded-lg text-sm transition-all`}
                    >
                      ✍️ Request E-Signature
                    </a>
                  </div>
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
                placeholder={language === 'es' ? 'Describe tu situación legal...' : language === 'fr' ? 'Décrivez votre situation juridique...' : language === 'zh' ? '描述您的法律情况...' : language === 'hi' ? 'अपनी कानूनी स्थिति का वर्णन करें...' : 'Describe your legal situation...'}
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
