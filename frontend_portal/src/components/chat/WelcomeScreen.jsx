import React from 'react';
import { Bot, FileText, LayoutGrid, Briefcase, ArrowRight } from 'lucide-react';

const suggestions = [
    { label: "Review Contract", icon: FileText, prompt: "Please review this contract for potential risks and clauses that need attention." },
    { label: "Case Strategy", icon: LayoutGrid, prompt: "I need a legal strategy for a complex case involving..." },
    { label: "Legal Research", icon: Briefcase, prompt: "Conduct legal research on the following topic..." },
];

const WelcomeScreen = ({ onSuggestionClick }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto px-6 text-center">
            {/* Icon */}
            <div className="w-24 h-24 rounded-[2rem] mb-8 flex items-center justify-center bg-accent-primary/10 border border-accent-primary/20 glow-accent">
                <Bot size={48} className="text-accent-primary" />
            </div>

            {/* Title — Drama Typography */}
            <h1 className="text-4xl md:text-5xl font-bold mb-2 text-text-primary tracking-tight">
                JurisLink
            </h1>
            <p className="font-drama text-3xl md:text-4xl text-gradient mb-4">
                AI
            </p>

            <p className="text-lg text-text-secondary max-w-2xl mb-12 leading-relaxed">
                Your advanced adversarial legal strategist. <br />
                Ready to stress-test claims, draft briefs, and analyze risks.
            </p>

            {/* Suggestion Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => onSuggestionClick(s.prompt)}
                        className="group relative p-6 rounded-[2rem] border border-glass-border bg-glass-panel hover:border-accent-primary/30 transition-all duration-300 text-left card-hover"
                    >
                        <div className="mb-4 p-3 rounded-xl w-fit bg-accent-primary/10 border border-accent-primary/15 text-accent-primary group-hover:bg-accent-primary/15 transition-colors">
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
