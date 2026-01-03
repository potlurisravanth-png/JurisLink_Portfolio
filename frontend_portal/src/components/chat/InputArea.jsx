import React, { useRef, useState, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Send, Paperclip, Mic, MicOff, StopCircle, X, FileText } from 'lucide-react';
import Button from '../ui/Button';

const InputArea = ({ input, setInput, handleSend, handleStop, loading }) => {
    const fileInputRef = useRef(null);
    const [attachedFile, setAttachedFile] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recognition, setRecognition] = useState(null);
    const [interimTranscript, setInterimTranscript] = useState('');

    // Initialize Speech Recognition
    useEffect(() => {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            const recognizer = new SpeechRecognition();
            recognizer.continuous = true;
            recognizer.interimResults = true;
            recognizer.lang = 'en-US';

            recognizer.onresult = (event) => {
                let interim = '';
                let final = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        final += transcript + ' ';
                    } else {
                        interim += transcript;
                    }
                }

                if (final) {
                    setInput(prev => prev + final);
                    setInterimTranscript('');
                } else {
                    setInterimTranscript(interim);
                }
            };

            recognizer.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);
                setInterimTranscript('');

                if (event.error === 'not-allowed') {
                    alert('Microphone access denied. Please allow microphone access in your browser settings.');
                } else if (event.error === 'no-speech') {
                    // No speech detected, just stop quietly
                } else {
                    alert(`Speech recognition error: ${event.error}`);
                }
            };

            recognizer.onend = () => {
                setIsRecording(false);
                setInterimTranscript('');
            };

            setRecognition(recognizer);
        }

        return () => {
            if (recognition) {
                recognition.abort();
            }
        };
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // File attachment handler
    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }
            setAttachedFile(file);
            // Add file name to input for context
            const fileContext = `[Attached: ${file.name}] `;
            if (!input.includes(fileContext)) {
                setInput(prev => fileContext + prev);
            }
        }
        // Reset input so same file can be selected again
        e.target.value = '';
    };

    const removeAttachment = () => {
        if (attachedFile) {
            const fileContext = `[Attached: ${attachedFile.name}] `;
            setInput(prev => prev.replace(fileContext, ''));
            setAttachedFile(null);
        }
    };

    // Voice recording handler using Web Speech API
    const handleMicClick = async () => {
        if (!recognition) {
            alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        if (isRecording) {
            // Stop recording
            recognition.stop();
            setIsRecording(false);
            setInterimTranscript('');
        } else {
            // Start recording
            try {
                // Request microphone permission first
                await navigator.mediaDevices.getUserMedia({ audio: true });

                recognition.start();
                setIsRecording(true);
            } catch (err) {
                console.error('Microphone access denied:', err);
                alert('Microphone access is required for voice input. Please allow microphone access in your browser settings.');
            }
        }
    };

    // Check if speech recognition is supported
    const isSpeechSupported = typeof window !== 'undefined' &&
        (window.SpeechRecognition || window.webkitSpeechRecognition);

    return (
        <div className="relative mx-auto max-w-4xl w-full">
            {/* Attached file indicator */}
            {attachedFile && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-accent-primary/10 border border-accent-primary/20 rounded-xl text-sm">
                    <FileText size={16} className="text-accent-primary" />
                    <span className="text-text-secondary truncate flex-1">{attachedFile.name}</span>
                    <button
                        onClick={removeAttachment}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={14} className="text-text-muted" />
                    </button>
                </div>
            )}

            {/* Recording indicator with interim transcript */}
            {isRecording && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-sm animate-pulse">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-400 font-medium">Listening...</span>
                    {interimTranscript && (
                        <span className="text-text-muted italic truncate flex-1 ml-2">"{interimTranscript}"</span>
                    )}
                </div>
            )}

            <div className={`
                relative flex items-end gap-2 p-2 rounded-3xl border transition-all duration-300
                glass
                ${loading ? 'opacity-75 cursor-not-allowed' : 'focus-within:border-accent-primary/50 focus-within:ring-1 focus-within:ring-accent-primary/20'}
            `}>

                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png"
                />

                {/* Attachment Button */}
                <button
                    onClick={handleAttachClick}
                    disabled={loading}
                    className="p-3 text-text-muted hover:text-text-primary hover-bg rounded-full transition-colors self-end mb-1 disabled:opacity-50"
                    title="Attach file (PDF, DOC, TXT, Images)"
                >
                    <Paperclip size={20} />
                </button>

                {/* Text Area */}
                <TextareaAutosize
                    minRows={1}
                    maxRows={8}
                    className="flex-1 max-h-[200px] bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted py-3 px-2 resize-none leading-relaxed text-base"
                    placeholder={isRecording ? "Speak now..." : loading ? "AI is thinking..." : "Describe your legal situation or ask a question..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                />

                {/* Right Actions */}
                <div className="flex items-center gap-2 self-end mb-1">
                    {!loading && isSpeechSupported && (
                        <button
                            onClick={handleMicClick}
                            className={`p-3 rounded-full transition-colors ${isRecording
                                ? 'text-red-500 bg-red-500/10 animate-pulse'
                                : 'text-text-muted hover:text-text-primary hover-bg'
                                }`}
                            title={isRecording ? "Stop recording" : "Voice input"}
                        >
                            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
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
                                    : 'bg-bg-subtle text-text-muted cursor-not-allowed opacity-60 rotate-90 scale-90'}
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
