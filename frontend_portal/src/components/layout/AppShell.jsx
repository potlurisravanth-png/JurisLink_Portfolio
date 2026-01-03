import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AppShell = ({ sidebar, analysisPanel, children, isSidebarOpen, isAnalysisOpen }) => {
    return (
        <div className="flex h-screen w-screen bg-bg-app overflow-hidden">
            {/* Background Decorator */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-accent-primary/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px]" />
            </div>

            {/* Left Sidebar - Collapsible on Mobile */}
            <AnimatePresence mode="wait">
                <motion.aside
                    initial={{ x: -260, opacity: 0 }}
                    animate={{ x: 0, opacity: 1, width: isSidebarOpen ? '240px' : '0px' }}
                    exit={{ x: -260, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className={`
                        relative z-20 h-full border-r border-glass-border bg-glass-panel backdrop-blur-xl flex-shrink-0 overflow-hidden
                        ${isSidebarOpen ? 'block' : 'hidden'} md:block
                    `}
                >
                    <div className="h-full w-[240px]">
                        {sidebar}
                    </div>
                </motion.aside>
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 relative z-10 flex flex-col h-full bg-transparent">
                {children}
            </main>

            {/* Right Analysis Panel - Collapsible */}
            <AnimatePresence mode="wait">
                {isAnalysisOpen && (
                    <motion.aside
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="relative z-20 h-full w-[300px] border-l border-glass-border bg-glass-panel backdrop-blur-xl flex-shrink-0 hidden lg:block overflow-hidden"
                    >
                        <div className="h-full w-[300px]">
                            {analysisPanel}
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AppShell;
