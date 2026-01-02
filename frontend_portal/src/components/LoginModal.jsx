import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, AlertCircle } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { BsMicrosoft } from 'react-icons/bs';
import { useAuth } from '../context/AuthContext';

const LoginModal = () => {
    const { loginWithGoogle, loginWithMicrosoft } = useAuth();
    const [isLoading, setIsLoading] = useState(null);
    const [error, setError] = useState(null);

    const handleLogin = async (providerId, loginFn) => {
        setIsLoading(providerId);
        setError(null);
        try {
            await loginFn();
        } catch (err) {
            console.error(err);
            let msg = "Authentication failed.";
            if (err.code === 'auth/popup-closed-by-user') msg = "Popup closed.";
            if (err?.message) msg = err.message;
            setError(msg);
        } finally {
            setIsLoading(null);
        }
    };

    const ssoButtons = [
        {
            id: 'google', label: 'Sign in with Google', icon: FcGoogle, fn: loginWithGoogle,
            bg: 'bg-white hover:bg-gray-50 text-slate-900', border: 'border-transparent'
        },
        {
            id: 'microsoft', label: 'Sign in with Microsoft', icon: BsMicrosoft, fn: loginWithMicrosoft,
            bg: 'bg-[#0078D4] hover:bg-[#006cbd] text-white', border: 'border-transparent'
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Glass Overlay: fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-center justify-center */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-md bg-slate-900/80 border border-white/10 rounded-2xl shadow-2xl p-8 overflow-hidden backdrop-blur-md"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 mb-6 ring-1 ring-white/10 shadow-inner">
                        <Shield size={32} className="text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">JurisLink</h2>
                    <p className="text-slate-400 text-sm">Secure Legal Intelligence Platform</p>
                </div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-4">
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex gap-3 items-center">
                                <AlertCircle size={16} className="text-red-400 shrink-0" />
                                <p className="text-xs text-red-300 font-medium">{error}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Buttons */}
                <div className="space-y-3">
                    {ssoButtons.map((btn) => (
                        <button
                            key={btn.id}
                            onClick={() => handleLogin(btn.id, btn.fn)}
                            disabled={isLoading !== null}
                            className={`w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all active:scale-[0.98] ${btn.bg} ${btn.border} ${isLoading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isLoading === btn.id ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <btn.icon size={20} />}
                            <span>{btn.label}</span>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                    <Lock size={12} />
                    <span>256-bit Encryption • SOC2 Compliant</span>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginModal;
