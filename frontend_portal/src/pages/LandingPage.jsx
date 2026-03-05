import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
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
 * LandingPage — Midnight Luxe
 * Full hero + champagne tool grid
 */

const TOOLS = [
    {
        id: 'case-strategist',
        title: 'Case Strategist',
        description: 'Full legal analysis pipeline with adversarial debate',
        icon: Scale,
        route: '/tool/chat',
        available: true,
        featured: true
    },
    {
        id: 'document-review',
        title: 'Document Review',
        description: 'AI-powered contract analysis & risk assessment',
        icon: FileText,
        route: '/tool/document',
        available: true
    },
    {
        id: 'nda-generator',
        title: 'NDA Generator',
        description: 'Create enforceable privacy agreements',
        icon: Shield,
        route: '/tool/nda',
        available: true
    },
    {
        id: 'tenant-notice',
        title: 'Tenant Notice',
        description: 'Handle landlord-tenant disputes',
        icon: Home,
        route: '/tool/tenant',
        available: true
    }
];

const ToolCard = ({ tool, legalContext, onStart, index }) => {
    const navigate = useNavigate();
    const Icon = tool.icon;

    const handleClick = () => {
        if (!tool.available) return;
        onStart(tool);
        navigate(tool.route, { state: { legalContext } });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={tool.available ? { y: -4 } : {}}
            className={`relative glass rounded-[2rem] p-8 flex flex-col gap-5 overflow-hidden group card-hover
                  ${tool.available ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                  ${tool.featured ? 'ring-1 ring-accent-primary/30 glow-accent' : ''}`}
            onClick={handleClick}
        >
            {/* Featured Badge */}
            {tool.featured && (
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-accent-primary/15 rounded-full flex items-center gap-1.5 border border-accent-primary/20">
                    <Sparkles size={12} className="text-accent-primary" />
                    <span className="text-xs text-accent-primary font-semibold tracking-wide">LIVE</span>
                </div>
            )}

            {/* Icon */}
            <div className={`w-14 h-14 rounded-2xl bg-accent-primary/10 border border-accent-primary/20
                       flex items-center justify-center
                       group-hover:bg-accent-primary/20 group-hover:border-accent-primary/30 transition-all duration-300`}>
                <Icon size={26} className="text-accent-primary" />
            </div>

            {/* Content */}
            <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary mb-1.5 tracking-tight">{tool.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{tool.description}</p>
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
            {/* Ambient Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent-primary/5 via-bg-app to-bg-app"></div>
                <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-accent-primary/3 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-1/4 right-1/5 w-[400px] h-[400px] bg-accent-primary/2 rounded-full blur-[100px]"></div>
            </div>

            {/* Header */}
            <header className="relative z-10 px-6 py-5">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
                            <Scale size={22} className="text-accent-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-text-primary tracking-tight">JurisTools</h1>
                            <p className="text-xs text-text-muted">
                                Architected by{' '}
                                <a
                                    href="https://sravanthpotluri.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent-primary hover:underline inline-flex items-center gap-1 link-hover"
                                >
                                    Sravanth Potluri
                                    <ExternalLink size={10} />
                                </a>
                            </p>
                        </div>
                    </div>

                    {/* Privacy Badge */}
                    <div className="flex items-center gap-2 px-4 py-2 glass rounded-full">
                        <Lock size={14} className="text-accent-primary" />
                        <span className="text-xs text-text-secondary font-medium">Zero Data Retention</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 px-6 py-12">
                <div className="max-w-7xl mx-auto">
                    {/* Hero */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="text-center mb-16"
                    >
                        <p className="text-sm font-semibold text-accent-primary tracking-[0.2em] uppercase mb-4">
                            Legal Intelligence Platform
                        </p>
                        <h2 className="font-drama text-5xl md:text-7xl text-text-primary mb-6">
                            Precision.{' '}
                            <span className="text-gradient">Privacy.</span>
                        </h2>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
                            Privacy-first legal utilities powered by AI.
                            Your data stays yours — always.
                        </p>
                    </motion.div>

                    {/* Legal GPS */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="max-w-4xl mx-auto mb-20"
                    >
                        <LegalGPS onContextChange={setLegalContext} />
                    </motion.div>

                    {/* Tool Grid */}
                    <div className="mb-12">
                        <p className="text-sm font-semibold text-text-muted tracking-[0.15em] uppercase mb-8 text-center">
                            Choose Your Tool
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {TOOLS.map((tool, index) => (
                                <ToolCard
                                    key={tool.id}
                                    tool={tool}
                                    index={index}
                                    legalContext={legalContext}
                                    onStart={() => console.log('Starting:', tool.title)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 px-6 py-8 mt-12 border-t border-glass-border">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-text-muted text-sm">
                        <Lock size={14} className="text-accent-primary" />
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
