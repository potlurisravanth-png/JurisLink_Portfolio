import React from 'react';
import { Bot, FileText, LayoutGrid, Briefcase, ArrowRight } from 'lucide-react';

const suggestions = [
    { label: "Review Contract", icon: FileText, prompt: "Please review this contract for potential risks and clauses that need attention." },
    { label: "Case Strategy", icon: LayoutGrid, prompt: "I need a legal strategy for a complex case involving..." },
    { label: "Legal Research", icon: Briefcase, prompt: "Conduct legal research on the following topic..." },
];

const WelcomeScreen = ({ onSuggestionClick }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto px-6 text-center animate-fade-in-up">
            <div className="w-24 h-24 rounded-3xl mb-8 flex items-center justify-center bg-accent-primary/10 border border-accent-primary/20 shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]">
                <Bot size={48} className="text-accent-primary" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary tracking-tight">
                JurisLink <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-indigo-400">AI</span>
            </h1>

            <p className="text-lg text-text-secondary max-w-2xl mb-12 leading-relaxed">
                Your advanced adversarial legal strategist. <br />
                Ready to stress-test claims, draft briefs, and analyze risks.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => onSuggestionClick(s.prompt)}
                        className="group relative p-6 rounded-2xl border border-glass-border bg-glass-panel hover:bg-white/5 hover:border-accent-primary/30 transition-all duration-300 text-left hover:-translate-y-1 hover:shadow-xl"
                    >
                        <div className="mb-4 p-3 rounded-xl w-fit bg-bg-surface border border-white/5 text-accent-primary group-hover:scale-110 transition-transform">
                            <s.icon size={24} />
                        </div>
                        <h3 className="font-semibold text-text-primary mb-2">{s.label}</h3>
                        <div className="flex items-center text-xs text-text-muted group-hover:text-accent-primary transition-colors">
                            <span>Start Consultation</span>
                            <ArrowRight size={12} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default WelcomeScreen;
