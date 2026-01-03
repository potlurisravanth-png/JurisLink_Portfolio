import React, { useRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Send, Paperclip, Mic, StopCircle } from 'lucide-react';
import Button from '../ui/Button';

const InputArea = ({ input, setInput, handleSend, handleStop, loading }) => {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="relative mx-auto max-w-4xl w-full">
            <div className={`
                relative flex items-end gap-2 p-2 rounded-3xl border transition-all duration-300
                glass
                ${loading ? 'opacity-75 cursor-not-allowed' : 'focus-within:border-accent-primary/50 focus-within:ring-1 focus-within:ring-accent-primary/20'}
            `}>

                {/* Attachment Button */}
                <button className="p-3 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors self-end mb-1">
                    <Paperclip size={20} />
                </button>

                {/* Text Area */}
                <TextareaAutosize
                    minRows={1}
                    maxRows={8}
                    className="flex-1 max-h-[200px] bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted py-3 px-2 resize-none leading-relaxed text-base"
                    placeholder={loading ? "AI is thinking..." : "Describe your legal situation or ask a question..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                />

                {/* Right Actions */}
                <div className="flex items-center gap-2 self-end mb-1">
                    {!input.trim() && !loading && (
                        <button className="p-3 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors">
                            <Mic size={20} />
                        </button>
                    )}

                    {loading ? (
                        <Button
                            variant="danger"
                            size="sm"
                            className="rounded-full w-10 h-10 p-0 flex items-center justify-center animate-pulse"
                            onClick={handleStop}
                        >
                            <StopCircle size={18} />
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            size="sm"
                            disabled={!input.trim()}
                            onClick={() => handleSend()}
                            className={`
                                rounded-full w-10 h-10 p-0 flex items-center justify-center transition-all duration-300
                                ${input.trim()
                                    ? 'bg-accent-primary hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 rotate-0 scale-100'
                                    : 'bg-white/5 text-text-muted cursor-not-allowed opacity-50 rotate-90 scale-90'}
                            `}
                        >
                            <Send size={18} className={input.trim() ? 'ml-0.5' : ''} />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InputArea;
