import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FileText,
    Shield,
    Home,
    Scale,
    ArrowRight,
    Sparkles,
    Lock,
    ExternalLink
} from 'lucide-react';
import LegalGPS from '../components/LegalGPS';

/**
 * LandingPage - JurisTools Tool Grid
 * "Tool First" approach with Legal GPS integration
 */

const TOOLS = [
    {
        id: 'case-strategist',
        title: 'Case Strategist',
        description: 'Full legal analysis pipeline',
        icon: Scale,
        color: 'from-emerald-500 to-teal-500',
        route: '/tool/chat',
        available: true,
        featured: true
    },
    {
        id: 'document-review',
        title: 'Document Review',
        description: 'AI-powered contract analysis',
        icon: FileText,
        color: 'from-blue-500 to-cyan-500',
        route: '/tool/document',
        available: true
    },
    {
        id: 'nda-generator',
        title: 'NDA Generator',
        description: 'Create privacy agreements',
        icon: Shield,
        color: 'from-purple-500 to-pink-500',
        route: '/tool/nda',
        available: true
    },
    {
        id: 'tenant-notice',
        title: 'Tenant Notice',
        description: 'Handle landlord disputes',
        icon: Home,
        color: 'from-amber-500 to-orange-500',
        route: '/tool/tenant',
        available: true
    }
];

const ToolCard = ({ tool, legalContext, onStart }) => {
    const navigate = useNavigate();
    const Icon = tool.icon;

    const handleClick = () => {
        if (!tool.available) return;
        onStart(tool);
        navigate(tool.route, { state: { legalContext } });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={tool.available ? { scale: 1.02, y: -4 } : {}}
            transition={{ duration: 0.3 }}
            className={`relative glass rounded-2xl p-6 flex flex-col gap-4 overflow-hidden group
                  ${tool.available ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}
                  ${tool.featured ? 'ring-2 ring-accent-primary/50' : ''}`}
            onClick={handleClick}
        >
            {/* Featured Badge */}
            {tool.featured && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-accent-primary/20 rounded-full flex items-center gap-1">
                    <Sparkles size={12} className="text-accent-primary" />
                    <span className="text-xs text-accent-primary font-medium">Live</span>
                </div>
            )}

            {/* Coming Soon Badge */}
            {!tool.available && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-bg-subtle rounded-full">
                    <span className="text-xs text-text-muted">Coming Soon</span>
                </div>
            )}

            {/* Icon */}
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} 
                       flex items-center justify-center shadow-lg
                       group-hover:shadow-xl transition-shadow duration-300`}>
                <Icon size={28} className="text-white" />
            </div>

            {/* Content */}
            <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary mb-1">{tool.title}</h3>
                <p className="text-sm text-text-secondary">{tool.description}</p>
            </div>

            {/* Action */}
            {tool.available && (
                <div className="flex items-center gap-2 text-accent-primary text-sm font-medium
                        group-hover:gap-3 transition-all duration-300">
                    <span>Start</span>
                    <ArrowRight size={16} />
                </div>
            )}
        </motion.div>
    );
};

const LandingPage = () => {
    const [legalContext, setLegalContext] = useState({});

    return (
        <div className="min-h-screen w-full bg-bg-app overflow-auto">
            {/* Animated Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent-primary/10 via-bg-app to-bg-app"></div>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            {/* Header */}
            <header className="relative z-10 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-blue-600 flex items-center justify-center">
                            <Scale size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-text-primary tracking-tight">JurisTools</h1>
                            <p className="text-xs text-text-muted">
                                Architected by{' '}
                                <a
                                    href="https://sravanthpotluri.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent-primary hover:underline inline-flex items-center gap-1"
                                >
                                    Sravanth Potluri
                                    <ExternalLink size={10} />
                                </a>
                            </p>
                        </div>
                    </div>

                    {/* Privacy Badge */}
                    <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-full">
                        <Lock size={14} className="text-green-400" />
                        <span className="text-xs text-text-secondary">Zero Data Retention</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 px-6 py-12">
                <div className="max-w-7xl mx-auto">
                    {/* Hero Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
                            Legal Intelligence.{' '}
                            <span className="bg-gradient-to-r from-accent-primary to-cyan-400 bg-clip-text text-transparent">
                                Zero Data Retention.
                            </span>
                        </h2>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                            Privacy-first legal utilities powered by AI. Your data stays yours.
                        </p>
                    </motion.div>

                    {/* Legal GPS */}
                    <div className="max-w-4xl mx-auto mb-16">
                        <LegalGPS onContextChange={setLegalContext} />
                    </div>

                    {/* Tool Grid */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-text-secondary mb-6 text-center">
                            Choose Your Tool
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {TOOLS.map((tool, index) => (
                                <motion.div
                                    key={tool.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                >
                                    <ToolCard
                                        tool={tool}
                                        legalContext={legalContext}
                                        onStart={() => console.log('Starting:', tool.title)}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 px-6 py-8 mt-12 border-t border-glass-border">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-text-muted text-sm">
                        <Lock size={14} className="text-amber-400" />
                        <span>Privacy Protocol: All data incinerated after 60 minutes</span>
                    </div>
                    <div className="text-text-muted text-sm">
                        © 2026 JurisTools. Built with purpose.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
