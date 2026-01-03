import React from 'react';

const GlassCard = ({ children, className = '', hoverEffect = false }) => {
    return (
        <div
            className={`
                glass rounded-2xl border-glass-border
                ${hoverEffect ? 'hover:bg-white/5 hover:border-white/10 transition-colors duration-300' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    );
};

export default GlassCard;
