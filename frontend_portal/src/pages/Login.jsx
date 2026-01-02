import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scale, Shield } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { BsMicrosoft, BsGithub } from 'react-icons/bs';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { loginWithGoogle, loginWithMicrosoft, loginWithGitHub, isAuthenticated, error } = useAuth();
    const [isLoading, setIsLoading] = useState(null); // Track which provider is loading
    const [localError, setLocalError] = useState('');

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleSSO = async (provider) => {
        setLocalError('');
        setIsLoading(provider);

        try {
            switch (provider) {
                case 'google':
                    await loginWithGoogle();
                    break;
                case 'microsoft':
                    await loginWithMicrosoft();
                    break;
                case 'github':
                    await loginWithGitHub();
                    break;
                default:
                    throw new Error('Unknown provider');
            }
            navigate('/dashboard');
        } catch (err) {
            console.error('SSO Error:', err);
            setLocalError(err.message || 'Authentication failed. Please try again.');
        } finally {
            setIsLoading(null);
        }
    };

    const ssoButtons = [
        {
            id: 'google',
            label: 'Continue with Google',
            icon: FcGoogle,
            className: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200',
        },
        {
            id: 'microsoft',
            label: 'Continue with Microsoft',
            icon: BsMicrosoft,
            iconColor: 'text-[#00A4EF]',
            className: 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700',
        },
        {
            id: 'github',
            label: 'Continue with GitHub',
            icon: BsGithub,
            iconColor: 'text-white',
            className: 'bg-gray-900 hover:bg-gray-800 text-white border-gray-800',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-indigo-500/10 to-transparent rounded-full blur-3xl" />
            </div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Logo & Branding */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                        className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-blue-500/25"
                    >
                        <Scale size={40} className="text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">JurisLink Secure Portal</h1>
                    <p className="text-slate-400">Enterprise Legal Intelligence Platform</p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-2 text-slate-300 mb-2">
                            <Shield size={18} className="text-blue-400" />
                            <span className="text-sm font-medium">Single Sign-On</span>
                        </div>
                        <p className="text-slate-500 text-sm">Sign in with your organization credentials</p>
                    </div>

                    {/* SSO Buttons */}
                    <div className="space-y-3">
                        {ssoButtons.map((btn) => (
                            <motion.button
                                key={btn.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSSO(btn.id)}
                                disabled={isLoading !== null}
                                className={`w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl border font-medium transition-all ${btn.className} ${isLoading !== null ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading === btn.id ? (
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <btn.icon size={22} className={btn.iconColor || ''} />
                                )}
                                <span>{btn.label}</span>
                            </motion.button>
                        ))}
                    </div>

                    {/* Error Message */}
                    {(localError || error) && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 text-red-400 text-sm bg-red-900/20 border border-red-900/50 rounded-lg p-3 text-center"
                        >
                            {localError || error}
                        </motion.div>
                    )}

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-slate-900 px-2 text-slate-500">Secure authentication</span>
                        </div>
                    </div>

                    {/* Security Note */}
                    <p className="text-xs text-slate-500 text-center">
                        By signing in, you agree to our Terms of Service and Privacy Policy.
                        Your data is protected with enterprise-grade encryption.
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-600 text-xs mt-6">
                    © 2026 JurisLink AI. Enterprise Legal Intelligence.
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
