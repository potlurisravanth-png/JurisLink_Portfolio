import React from 'react';
import { Bot, FileText, LayoutGrid, Briefcase, ArrowRight, Scale } from 'lucide-react';

const suggestions = [
    { label: "Review Contract", icon: FileText, prompt: "Please review this contract for potential risks and clauses that need attention.", desc: "Upload & analyze" },
    { label: "Case Strategy", icon: LayoutGrid, prompt: "I need a legal strategy for a complex case involving...", desc: "Multi-agent debate" },
    { label: "Legal Research", icon: Briefcase, prompt: "Conduct legal research on the following topic...", desc: "Deep analysis" },
];

const WelcomeScreen = ({ onSuggestionClick }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto px-6 text-center animate-fade-in-up">
            {/* Icon */}
            <div className="relative w-20 h-20 rounded-2xl mb-6 flex items-center justify-center bg-accent-primary/10 border border-accent-primary/20 glow-accent">
                <Scale size={40} className="text-accent-primary" />
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-2 text-text-primary tracking-tight">
                JurisLink <span className="text-gradient">AI</span>
            </h1>

            <p className="text-lg text-text-secondary max-w-2xl mb-3 leading-relaxed">
                Adversarial legal strategist powered by multi-agent AI.
            </p>

            {/* Shimmer line */}
            <div className="gradient-line w-32 mb-10" />

            {/* Suggestion Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full stagger">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => onSuggestionClick(s.prompt)}
                        className="group relative p-6 rounded-2xl border border-glass-border bg-glass-panel hover:border-accent-primary/30 transition-all duration-300 text-left card-hover animate-fade-in-up"
                    >
                        <div className="mb-4 p-3 rounded-xl w-fit bg-accent-primary/8 border border-accent-primary/12 text-accent-primary group-hover:bg-accent-primary/15 group-hover:shadow-lg group-hover:shadow-accent-primary/10 transition-all">
                            <s.icon size={22} />
                        </div>
                        <h3 className="font-semibold text-text-primary mb-1">{s.label}</h3>
                        <p className="text-xs text-text-muted mb-3">{s.desc}</p>
                        <div className="flex items-center text-xs text-text-muted group-hover:text-accent-primary transition-colors">
                            <span>Start</span>
                            <ArrowRight size={12} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default WelcomeScreen;
