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
    ExternalLink,
    Zap,
    BookOpen,
    Gavel
} from 'lucide-react';
import LegalGPS from '../components/LegalGPS';

/**
 * LandingPage — Legal Intelligence Platform
 * Deep navy background, animated grid, staggered tool cards
 */

const TOOLS = [
    {
        id: 'case-strategist',
        title: 'Case Strategist',
        description: 'Adversarial legal analysis with multi-agent debate engine. Get prosecution and defense arguments.',
        icon: Gavel,
        route: '/tool/chat',
        available: true,
        featured: true,
        tag: 'AI Debate'
    },
    {
        id: 'document-review',
        title: 'Document Review',
        description: 'Upload contracts. Get clause-level risk scoring and negotiation suggestions.',
        icon: FileText,
        route: '/tool/document',
        available: true,
        tag: 'Analysis'
    },
    {
        id: 'nda-generator',
        title: 'NDA Generator',
        description: 'Generate jurisdiction-aware non-disclosure agreements with e-signature.',
        icon: Shield,
        route: '/tool/nda',
        available: true,
        tag: 'Drafting'
    },
    {
        id: 'tenant-notice',
        title: 'Tenant Notice',
        description: 'Create compliant landlord-tenant dispute notices for your region.',
        icon: Home,
        route: '/tool/tenant',
        available: true,
        tag: 'Compliance'
    }
];

const STATS = [
    { value: '4', label: 'Legal Tools', icon: Zap },
    { value: '50+', label: 'Jurisdictions', icon: BookOpen },
    { value: '0', label: 'Data Retained', icon: Lock },
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
            transition={{ duration: 0.6, delay: 0.3 + index * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={tool.available ? { y: -6 } : {}}
            className={`relative glass rounded-2xl p-7 flex flex-col gap-5 overflow-hidden group card-hover
                  ${tool.available ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                  ${tool.featured ? 'ring-1 ring-accent-primary/30 glow-accent' : ''}`}
            onClick={handleClick}
        >
            {/* Featured Badge */}
            {tool.featured && (
                <div className="absolute top-4 right-4">
                    <div className="relative px-3 py-1.5 bg-accent-primary/15 rounded-full flex items-center gap-1.5 border border-accent-primary/25">
                        <Sparkles size={12} className="text-accent-primary" />
                        <span className="text-[11px] text-accent-primary font-bold tracking-wider uppercase">Live</span>
                    </div>
                </div>
            )}

            {/* Tag */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent-primary/10 border border-accent-primary/15
                           flex items-center justify-center
                           group-hover:bg-accent-primary/20 group-hover:border-accent-primary/25 group-hover:shadow-lg group-hover:shadow-accent-primary/10 transition-all duration-300">
                    <Icon size={22} className="text-accent-primary" />
                </div>
                <span className="text-[10px] font-bold text-text-muted tracking-[0.15em] uppercase">{tool.tag}</span>
            </div>

            {/* Content */}
            <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary mb-2 tracking-tight">{tool.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{tool.description}</p>
            </div>

            {/* Action */}
            {tool.available && (
                <div className="flex items-center gap-2 text-accent-primary text-sm font-medium pt-2 border-t border-glass-border
                        group-hover:gap-3 transition-all duration-300">
                    <span>Open Tool</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
            )}
        </motion.div>
    );
};

const LandingPage = () => {
    const [legalContext, setLegalContext] = useState({});

    return (
        <div className="min-h-screen w-full bg-bg-app overflow-auto relative">
            {/* ===== ANIMATED BACKGROUND ===== */}
            <div className="fixed inset-0 -z-10 bg-legal-grid">
                <div className="bg-orb bg-orb-1"></div>
                <div className="bg-orb bg-orb-2"></div>
                <div className="bg-orb bg-orb-3"></div>
            </div>

            {/* ===== HEADER ===== */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 px-6 py-5"
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center glow-accent">
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

                    <div className="flex items-center gap-2 px-4 py-2.5 glass rounded-full">
                        <Lock size={14} className="text-accent-primary" />
                        <span className="text-xs text-text-secondary font-medium">Zero Data Retention</span>
                    </div>
                </div>
            </motion.header>

            {/* ===== HERO ===== */}
            <main className="relative z-10 px-6 pt-12 pb-20">
                <div className="max-w-7xl mx-auto">
                    {/* Hero Text */}
                    <div className="text-center mb-8">
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-sm font-bold text-accent-primary tracking-[0.2em] uppercase mb-5"
                        >
                            Legal Intelligence Platform
                        </motion.p>

                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.15 }}
                            className="font-drama text-5xl md:text-7xl lg:text-8xl text-text-primary mb-6"
                        >
                            The Law,{' '}
                            <span className="text-gradient">Decoded.</span>
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.25 }}
                            className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed"
                        >
                            AI-powered legal analysis, document drafting, and risk assessment.
                            Privacy-first. Your data is never stored.
                        </motion.p>
                    </div>

                    {/* Shimmer Line */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="gradient-line max-w-md mx-auto mb-12"
                    />

                    {/* Stats Strip */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.45 }}
                        className="flex items-center justify-center gap-8 md:gap-16 mb-16"
                    >
                        {STATS.map((stat, i) => (
                            <div key={i} className="flex items-center gap-3 text-center">
                                <stat.icon size={18} className="text-accent-primary" />
                                <div>
                                    <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                                    <p className="text-xs text-text-muted font-medium tracking-wide uppercase">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Legal GPS */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="max-w-4xl mx-auto mb-20"
                    >
                        <LegalGPS onContextChange={setLegalContext} />
                    </motion.div>

                    {/* Tool Grid Header */}
                    <div className="flex items-center gap-4 mb-10">
                        <div className="gradient-line flex-1" />
                        <p className="text-sm font-bold text-text-muted tracking-[0.15em] uppercase whitespace-nowrap">
                            Choose Your Tool
                        </p>
                        <div className="gradient-line flex-1" />
                    </div>

                    {/* Tool Grid */}
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
            </main>

            {/* ===== FOOTER ===== */}
            <footer className="relative z-10 px-6 py-8 border-t border-glass-border footer-bg">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-text-muted text-sm link-hover">
                        <Lock size={14} className="text-accent-primary" />
                        <span>All data incinerated after 60 minutes • End-to-end encrypted</span>
                    </div>
                    <div className="text-text-muted text-sm">
                        © 2026 JurisTools • Built for the legal profession
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
