import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, ThumbsUp, ThumbsDown, Copy, RefreshCw, AlertTriangle, FileText, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const StreamedMessage = ({ content, isFinal }) => {
    const safeContent = typeof content === 'string' ? content : String(content || '');
    const [display, setDisplay] = useState(isFinal ? safeContent : '');

    useEffect(() => {
        if (isFinal) { setDisplay(safeContent); return; }

        // Simulating streaming effect if not final (though backend usually streams, this smoothens it)
        let i = 0;
        const interval = setInterval(() => {
            setDisplay(safeContent.slice(0, i));
            i += 5;
            if (i > safeContent.length) clearInterval(interval);
        }, 10);

        return () => clearInterval(interval);
    }, [safeContent, isFinal]);

    if (!display) return <span className="animate-pulse text-text-muted">...</span>;

    return (
        <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ node, inline, className, children, ...props }) {
                        return !inline ? (
                            <div className="relative group my-4 rounded-xl overflow-hidden border border-white/5 bg-black/40">
                                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5 text-xs text-text-muted font-mono">
                                    <span>Code</span>
                                    <button
                                        className="hover:text-white transition-colors"
                                        onClick={() => navigator.clipboard.writeText(String(children))}
                                    >
                                        <Copy size={12} />
                                    </button>
                                </div>
                                <code className={`block p-4 overflow-x-auto ${className}`} {...props}>
                                    {children}
                                </code>
                            </div>
                        ) : (
                            <code className="bg-white/10 rounded px-1.5 py-0.5 font-mono text-sm text-accent-primary" {...props}>
                                {children}
                            </code>
                        );
                    }
                }}
            >
                {display}
            </ReactMarkdown>
        </div>
    );
};

const MessageBubble = ({ role, content, isFinal = true, isError = false, docUrl = null }) => {
    const isUser = role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-8`}
        >
            {/* Avatar */}
            <div className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border
                ${isUser
                    ? 'bg-accent-primary text-white border-accent-glow'
                    : 'bg-glass-panel text-accent-primary border-glass-border'
                }
            `}>
                {isUser ? <User size={14} /> : <Bot size={16} />}
            </div>

            {/* Bubble */}
            <div className={`relative max-w-[85%] lg:max-w-[75%]`}>
                <div className={`
                    p-5 rounded-2xl
                    ${isUser
                        ? 'bg-accent-primary text-white shadow-lg shadow-blue-500/20 rounded-tr-sm'
                        : 'bg-glass-panel border border-glass-border text-text-primary rounded-tl-sm'
                    }
                `}>
                    {isUser ? (
                        <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
                    ) : (
                        <div className="space-y-4">
                            <StreamedMessage content={content} isFinal={isFinal} />

                            {/* Error State */}
                            {isError && (
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                    <span>Failed to generate response. Please try again.</span>
                                </div>
                            )}

                            {/* Document Download Attachment */}
                            {docUrl && (
                                <div className="mt-3">
                                    <a
                                        href={docUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-primary hover:bg-blue-600 text-white font-medium text-sm transition-colors"
                                    >
                                        <Download size={16} />
                                        <span>Download Generated Document</span>
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions (Bot Only) */}
                {!isUser && !isError && (
                    <div className="flex items-center gap-1 mt-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors" title="Copy">
                            <Copy size={14} onClick={() => navigator.clipboard.writeText(content)} />
                        </button>
                        <button className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors" title="Helpful">
                            <ThumbsUp size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors" title="Not Helpful">
                            <ThumbsDown size={14} />
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default MessageBubble;
