import React from 'react';
 
import { motion } from 'framer-motion';

/**
 * TypingIndicator - 3-dot staggered bounce animation.
 *
 * [R12] Loading State Mandate: Replaces raw ellipsis (...) with
 * animated typing dots during async operations.
 *
 * Design tokens sourced from frontend-specialist skill v4.0.
 */

const dotVariants = {
    initial: { y: 0 },
    animate: (i) => ({
        y: [0, -8, 0],
        transition: {
            duration: 0.6,
            repeat: Infinity,
            repeatDelay: 0.2,
            delay: i * 0.15,
            ease: 'easeInOut',
        },
    }),
};

const TypingIndicator = ({ className = '' }) => {
    return (
        <div className={`flex items-center gap-1.5 px-2 py-1 ${className}`}>
            {[0, 1, 2].map((i) => (
                <motion.span
                    key={i}
                    custom={i}
                    variants={dotVariants}
                    initial="initial"
                    animate="animate"
                    className="w-2 h-2 rounded-full bg-accent-primary/60"
                />
            ))}
        </div>
    );
};

export default TypingIndicator;
