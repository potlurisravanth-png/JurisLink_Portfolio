import React from 'react';
 
import { motion } from 'framer-motion';
import { Bot, FileText, LayoutGrid, Briefcase, ArrowRight } from 'lucide-react';

const suggestions = [
    { label: "Review Contract", icon: FileText, prompt: "Please review this contract for potential risks and clauses that need attention.", accent: 'from-blue-500 to-cyan-500' },
    { label: "Case Strategy", icon: LayoutGrid, prompt: "I need a legal strategy for a complex case involving...", accent: 'from-emerald-500 to-teal-500' },
    { label: "Legal Research", icon: Briefcase, prompt: "Conduct legal research on the following topic...", accent: 'from-purple-500 to-pink-500' },
];

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
};

const WelcomeScreen = ({ onSuggestionClick }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto px-6 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="w-24 h-24 rounded-3xl mb-8 flex items-center justify-center bg-accent-primary/10 border border-accent-primary/20 shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]"
            >
                <Bot size={48} className="text-accent-primary" />
            </motion.div>

            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="text-4xl md:text-5xl font-bold mb-6 text-text-primary tracking-tight"
            >
                JurisLink <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-indigo-400">AI</span>
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-lg text-text-secondary max-w-2xl mb-12 leading-relaxed"
            >
                Your advanced adversarial legal strategist. <br />
                Ready to stress-test claims, draft briefs, and analyze risks.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                {suggestions.map((s, i) => (
                    <motion.button
                        key={i}
                        custom={i}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] } }}
                        onClick={() => onSuggestionClick(s.prompt)}
                        className="group relative p-6 rounded-2xl border border-glass-border bg-glass-panel hover:bg-white/5 hover:border-accent-primary/30 transition-all duration-300 text-left overflow-hidden"
                        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
                    >
                        {/* Gradient Accent Bar (left edge) */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${s.accent} rounded-l-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />

                        {/* Inner Glow */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                            style={{ background: 'radial-gradient(ellipse at 0% 50%, rgba(59,130,246,0.06), transparent 60%)' }} />

                        <div className="mb-4 p-3 rounded-xl w-fit bg-bg-surface border border-white/5 text-accent-primary group-hover:scale-110 transition-transform duration-300">
                            <s.icon size={24} />
                        </div>
                        <h3 className="font-semibold text-text-primary mb-2">{s.label}</h3>
                        <div className="flex items-center text-xs text-text-muted group-hover:text-accent-primary transition-colors">
                            <span>Start Consultation</span>
                            <ArrowRight size={12} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

export default WelcomeScreen;
