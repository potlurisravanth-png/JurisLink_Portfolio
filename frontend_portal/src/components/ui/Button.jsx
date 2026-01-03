import React from 'react';

const variants = {
    primary: 'bg-accent-primary hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20',
    secondary: 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
    ghost: 'hover:bg-white/5 text-text-secondary hover:text-text-primary',
    danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
};

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    icon: Icon,
    onClick,
    disabled = false,
    ...props
}) => {
    const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                ${variants[variant]}
                ${sizeClasses}
                ${className}
            `}
            {...props}
        >
            {Icon && <Icon size={size === 'sm' ? 14 : 18} />}
            {children}
        </button>
    );
};

export default Button;
