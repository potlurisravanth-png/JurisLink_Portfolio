import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, Monitor, Type, Palette } from 'lucide-react';

/**
 * PreferencesModal - Chat preferences with Framer Motion entrance.
 *
 * P7: PMO Sprint UI/UX Premium Polish.
 * Uses fade + scale entrance animation per frontend-specialist skill R3.
 * Easing: cubic-bezier(0.25, 0.46, 0.45, 0.94) per design tokens.
 */

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 10,
        transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

const PreferencesModal = ({ isOpen, onClose, currentTheme, onThemeChange }) => {
    const themes = [
        { id: 'dark', label: 'Dark', icon: Moon, desc: 'Glass & Steel' },
        { id: 'light', label: 'Light', icon: Sun, desc: 'Clean & Bright' },
        { id: 'high-contrast', label: 'High Contrast', icon: Monitor, desc: 'Accessibility' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        key="modal"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
                    >
                        <div className="rounded-2xl border border-glass-border bg-bg-surface shadow-[0_12px_48px_rgba(0,0,0,0.18)] overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-glass-border">
                                <div className="flex items-center gap-2">
                                    <Palette size={18} className="text-accent-primary" />
                                    <h2 className="text-lg font-semibold text-text-primary">Preferences</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Theme Selection */}
                            <div className="p-5 space-y-4">
                                <div className="flex items-center gap-2 text-text-muted mb-2">
                                    <Type size={14} />
                                    <h3 className="text-xs font-bold uppercase tracking-wider">Theme</h3>
                                </div>

                                <div className="space-y-2">
                                    {themes.map((theme) => {
                                        const Icon = theme.icon;
                                        const isActive = currentTheme === theme.id;
                                        return (
                                            <button
                                                key={theme.id}
                                                onClick={() => onThemeChange(theme.id)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200
                                                    ${isActive
                                                        ? 'border-accent-primary/50 bg-accent-primary/10 text-text-primary'
                                                        : 'border-glass-border bg-glass-panel hover:bg-white/5 text-text-secondary hover:text-text-primary'
                                                    }`}
                                            >
                                                <Icon size={18} className={isActive ? 'text-accent-primary' : ''} />
                                                <div className="text-left">
                                                    <span className="block text-sm font-medium">{theme.label}</span>
                                                    <span className="block text-xs text-text-muted">{theme.desc}</span>
                                                </div>
                                                {isActive && (
                                                    <div className="ml-auto w-2 h-2 rounded-full bg-accent-primary" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-3 border-t border-glass-border text-center">
                                <p className="text-[10px] text-text-muted">Changes apply immediately</p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default PreferencesModal;
