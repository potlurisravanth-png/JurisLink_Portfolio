import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertCircle, Mail, Eye, EyeOff, User } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';

const LoginModal = () => {
    const { loginWithGoogle, loginWithEmail, signUpWithEmail, demoMode } = useAuth();
    const [isLoading, setIsLoading] = useState(null);
    const [error, setError] = useState(null);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');

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

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading('email');

        try {
            if (isSignUp) {
                if (!displayName.trim()) {
                    setError('Please enter your name');
                    setIsLoading(null);
                    return;
                }
                await signUpWithEmail(email, password, displayName);
            } else {
                await loginWithEmail(email, password);
            }
        } catch (err) {
            console.error(err);
            setError(err?.message || 'Authentication failed');
        } finally {
            setIsLoading(null);
        }
    };

    const ssoButtons = [
        {
            id: 'google', label: 'Sign in with Google', icon: FcGoogle, fn: loginWithGoogle,
            bg: 'bg-white hover:bg-gray-50 text-slate-900', border: 'border-transparent'
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Glass Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-md bg-glass-panel border border-glass-border rounded-2xl shadow-2xl p-8 overflow-hidden backdrop-blur-md"
            >
                {/* Header */}
                <div className="text-center mb-6">
                    <img
                        src="/logo.png"
                        alt="JurisLink"
                        className="w-16 h-16 rounded-2xl mx-auto mb-4 ring-1 ring-white/10 shadow-lg"
                    />
                    <h2 className="text-2xl font-bold text-text-primary mb-2 tracking-tight">JurisLink</h2>
                    <p className="text-text-secondary text-sm">Secure Legal Intelligence Platform</p>
                    {demoMode && (
                        <p className="text-amber-400/80 text-xs mt-2 bg-amber-500/10 rounded-full px-3 py-1 inline-block">
                            Demo Mode - No Firebase configured
                        </p>
                    )}
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

                <AnimatePresence mode="wait">
                    {!showEmailForm ? (
                        <motion.div
                            key="sso"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* SSO Buttons */}
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

                            {/* Divider */}
                            <div className="flex items-center gap-4 my-5">
                                <div className="flex-1 h-px bg-glass-border" />
                                <span className="text-xs text-text-muted">or</span>
                                <div className="flex-1 h-px bg-glass-border" />
                            </div>

                            {/* Email Button */}
                            <button
                                onClick={() => setShowEmailForm(true)}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all bg-glass-highlight border border-glass-border text-text-primary hover:bg-white/10 active:scale-[0.98]"
                            >
                                <Mail size={20} />
                                <span>Continue with Email</span>
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="email"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Email Form */}
                            <form onSubmit={handleEmailAuth} className="space-y-4">
                                {isSignUp && (
                                    <div className="relative">
                                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                        <input
                                            type="text"
                                            placeholder="Full Name"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="w-full bg-bg-surface/50 border border-glass-border rounded-xl py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50 transition-all"
                                        />
                                    </div>
                                )}

                                <div className="relative">
                                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <input
                                        type="email"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-bg-surface/50 border border-glass-border rounded-xl py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50 transition-all"
                                    />
                                </div>

                                <div className="relative">
                                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full bg-bg-surface/50 border border-glass-border rounded-xl py-3 pl-10 pr-12 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading !== null}
                                    className="w-full bg-accent-primary hover:bg-accent-primary/90 text-white font-medium py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading === 'email' ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                                    ) : (
                                        isSignUp ? 'Create Account' : 'Sign In'
                                    )}
                                </button>
                            </form>

                            {/* Toggle Sign Up / Sign In */}
                            <p className="text-center text-sm text-text-muted mt-4">
                                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                                <button
                                    onClick={() => setIsSignUp(!isSignUp)}
                                    className="text-accent-primary hover:underline font-medium"
                                >
                                    {isSignUp ? 'Sign In' : 'Sign Up'}
                                </button>
                            </p>

                            {/* Back Button */}
                            <button
                                onClick={() => {
                                    setShowEmailForm(false);
                                    setError(null);
                                }}
                                className="w-full text-center text-sm text-text-muted hover:text-text-primary mt-4 transition-colors"
                            >
                                ← Back to other options
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer */}
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                    <Lock size={12} />
                    <span>256-bit Encryption • SOC2 Compliant</span>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginModal;
