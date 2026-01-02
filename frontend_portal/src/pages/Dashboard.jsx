import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Briefcase, Clock, Search, LogOut,
    MoreVertical, Trash2, ChevronRight, Scale, FileText,
    CheckCircle2, Loader2, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEYS = {
    SESSIONS_INDEX: 'jurislink_sessions_index',
    SESSION_PREFIX: 'jurislink_session_',
};

// Load sessions from localStorage
const loadSessionsIndex = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS_INDEX)) || [];
    } catch {
        return [];
    }
};

const deleteSessionFromStorage = (sessionId) => {
    localStorage.removeItem(STORAGE_KEYS.SESSION_PREFIX + sessionId);
    const index = loadSessionsIndex().filter(s => s.id !== sessionId);
    localStorage.setItem(STORAGE_KEYS.SESSIONS_INDEX, JSON.stringify(index));
    return index;
};

const getStatusConfig = (session) => {
    const messageCount = session.messageCount || 0;
    if (messageCount === 0) return { label: 'New', color: 'text-slate-400', bg: 'bg-slate-800', icon: FileText };
    if (messageCount < 3) return { label: 'In Progress', color: 'text-yellow-400', bg: 'bg-yellow-900/30', icon: Loader2 };
    return { label: 'Active', color: 'text-green-400', bg: 'bg-green-900/30', icon: CheckCircle2 };
};

const Dashboard = () => {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const [cases, setCases] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCases = () => {
            setLoading(true);

            // Load from localStorage
            const sessions = loadSessionsIndex();
            const enrichedCases = sessions.map(session => {
                const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION_PREFIX + session.id) || '{}');
                return {
                    ...session,
                    clientName: data.facts?.Client_Name || data.facts?.client_name || 'Unknown Client',
                    jurisdiction: data.facts?.Jurisdiction || '-',
                    messageCount: data.messages?.length || 0,
                    lastUpdated: new Date(session.timestamp || Date.now()).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })
                };
            });
            setCases(enrichedCases);
            setLoading(false);
        };

        loadCases();
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const handleNewCase = () => {
        navigate('/case/new');
    };

    const handleResumeCase = (caseId) => {
        navigate(`/case/${caseId}`);
    };

    const handleDeleteCase = (e, caseId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this case?')) {
            deleteSessionFromStorage(caseId);
            setCases(prev => prev.filter(c => c.id !== caseId));
        }
        setMenuOpenId(null);
    };

    const filteredCases = cases.filter(c =>
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Scale size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">JurisLink AI</h1>
                            <p className="text-xs text-slate-500">Legal Case Management</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* User Profile */}
                        <div className="flex items-center gap-3">
                            {currentUser?.photoURL ? (
                                <img
                                    src={currentUser.photoURL}
                                    alt="Profile"
                                    className="w-8 h-8 rounded-full border-2 border-slate-700"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                                    <User size={16} className="text-slate-400" />
                                </div>
                            )}
                            <span className="text-sm text-slate-300 hidden sm:block">
                                {currentUser?.displayName || currentUser?.email || 'User'}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Welcome Message */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Welcome back, {currentUser?.displayName?.split(' ')[0] || 'Counselor'}
                    </h2>
                    <p className="text-slate-400">
                        {cases.length} active case{cases.length !== 1 ? 's' : ''} • Stored Locally
                    </p>
                </motion.div>

                {/* Top Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8">
                    <button
                        onClick={handleNewCase}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium px-5 py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all group"
                    >
                        <Plus size={20} />
                        Start New Case
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search cases by title or client..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredCases.length > 0 ? (
                    /* Cases Table */
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-800/50 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            <div className="col-span-4 sm:col-span-3">Case Title</div>
                            <div className="col-span-3 sm:col-span-2 hidden sm:block">Client</div>
                            <div className="col-span-3 sm:col-span-3">Last Updated</div>
                            <div className="col-span-2 sm:col-span-2">Status</div>
                            <div className="col-span-3 sm:col-span-2 text-right">Actions</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-slate-800">
                            {filteredCases.map((caseItem, index) => {
                                const status = getStatusConfig(caseItem);
                                return (
                                    <motion.div
                                        key={caseItem.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => handleResumeCase(caseItem.id)}
                                        className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-800/30 cursor-pointer transition-colors group"
                                    >
                                        <div className="col-span-4 sm:col-span-3 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Briefcase size={18} className="text-blue-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-white font-medium truncate">{caseItem.title || 'Untitled Case'}</p>
                                                <p className="text-xs text-slate-500 truncate">ID: {caseItem.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                        <div className="col-span-3 sm:col-span-2 hidden sm:flex items-center">
                                            <span className="text-slate-300 truncate">{caseItem.clientName || 'Unknown'}</span>
                                        </div>
                                        <div className="col-span-3 sm:col-span-3 flex items-center gap-2 text-slate-400">
                                            <Clock size={14} className="flex-shrink-0" />
                                            <span className="text-sm truncate">{caseItem.lastUpdated}</span>
                                        </div>
                                        <div className="col-span-2 sm:col-span-2 flex items-center">
                                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                                <status.icon size={12} />
                                                {status.label}
                                            </span>
                                        </div>
                                        <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleResumeCase(caseItem.id); }}
                                                className="px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Resume
                                            </button>
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === caseItem.id ? null : caseItem.id); }}
                                                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-white transition-colors"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                                <AnimatePresence>
                                                    {menuOpenId === caseItem.id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                            className="absolute right-0 top-full mt-1 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden"
                                                        >
                                                            <button
                                                                onClick={(e) => handleDeleteCase(e, caseItem.id)}
                                                                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-2"
                                                            >
                                                                <Trash2 size={14} />
                                                                Delete Case
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* Empty State */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center"
                    >
                        <div className="w-16 h-16 bg-slate-800 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                            <Briefcase size={32} className="text-slate-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No Cases Yet</h3>
                        <p className="text-slate-400 mb-8 max-w-md mx-auto">
                            Start your first legal consultation by clicking the button below or choose a quick action.
                        </p>

                        <div className="flex flex-col items-center gap-6">
                            <button
                                onClick={handleNewCase}
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium px-6 py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all"
                            >
                                <Plus size={20} />
                                Start Your First Case
                            </button>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-4">
                                {[
                                    { label: "Review Contract", icon: FileText, prompt: "Please review this contract for potential risks and clauses that need attention." },
                                    { label: "Legal Strategy", icon: Scale, prompt: "I need a legal strategy for a complex case regarding intellectual property rights." },
                                    { label: "Draft Letter", icon: FileText, prompt: "Draft a formal demand letter for a breach of contract dispute." }
                                ].map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => navigate('/case/new', { state: { autoSend: suggestion.prompt } })}
                                        className="p-4 rounded-xl border border-slate-800 bg-slate-800/30 hover:bg-slate-800 hover:border-slate-700 transition-all text-left group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <suggestion.icon size={20} className="text-blue-400" />
                                        </div>
                                        <h4 className="font-medium text-slate-200 text-sm mb-1">{suggestion.label}</h4>
                                        <p className="text-xs text-slate-500 line-clamp-2">Start with this template</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
