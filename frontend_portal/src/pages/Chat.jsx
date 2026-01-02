import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TextareaAutosize from 'react-textarea-autosize';
import { sendMessage, downloadPDF } from '../api';
import ProfileMenu from '../components/ProfileMenu';
import {
    Send, FileText, Download, Briefcase, StopCircle, Bot, X, Menu,
    Settings, Trash2, Moon, Sun, Zap, MoreVertical, Edit2, Check,
    Paperclip, Mic, LayoutGrid, ArrowRight, ThumbsUp, ThumbsDown,
    Copy, RefreshCw, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

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
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION_PREFIX + sessionId));
    } catch {
        return null;
    }
};

const THEMES = {
    dark: {
        name: 'Dark', bg: 'bg-slate-950', sidebar: 'bg-slate-950 border-r border-slate-800', text: 'text-slate-100', muted: 'text-slate-400', accent: 'text-blue-400', accentBg: 'bg-blue-600',
        userBubble: 'bg-slate-800 border-slate-700 text-slate-100', botBubble: 'text-slate-200', inputBg: 'bg-slate-900', borderColor: 'border-slate-800', hover: 'hover:bg-slate-800'
    },
    light: {
        name: 'Light', bg: 'bg-slate-50', sidebar: 'bg-white border-r border-slate-200', text: 'text-slate-900', muted: 'text-slate-500', accent: 'text-blue-600', accentBg: 'bg-blue-600',
        userBubble: 'bg-white border-slate-200 shadow-sm text-slate-800', botBubble: 'text-slate-800', inputBg: 'bg-white', borderColor: 'border-slate-200 shadow-sm', hover: 'hover:bg-slate-100'
    },
    cyberpunk: {
        name: 'Cyberpunk', bg: 'bg-black', sidebar: 'bg-black border-r border-pink-500/50', text: 'text-yellow-400', muted: 'text-cyan-600', accent: 'text-cyan-400', accentBg: 'bg-pink-600',
        userBubble: 'bg-gray-900 border-pink-500 text-yellow-200 shadow-[0_0_10px_rgba(236,72,153,0.3)]', botBubble: 'text-cyan-300 font-mono', inputBg: 'bg-black border-cyan-500/50', borderColor: 'border-pink-500/50', hover: 'hover:bg-pink-900/20'
    }
};

const StreamedMessage = ({ content, isFinal, theme }) => {
    const safeContent = typeof content === 'string' ? content : String(content || '');
    const [display, setDisplay] = useState(isFinal ? safeContent : '');

    useEffect(() => {
        if (isFinal) { setDisplay(safeContent); return; }
        let i = 0; const interval = setInterval(() => { setDisplay(safeContent.slice(0, i)); i += 5; if (i > safeContent.length) clearInterval(interval); }, 10);
        return () => clearInterval(interval);
    }, [safeContent, isFinal]);

    if (!display) return <span className={THEMES[theme].muted}>Loading...</span>;

    return (
        <div className={`prose max-w-none whitespace-pre-wrap ${theme === 'light' ? 'prose-slate' : 'prose-invert'} prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-li:marker:${THEMES[theme].accent} prose-table:border-collapse prose-th:bg-white/10 prose-th:p-2 prose-td:p-2 prose-td:border prose-td:border-white/10`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                code({ node, inline, className, children, ...props }) {
                    return !inline ? (
                        <div className="relative group my-4">
                            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1 rounded bg-white/10 hover:bg-white/20 text-xs text-white" onClick={() => navigator.clipboard.writeText(String(children))}><Copy size={14} /></button>
                            </div>
                            <code className={`block bg-black/30 rounded-lg p-4 overflow-x-auto ${className}`} {...props}>{children}</code>
                        </div>
                    ) : (
                        <code className="bg-black/20 rounded px-1 py-0.5 font-mono text-sm" {...props}>{children}</code>
                    )
                }
            }}>
                {display}
            </ReactMarkdown>
        </div>
    );
};

const ThinkingBubble = ({ theme }) => {
    const t = THEMES[theme];
    return (
        <div className={`inline-flex items-center gap-1 px-4 py-3 rounded-2xl ${t.botBubble} bg-transparent`}>
            <span className="w-2 h-2 rounded-full bg-current animate-[bounce_1s_infinite_0ms]"></span>
            <span className="w-2 h-2 rounded-full bg-current animate-[bounce_1s_infinite_200ms]"></span>
            <span className="w-2 h-2 rounded-full bg-current animate-[bounce_1s_infinite_400ms]"></span>
        </div>
    );
};

const SettingsModal = ({ isOpen, onClose, onClearHistory, currentTheme, onSetTheme }) => {
    if (!isOpen) return null;
    const t = THEMES[currentTheme];
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative ${t.bg} border ${t.borderColor} rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6`}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-xl font-bold ${t.text}`}>Settings</h2>
                    <button onClick={onClose} className={`p-1 rounded ${t.hover} transition-colors`}><X size={20} className={t.muted} /></button>
                </div>
                <div className="space-y-6">
                    <div className="space-y-3">
                        <h3 className={`text-sm font-semibold uppercase tracking-wider ${t.muted}`}>Appearance</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {[{ id: 'light', icon: Sun, label: 'Light' }, { id: 'dark', icon: Moon, label: 'Dark' }, { id: 'cyberpunk', icon: Zap, label: 'Cyberpunk' }].map((Mode) => (
                                <button key={Mode.id} onClick={() => onSetTheme(Mode.id)} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${currentTheme === Mode.id ? `${t.accentBg} text-white border-transparent` : `bg-transparent ${t.borderColor} ${t.text} ${t.hover}`}`}>
                                    <Mode.icon size={20} className="mb-2" /><span className="text-xs font-medium">{Mode.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className={`text-sm font-semibold uppercase tracking-wider ${t.muted}`}>Data & Privacy</h3>
                        <button onClick={onClearHistory} className={`w-full flex items-center justify-between p-3 rounded-xl border ${t.borderColor} hover:bg-red-500/10 hover:border-red-500/50 transition-all group`}>
                            <div className="flex items-center gap-3"><Trash2 size={18} className="text-red-400" /><span className={`${t.text} group-hover:text-red-500`}>Clear All History</span></div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const WelcomeScreen = ({ onSuggestionClick, theme }) => {
    const t = THEMES[theme];
    const suggestions = [
        { label: "Review Contract", icon: FileText, prompt: "Please review this contract for potential risks and clauses that need attention." },
        { label: "Case Strategy", icon: LayoutGrid, prompt: "I need a legal strategy for a complex case involving..." },
        { label: "Legal Research", icon: Briefcase, prompt: "Conduct legal research on the following topic..." },
    ];

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-700">
            <div className={`w-20 h-20 rounded-3xl mb-8 flex items-center justify-center shadow-2xl ${t.accentBg}`}>
                <Bot size={40} className="text-white" />
            </div>
            <h1 className={`text-4xl md:text-5xl font-bold mb-4 tracking-tight ${t.text}`}>JurisLink AI</h1>
            <p className={`text-lg md:text-xl max-w-2xl mb-12 leading-relaxed ${t.muted}`}>
                Your advanced legal assistant. Ready to draft, review, and strategize.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => onSuggestionClick(s.prompt)}
                        className={`p-6 rounded-2xl text-left border transition-all hover:-translate-y-1 hover:shadow-lg group ${t.borderColor} ${theme === 'light' ? 'bg-white hover:border-blue-300' : 'bg-slate-800/50 hover:border-slate-600'}`}
                    >
                        <div className={`mb-4 p-3 rounded-xl w-fit ${theme === 'light' ? 'bg-blue-50 text-blue-600' : 'bg-slate-700 text-blue-400'}`}>
                            <s.icon size={24} />
                        </div>
                        <h3 className={`font-semibold mb-2 ${t.text}`}>{s.label}</h3>
                        <div className="flex items-center text-sm opacity-50 group-hover:opacity-100 transition-opacity">
                            <span className={t.muted}>Start chat</span>
                            <ArrowRight size={14} className="ml-2" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

const SidebarContent = ({ onNewChat, onSettings, onHistoryClick, onDeleteSession, onRenameSession, sessions = [], currentSessionId, theme }) => {
    const t = THEMES[theme];
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState("");

    useEffect(() => {
        const handleClickOutside = () => setMenuOpenId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleStartRename = (e, session) => {
        e.stopPropagation();
        setEditingId(session.id);
        setEditTitle(session.title);
        setMenuOpenId(null);
    };

    const handleSaveRename = (e) => {
        e.stopPropagation();
        onRenameSession(editingId, editTitle);
        setEditingId(null);
    };

    return (
        <div className={`flex flex-col h-full ${t.sidebar} transition-colors duration-300`}>
            <div className="p-4 flex-1 overflow-y-auto overflow-x-hidden w-72 pb-20">
                <button onClick={onNewChat} className={`w-full ${theme === 'light' ? 'bg-slate-200 hover:bg-slate-300' : theme === 'cyberpunk' ? 'bg-gray-900/50 hover:bg-pink-900/20 border border-pink-500/30' : 'bg-slate-800 hover:bg-slate-700'} ${t.text} font-medium py-3 px-4 rounded-xl flex items-center gap-3 transition-colors mb-6 border ${t.borderColor} shadow-sm group`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.accent}`}><span className="text-xl leading-none mb-1">+</span></div>
                    <span>New Chat</span>
                </button>

                <div className="space-y-6">
                    <div>
                        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 px-2 ${t.muted}`}>Recent</h3>
                        <div className="space-y-6">
                            {['Today', 'Yesterday', 'Previous 7 Days', 'Older'].map(groupLabel => {
                                const now = new Date();
                                const getGroup = (d) => {
                                    const date = new Date(d);
                                    if (date.toDateString() === now.toDateString()) return 'Today';
                                    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
                                    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
                                    const diff = (now - date) / (1000 * 60 * 60 * 24);
                                    if (diff <= 7) return 'Previous 7 Days';
                                    return 'Older';
                                };
                                const groupSessions = sessions.filter(s => getGroup(s.timestamp || s.date) === groupLabel);
                                if (groupSessions.length === 0) return null;

                                return (
                                    <div key={groupLabel}>
                                        <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 px-2 ${t.muted}`}>{groupLabel}</h3>
                                        <div className="space-y-1">
                                            {groupSessions.map((session) => (
                                                <div key={session.id} className="group relative flex items-center">
                                                    {editingId === session.id ? (
                                                        <div className="w-full flex items-center gap-2 p-1">
                                                            <input
                                                                autoFocus
                                                                value={editTitle}
                                                                onChange={(e) => setEditTitle(e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleSaveRename(e);
                                                                    if (e.key === 'Escape') setEditingId(null);
                                                                }}
                                                                onBlur={handleSaveRename}
                                                                className={`w-full bg-slate-900 border border-blue-500 rounded px-2 py-1 text-sm ${t.text} outline-none`}
                                                            />
                                                            <button onClick={handleSaveRename} className="text-green-500 hover:text-green-400"><Check size={16} /></button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => onHistoryClick(session.id)}
                                                                className={`w-full text-left p-2 pr-8 rounded-lg text-sm truncate transition-colors flex items-center gap-3 ${currentSessionId === session.id ? (theme === 'cyberpunk' ? 'bg-pink-900/40 text-pink-400 border border-pink-500/30' : theme === 'light' ? 'bg-blue-50 text-blue-700' : 'bg-blue-900/30 text-blue-200') : `${t.hover} ${t.muted} hover:${t.text}`}`}
                                                            >
                                                                <Briefcase size={14} className={currentSessionId === session.id ? t.accent : 'opacity-50'} />
                                                                <span className="truncate">{session.title}</span>
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === session.id ? null : session.id); }}
                                                                className={`absolute right-1 p-1 rounded hover:bg-slate-700/50 ${menuOpenId === session.id ? 'opacity-100 text-slate-200' : 'opacity-0 group-hover:opacity-100 text-slate-500'}`}
                                                            >
                                                                <MoreVertical size={16} />
                                                            </button>
                                                            <AnimatePresence>
                                                                {menuOpenId === session.id && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                                                        className="absolute right-0 top-full mt-1 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <button onClick={(e) => handleStartRename(e, session)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                                                                            <Edit2 size={14} /> Rename
                                                                        </button>
                                                                        <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); onDeleteSession(session.id); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-2">
                                                                            <Trash2 size={14} /> Delete
                                                                        </button>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            {sessions.length === 0 && <p className={`text-xs px-2 italic ${t.muted}`}>No recent chats.</p>}
                        </div>
                    </div>
                </div>
            </div>
            <div className={`mt-auto p-4 border-t ${t.borderColor} w-72`}>
                <button onClick={onSettings} className={`flex items-center gap-3 text-sm p-2 rounded-lg w-full transition-colors ${t.muted} ${t.hover}`}><Settings size={18} />Settings</button>
            </div>
        </div>
    );
};

const LeftNav = (props) => (
    <>
        <AnimatePresence>
            {props.isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => props.setIsOpen(false)} />
                    <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="md:hidden fixed inset-y-0 left-0 z-50 w-72 shadow-2xl"><SidebarContent {...props} /></motion.div>
                </>
            )}
        </AnimatePresence>
        <div className="hidden md:block w-72 h-full z-30 relative shrink-0"><SidebarContent {...props} /></div>
    </>
);

// --- CASE DETAILS PANEL (V3.1 - Always visible 30% width) ---
const CaseDetailsPanel = ({ facts, strategy, caseId, theme, lastUpdated, currentUser }) => {
    const t = THEMES[theme];
    const [downloadStatus, setDownloadStatus] = useState('idle'); // idle, generating, ready

    // Determine case status based on facts gathered
    const getCaseStatus = () => {
        if (!facts || Object.keys(facts).length === 0) return { label: 'New Case', color: 'text-slate-400', bgColor: 'bg-slate-800' };
        if (facts.status === 'COMPLETE') return { label: 'Analysis Complete', color: 'text-green-400', bgColor: 'bg-green-900/30' };
        const factCount = Object.keys(facts).filter(k => k !== 'status' && facts[k]).length;
        if (factCount < 3) return { label: 'Gathering Facts', color: 'text-yellow-400', bgColor: 'bg-yellow-900/30' };
        return { label: 'Facts Collected', color: 'text-blue-400', bgColor: 'bg-blue-900/30' };
    };

    const status = getCaseStatus();
    const displayCaseId = caseId && caseId !== 'new' ? caseId.slice(0, 8).toUpperCase() : 'NEW';

    const handleDownloadPDF = async () => {
        if (!caseId || caseId === 'new') {
            alert('Please start a conversation first to generate a case brief.');
            return;
        }

        try {
            setDownloadStatus('generating');
            const userId = currentUser?.uid || 'guest-user';

            const blob = await downloadPDF(userId, caseId, facts, strategy, null);

            // Create object URL and open
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `JurisLink_Case_${caseId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Download failed:", error);
            alert("Failed to download PDF. Please try again.");
        } finally {
            setDownloadStatus('idle');
        }
    };



    const formatFactKey = (key) => {
        return key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
    };

    // Calculate time since last update
    const getTimeAgo = () => {
        if (!lastUpdated) return 'Not updated';
        const diff = Math.floor((Date.now() - lastUpdated) / 1000);
        if (diff < 5) return 'Just now';
        if (diff < 60) return `${diff} seconds ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
        return `${Math.floor(diff / 3600)} hours ago`;
    };

    return (
        <div className={`w-80 flex-shrink-0 flex flex-col ${t.bg} border-l ${t.borderColor} h-full transition-colors duration-300 hidden lg:flex`}>
            {/* Header */}
            <div className={`p-4 border-b ${t.borderColor}`}>
                <div className="flex items-center justify-between mb-2">
                    <h2 className={`font-bold text-lg ${t.text}`}>Case #{displayCaseId}</h2>
                    <Briefcase size={20} className={t.accent} />
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                    {status.label}
                </div>
            </div>

            {/* Facts Section */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                    <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${t.muted}`}>Case Facts</h3>
                    {Object.keys(facts).length > 0 ? (
                        <div className="space-y-2">
                            {Object.entries(facts).filter(([k]) => k !== 'status').map(([key, value]) => (
                                <div key={key} className={`text-sm p-3 rounded-lg border ${t.borderColor} ${theme === 'light' ? 'bg-white' : 'bg-slate-900/50'}`}>
                                    <span className={`text-xs block mb-1 capitalize ${t.muted}`}>{formatFactKey(key)}</span>
                                    <span className={t.text}>{String(value)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`text-center py-8 ${t.muted}`}>
                            <FileText size={32} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Facts will appear here as you describe your case.</p>
                        </div>
                    )}
                </div>

                {/* Strategy Preview (if available) */}
                {strategy && (
                    <div>
                        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${t.muted}`}>Strategy Brief</h3>
                        <div className={`text-sm p-3 rounded-lg border ${t.borderColor} ${theme === 'light' ? 'bg-blue-50' : 'bg-blue-900/20'}`}>
                            <p className={`${t.text} line-clamp-4`}>{strategy.slice(0, 200)}...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer - Download Button */}
            <div className={`p-4 border-t ${t.borderColor} space-y-3`}>
                <button
                    onClick={handleDownloadPDF}
                    disabled={!caseId || caseId === 'new'}
                    className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${caseId && caseId !== 'new'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                >
                    <Download size={20} />
                    Download Official Brief (PDF)
                </button>
                <p className={`text-xs text-center ${t.muted}`}>
                    📄 Updated {getTimeAgo()}
                </p>
            </div>
        </div>
    );
};

function Chat() {
    const { id: caseId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, logout } = useAuth(); // Auth integration

    const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEYS.THEME_PREF) || 'dark');
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    // Profile menu state removed - handled by ProfileMenu component

    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [facts, setFacts] = useState({});
    const [strategy, setStrategy] = useState(null);
    const [docUrl, setDocUrl] = useState(null);
    const [backendState, setBackendState] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const [isLeftNavOpen, setIsLeftNavOpen] = useState(false);
    const [isRightNavOpen, setIsRightNavOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);
    const t = THEMES[theme];

    // Load case from localStorage if caseId exists
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
            // Start fresh
            setCurrentSessionId(null);
            setMessages([]);
            setFacts({});
            setStrategy(null);
            setBackendState(null);
        }
    }, [caseId]);

    useEffect(() => localStorage.setItem(STORAGE_KEYS.THEME_PREF, theme), [theme]);
    useEffect(() => setSessions(loadSessionsIndex()), []);
    useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setLoading(false);
            setMessages(p => [...p, { role: 'assistant', content: '⏹️ Stopped.' }]);
        }
    };

    const handleNewChat = () => {
        if (messages.length > 0 && !window.confirm("Start new chat? Current view is saved to history.")) return;
        navigate('/case/new');
    };

    const handleHistoryClick = (sid) => {
        navigate(`/case/${sid}`);
        setIsLeftNavOpen(false);
    };

    const handleDeleteSession = (sid) => {
        if (window.confirm("Are you sure you want to delete this case?")) {
            const newSessions = deleteSessionFromStorage(sid);
            setSessions(newSessions);
            if (currentSessionId === sid) navigate('/case/new');
        }
    };

    const handleRenameSession = (sid, newTitle) => {
        const newSessions = renameSessionInStorage(sid, newTitle);
        setSessions(newSessions);
    };

    const handleClearHistory = () => {
        if (window.confirm("WARNING: Delete ALL history?")) {
            localStorage.clear();
            setSessions([]);
            navigate('/case/new');
            setIsSettingsOpen(false);
        }
    };

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

            // Add AI response
            const aiResponse = { role: 'assistant', content: data.response };
            const finalMessages = [...updatedMessages, aiResponse];
            setMessages(finalMessages);

            // If this was the first message, create new session
            const activeSessionId = currentSessionId || generateId();
            if (!currentSessionId) {
                setCurrentSessionId(activeSessionId);
                // Update URL to reflect new case ID
                navigate(`/case/${activeSessionId}`, { replace: true });
            }

            // --- SMART AUTO-TITLING ---
            let sessionTitle = "New Consultation";
            const sensitiveGreetings = ["hello", "hi", "hey", "greetings", "good morning", "good evening"];
            const cleanIssue = (newFacts.Legal_Issue || "").trim();
            const isGreeting = sensitiveGreetings.some(g => cleanIssue.toLowerCase().startsWith(g));

            if (cleanIssue && !isGreeting) {
                sessionTitle = cleanIssue;
                if (newFacts.Jurisdiction) sessionTitle += ` - ${newFacts.Jurisdiction}`;
            } else {
                const currentSession = sessions.find(s => s.id === activeSessionId);
                if (currentSession) sessionTitle = currentSession.title;
            }

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

    // Auto-send effect
    const hasAutoSent = useRef(false);
    useEffect(() => {
        if (location.state?.autoSend && !hasAutoSent.current) {
            hasAutoSent.current = true;
            handleSend(location.state.autoSend);
            // Clear state to prevent re-sending on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    return (
        <div className={`flex h-screen ${t.bg} ${t.text} font-sans overflow-hidden transition-colors duration-300 selection:bg-blue-500/30`}>
            <LeftNav
                isOpen={isLeftNavOpen} setIsOpen={setIsLeftNavOpen}
                onNewChat={handleNewChat} onSettings={() => setIsSettingsOpen(true)}
                onHistoryClick={handleHistoryClick}
                onDeleteSession={handleDeleteSession}
                onRenameSession={handleRenameSession}
                sessions={sessions} currentSessionId={currentSessionId}
                theme={theme}
            />
            <AnimatePresence>
                {isSettingsOpen && (
                    <SettingsModal
                        isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}
                        onClearHistory={handleClearHistory}
                        currentTheme={theme} onSetTheme={setTheme}
                    />
                )}
            </AnimatePresence>
            <div className={`flex-1 flex flex-col relative w-full h-full ${theme === 'dark' ? 'bg-slate-900/20' : ''}`}>
                <div className={`h-16 border-b ${t.borderColor} ${t.bg}/80 backdrop-blur flex items-center justify-between px-6 z-10 transition-colors`}>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsLeftNavOpen(true)} className={`md:hidden p-2 rounded-lg ${t.muted}`}><Menu size={20} /></button>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                                <Bot size={20} className="text-white" />
                            </div>
                            <h1 className="font-semibold text-lg tracking-tight">JURISLINK <span className={`text-xs font-mono ml-2 ${t.muted}`}>v2.1</span></h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsRightNavOpen(!isRightNavOpen)} className={`p-2 rounded-lg flex items-center gap-2 ${t.hover} ${t.muted}`} title="Case Info">
                            <Briefcase size={20} />
                        </button>

                        {/* PROFILE MENU */}
                        <ProfileMenu theme={theme} />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 scrollbar-thin">
                    {messages.length === 0 ? (
                        <WelcomeScreen onSuggestionClick={(prompt) => handleSend(prompt)} theme={theme} />
                    ) : (
                        messages.map((msg, idx) => (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex gap-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start max-w-4xl mx-auto'}`}>
                                {msg.role !== 'user' && <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 border border-slate-700/50 ${theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'}`}><Bot size={16} className={t.accent} /></div>}
                                <div className={`rounded-2xl p-5 shadow-sm max-w-[85%] ${msg.role === 'user' ? t.userBubble : `bg-transparent w-full px-0 ${t.botBubble}`}`}>
                                    {msg.role === 'user' ? (<div className="whitespace-pre-wrap">{msg.content}</div>) : (
                                        <>
                                            <StreamedMessage content={msg.content} isFinal={!loading || idx < messages.length - 1} theme={theme} />
                                            {!loading && (
                                                <div className="flex items-center gap-2 mt-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <button className={`p-1.5 rounded-lg hover:bg-slate-500/10 ${t.muted} hover:${t.text} transition-colors`} onClick={() => console.log('Thumbs Up')} title="Good response"><ThumbsUp size={14} /></button>
                                                    <button className={`p-1.5 rounded-lg hover:bg-slate-500/10 ${t.muted} hover:${t.text} transition-colors`} onClick={() => console.log('Thumbs Down')} title="Bad response"><ThumbsDown size={14} /></button>
                                                    <button className={`p-1.5 rounded-lg hover:bg-slate-500/10 ${t.muted} hover:${t.text} transition-colors`} onClick={() => console.log('Regenerate - TODO')} title="Regenerate response"><RefreshCw size={14} /></button>
                                                    <button className={`p-1.5 rounded-lg hover:bg-slate-500/10 ${t.muted} hover:${t.text} transition-colors`} onClick={() => navigator.clipboard.writeText(msg.content)} title="Copy response"><Copy size={14} /></button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {msg.isError && <div className="mt-2 text-xs text-red-400 bg-red-900/10 p-2 rounded border border-red-900/30 font-mono">{msg.error || "Unknown Error"} {msg.errorSource ? `(${msg.errorSource})` : ''}</div>}
                                    {msg.docUrl && <div className="mt-4"><a href={msg.docUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"><Download size={16} /> Download Document</a></div>}
                                </div>
                            </motion.div>
                        ))
                    )}
                    {loading && (
                        <div className="flex gap-6 justify-start max-w-4xl mx-auto">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 border border-slate-700/50 ${theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'}`}><Bot size={16} className={t.accent} /></div>
                            <ThinkingBubble theme={theme} />
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
                <div className={`p-4 ${t.bg}/80 backdrop-blur border-t ${t.borderColor}`}>
                    <div className={`max-w-3xl mx-auto rounded-3xl border focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-black/5 transition-all shadow-xl relative ${t.inputBg} ${t.borderColor} ${theme === 'cyberpunk' ? 'focus-within:ring-cyan-500' : 'focus-within:ring-blue-500'}`}>
                        <div className="absolute left-3 bottom-0 top-0 flex items-center gap-2">
                            <button className={`p-2 rounded-full hover:bg-slate-500/10 transition-colors ${t.muted}`}><Paperclip size={20} /></button>
                        </div>
                        <TextareaAutosize
                            minRows={1} maxRows={6}
                            className={`w-full bg-transparent placeholder-slate-400 px-14 py-4 pr-14 resize-none outline-none leading-relaxed ${t.text}`}
                            placeholder="Describe your legal situation..."
                            value={input} onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            disabled={loading}
                        />
                        <div className="absolute right-2 bottom-2 flex items-center gap-2">
                            <button className={`p-2 rounded-full hover:bg-slate-500/10 transition-colors ${t.muted} ${input.trim() ? 'hidden' : 'block'}`}><Mic size={20} /></button>
                            {loading ? (<button onClick={handleStop} className="p-2 bg-red-600 hover:bg-red-500 rounded-full text-white transition-all shadow-lg"><StopCircle size={20} /></button>) : (input.trim() && <button onClick={handleSend} className={`p-2 rounded-full text-white transition-all shadow-lg ${t.accentBg}`}><Send size={20} /></button>)}
                        </div>
                    </div>
                </div>
            </div>
            <CaseDetailsPanel facts={facts} strategy={strategy} caseId={currentSessionId || caseId} theme={theme} lastUpdated={lastUpdated} currentUser={currentUser} />
        </div>
    );
}

export default Chat;
