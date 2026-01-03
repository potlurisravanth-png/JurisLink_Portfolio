import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProfileMenu = () => {
    const { currentUser, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 pl-2 pr-2 py-1.5 rounded-full border border-glass-border bg-glass-panel backdrop-blur-md hover:bg-white/5 transition-all text-text-primary"
                title="Account Settings"
            >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-primary to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-1 ring-white/20">
                    {currentUser?.photoURL ? (
                        <img src={currentUser.photoURL} alt="User" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : <User size={14} />
                    )}
                </div>

                {/* Name & Chevron */}
                <div className="hidden sm:flex flex-col items-start mr-1">
                    <span className="text-xs font-semibold text-text-primary">
                        {currentUser?.displayName?.split(' ')[0] || 'User'}
                    </span>
                </div>
                <ChevronDown size={14} className={`text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop to close */}
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

                        {/* Dropdown Menu */}
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                            className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-glass-border bg-glass-panel backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
                        >
                            {/* User Header */}
                            <div className="p-4 border-b border-glass-border">
                                <p className="text-sm font-semibold text-text-primary truncate">
                                    {currentUser?.displayName || 'Guest User'}
                                </p>
                                <p className="text-xs text-text-muted truncate font-medium">
                                    {currentUser?.email || 'Demo Mode'}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="p-1.5">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        logout();
                                    }}
                                    className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-3 transition-colors"
                                >
                                    <LogOut size={16} />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfileMenu;
