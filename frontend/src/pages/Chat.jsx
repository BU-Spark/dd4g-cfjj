import { useState, useRef, useEffect } from 'react';
import {
    Send, Sparkles, Folders, MessageSquare, User, Bot
} from 'lucide-react';
import { cn } from '../lib/utils';
import { sendMessage } from '../api/client';

export default function Chat() {
    const [input, setInput] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);
    const textareaRef = useRef(null);

    const suggestedPrompts = [
        "What trends are emerging across complaint narratives?",
        "What issues appear most frequently by school setting?",
        "Summarize recurring concerns raised in recent complaints",
        "Are there notable patterns across officer-related narratives?"
    ];

    // Auto-scroll to bottom on new message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, loading]);

    // Auto-resize textarea
    useEffect(() => {
        const t = textareaRef.current;
        if (!t) return;
        t.style.height = 'auto';
        t.style.height = `${Math.min(t.scrollHeight, 200)}px`;
    }, [input]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const userMsg = { role: 'user', content: input.trim() };
        setHistory(h => [...h, userMsg]);
        setInput('');
        setLoading(true);
        try {
            const res = await sendMessage(userMsg.content, history);
            setHistory(h => [...h, { role: 'assistant', content: res.answer }]);
        } catch (e) {
            setHistory(h => [...h, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handlePromptClick = (prompt) => {
        setInput(prompt);
        textareaRef.current?.focus();
    };

    return (
        <div className="flex-1 flex flex-col gap-6 h-[calc(100vh-8rem)]">
            <div className="flex-1 flex flex-col bg-white rounded-2xl border border-cfjj-border/60 shadow-sm overflow-hidden animate-fade-in">

                {/* Message Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">

                    {/* Welcome State — shown only when no messages */}
                    {history.length === 0 && !loading && (
                        <div className="max-w-2xl mx-auto w-full flex flex-col items-center justify-center space-y-8 animate-slide-up min-h-full">
                            <div className="text-center space-y-3">
                                <div className="mx-auto w-12 h-12 bg-cfjj-muted text-cfjj-navy rounded-xl flex items-center justify-center mb-6">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <h1 className="text-2xl md:text-3xl font-heading font-bold text-cfjj-navy tracking-tight">
                                    Explore complaint trends with source-backed analysis
                                </h1>
                                <p className="text-cfjj-text-secondary">
                                    Ask analytical questions to uncover patterns, summaries, and insights grounded in the compiled data.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mt-8">
                                {suggestedPrompts.map((prompt, i) => (
                                    <button
                                        key={i}
                                        className="flex items-start gap-4 p-4 text-left border border-cfjj-border/60 rounded-xl hover:border-cfjj-navy/30 hover:bg-cfjj-muted/50 transition-all group"
                                        onClick={() => handlePromptClick(prompt)}
                                    >
                                        <MessageSquare className="w-5 h-5 mt-0.5 text-cfjj-blue group-hover:text-cfjj-navy flex-none" />
                                        <span className="text-sm font-medium text-cfjj-text-primary/90 leading-snug">
                                            {prompt}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <p className="text-xs font-mono text-cfjj-text-secondary/80 flex items-center gap-2 mt-4">
                                <Folders className="w-3.5 h-3.5" />
                                Responses are grounded in uploaded source data
                            </p>
                        </div>
                    )}

                    {/* Conversation */}
                    {history.length > 0 && (
                        <div className="max-w-3xl mx-auto w-full space-y-6">
                            {history.map((m, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex gap-3 animate-fade-in",
                                        m.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {m.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-lg bg-cfjj-muted text-cfjj-navy flex items-center justify-center flex-none mt-1">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                    )}
                                    <div
                                        className={cn(
                                            "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                                            m.role === 'user'
                                                ? "bg-cfjj-navy text-white rounded-tr-sm"
                                                : "bg-cfjj-muted text-cfjj-text-primary rounded-tl-sm"
                                        )}
                                    >
                                        {m.content}
                                    </div>
                                    {m.role === 'user' && (
                                        <div className="w-8 h-8 rounded-lg bg-cfjj-orange/10 text-cfjj-orange flex items-center justify-center flex-none mt-1">
                                            <User className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Thinking indicator */}
                            {loading && (
                                <div className="flex gap-3 justify-start animate-fade-in">
                                    <div className="w-8 h-8 rounded-lg bg-cfjj-muted text-cfjj-navy flex items-center justify-center flex-none mt-1">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="bg-cfjj-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-cfjj-navy/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-cfjj-navy/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-cfjj-navy/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}

                            <div ref={bottomRef} />
                        </div>
                    )}
                </div>

                {/* Input Composer */}
                <div className="p-4 border-t border-cfjj-border/50 bg-white">
                    <div className="max-w-3xl mx-auto relative rounded-xl hover:shadow-md transition-shadow">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about trends, recurring concerns, or patterns in the complaint data..."
                            rows={1}
                            className="w-full resize-none min-h-[56px] bg-cfjj-bg border border-cfjj-border/60 rounded-xl p-4 pr-16 text-sm text-cfjj-text-primary focus:outline-none focus:ring-2 focus:ring-cfjj-blue/30 focus:border-cfjj-blue transition-all"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className={cn(
                                "absolute right-3 bottom-3 p-2.5 rounded-lg transition-all",
                                input.trim() && !loading
                                    ? "bg-cfjj-orange text-white hover:bg-[#c66b3d] shadow-sm transform hover:scale-105"
                                    : "bg-cfjj-border/60 text-cfjj-text-secondary/50 cursor-not-allowed"
                            )}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="text-center mt-3 flex justify-center gap-4 text-xs font-medium text-cfjj-text-secondary/80">
                        <span className="flex items-center gap-1.5 cursor-pointer hover:text-cfjj-navy transition-colors">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            All Data
                        </span>
                        <span className="flex items-center gap-1.5 cursor-pointer hover:text-cfjj-navy transition-colors">
                            <span className="w-2 h-2 rounded-full bg-cfjj-border"></span>
                            Narratives
                        </span>
                        <span className="flex items-center gap-1.5 cursor-pointer hover:text-cfjj-navy transition-colors">
                            <span className="w-2 h-2 rounded-full bg-cfjj-border"></span>
                            Structured Records
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}