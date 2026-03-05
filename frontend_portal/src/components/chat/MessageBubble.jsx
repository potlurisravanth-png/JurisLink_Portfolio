import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, ThumbsUp, ThumbsDown, Copy, RefreshCw, AlertTriangle, FileText, Download } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const StreamedMessage = ({ content, isFinal }) => {
    const safeContent = typeof content === 'string' ? content : String(content || '');
    const [display, setDisplay] = useState(isFinal ? safeContent : '');

    useEffect(() => {
        if (isFinal) { setDisplay(safeContent); return; }

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
        <div className="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-bg-subtle prose-pre:border prose-pre:border-glass-border prose-headings:text-text-primary prose-p:text-text-primary prose-strong:text-text-primary prose-li:text-text-primary prose-a:text-accent-primary">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ node, inline, className, children, ...props }) {
                        return !inline ? (
                            <div className="relative group my-4 rounded-2xl overflow-hidden border border-glass-border bg-bg-subtle">
                                <div className="flex items-center justify-between px-4 py-2 bg-glass-highlight border-b border-glass-border text-xs text-text-muted font-mono">
                                    <span>Code</span>
                                    <button
                                        className="hover:text-accent-primary transition-colors"
                                        onClick={() => navigator.clipboard.writeText(String(children))}
                                    >
                                        <Copy size={12} />
                                    </button>
                                </div>
                                <code className={`block p-4 overflow-x-auto text-text-primary ${className}`} {...props}>
                                    {children}
                                </code>
                            </div>
                        ) : (
                            <code className="bg-accent-primary/10 rounded px-1.5 py-0.5 font-mono text-sm text-accent-primary" {...props}>
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
            data-agent-schema="ChatResponse"
            data-agent-field={isUser ? 'user_message' : 'response'}
        >
            {/* Avatar */}
            <div className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border
                ${isUser
                    ? 'bg-accent-primary text-bg-app border-accent-primary/50'
                    : 'bg-glass-panel text-accent-primary border-glass-border'
                }
            `}>
                {isUser ? <User size={14} /> : <Bot size={16} />}
            </div>

            {/* Bubble */}
            <div className={`relative max-w-[85%] lg:max-w-[75%]`}>
                <div className={`
                    p-5 rounded-[1.5rem]
                    ${isUser
                        ? 'bg-accent-primary/15 border border-accent-primary/25 text-text-primary rounded-tr-md'
                        : 'bg-glass-panel border border-glass-border text-text-primary rounded-tl-md'
                    }
                `}>
                    {isUser ? (
                        <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
                    ) : (
                        <div className="space-y-4">
                            <StreamedMessage content={content} isFinal={isFinal} />

                            {/* Error State */}
                            {isError && (
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                    <span>Failed to generate response. Please try again.</span>
                                </div>
                            )}

                            {/* Document Download */}
                            {docUrl && (
                                <div className="mt-3">
                                    <a
                                        href={docUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full btn-champagne text-sm"
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
                        <button className="p-1.5 rounded-lg text-text-muted hover:text-accent-primary hover:bg-accent-primary/5 transition-colors" title="Copy">
                            <Copy size={14} onClick={() => navigator.clipboard.writeText(content)} />
                        </button>
                        <button className="p-1.5 rounded-lg text-text-muted hover:text-accent-primary hover:bg-accent-primary/5 transition-colors" title="Helpful">
                            <ThumbsUp size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg text-text-muted hover:text-accent-primary hover:bg-accent-primary/5 transition-colors" title="Not Helpful">
                            <ThumbsDown size={14} />
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default MessageBubble;
