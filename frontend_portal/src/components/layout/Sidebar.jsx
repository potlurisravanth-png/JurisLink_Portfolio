import React, { useState, useEffect } from 'react';
import { Briefcase, MoreVertical, Edit2, Trash2, Settings, Plus, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';

const Sidebar = ({
    onNewChat,
    onSettings,
    onHistoryClick,
    onDeleteSession,
    onRenameSession,
    sessions = [],
    currentSessionId
}) => {
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // Close menus on click outside
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

    // Group sessions by date
    const groupedSessions = {
        'Today': [],
        'Yesterday': [],
        'Previous 7 Days': [],
        'Older': []
    };

    const now = new Date();

    sessions
        .filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .forEach(session => {
            const date = new Date(session.timestamp || session.date);
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) groupedSessions['Today'].push(session);
            else if (diffDays === 1) groupedSessions['Yesterday'].push(session);
            else if (diffDays <= 7) groupedSessions['Previous 7 Days'].push(session);
            else groupedSessions['Older'].push(session);
        });

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header / New Chat */}
            <div className="p-4 space-y-4">
                <Button
                    variant="primary"
                    className="w-full justify-start pl-4 py-3 shadow-blue-900/20"
                    onClick={onNewChat}
                    icon={Plus}
                >
                    New Consultation
                </Button>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-accent-primary" size={14} />
                    <input
                        type="text"
                        placeholder="Search history..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-bg-surface/50 border border-glass-border rounded-xl py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-primary/50 focus:bg-bg-surface transition-all"
                    />
                </div>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-6 scrollbar-thin pb-4">
                {Object.entries(groupedSessions).map(([label, group]) => {
                    if (group.length === 0) return null;
                    return (
                        <div key={label} className="space-y-1">
                            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider px-3 mb-2">{label}</h3>
                            {group.map(session => (
                                <div key={session.id} className="relative group">
                                    {editingId === session.id ? (
                                        <div className="flex items-center gap-2 px-2 py-1.5 bg-bg-surface border border-accent-primary rounded-lg mx-2">
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
                                                className="w-full bg-transparent text-sm text-text-primary outline-none"
                                            />
                                            <button onClick={handleSaveRename} className="text-green-400 hover:text-green-300"><Check size={14} /></button>
                                        </div>
                                    ) : (
                                        <div
                                            className={`
                                                relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-all duration-200
                                                ${currentSessionId === session.id
                                                    ? 'bg-accent-primary/10 text-accent-primary'
                                                    : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                                                }
                                            `}
                                            onClick={() => onHistoryClick(session.id)}
                                        >
                                            <Briefcase size={16} className={currentSessionId === session.id ? 'text-accent-primary' : 'text-text-muted'} />
                                            <span className="text-sm truncate pr-6">{session.title}</span>

                                            {/* Context Menu Trigger */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMenuOpenId(menuOpenId === session.id ? null : session.id);
                                                }}
                                                className={`
                                                    absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity
                                                    ${menuOpenId === session.id ? 'opacity-100 bg-white/10' : 'hover:bg-white/10'}
                                                `}
                                            >
                                                <MoreVertical size={14} />
                                            </button>

                                            {/* Dropdown Menu */}
                                            <AnimatePresence>
                                                {menuOpenId === session.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                        className="absolute right-0 top-full mt-1 w-32 bg-bg-surface border border-glass-border rounded-xl shadow-xl z-50 overflow-hidden"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button onClick={(e) => handleStartRename(e, session)} className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-white/5 flex items-center gap-2">
                                                            <Edit2 size={12} /> Rename
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); onDeleteSession(session.id); }} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                                                            <Trash2 size={12} /> Delete
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-glass-border bg-black/10">
                <button
                    onClick={onSettings}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                >
                    <Settings size={18} />
                    <span>Preferences</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
