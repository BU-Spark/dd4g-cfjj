import { useState } from 'react';
import {
    Send, Sparkles, FileText, Activity,
    BarChart3, Folders, Clock, ChevronRight, MessageSquare
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Chat() {
    const [input, setInput] = useState('');

    const suggestedPrompts = [
        "What trends are emerging across complaint narratives?",
        "What issues appear most frequently by school setting?",
        "Summarize recurring concerns raised in recent complaints",
        "Are there notable patterns across officer-related narratives?"
    ];

    return (
        <div className="flex-1 flex flex-col gap-6 h-[calc(100vh-8rem)]">

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl border border-cfjj-border/60 shadow-sm overflow-hidden animate-fade-in">

                {/* Chat Timeline (Welcome State for now) */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 flex items-center justify-center">
                    <div className="max-w-2xl mx-auto w-full flex flex-col items-center justify-center space-y-8 animate-slide-up">

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
                                    onClick={() => setInput(prompt)}
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
                </div>

                {/* Input Composer */}
                <div className="p-4 border-t border-cfjj-border/50 bg-white">
                    <div className="max-w-3xl mx-auto relative rounded-xl hover:shadow-md transition-shadow">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about trends, recurring concerns, or patterns in the complaint data..."
                            className="w-full resize-none min-h-[80px] bg-cfjj-bg border border-cfjj-border/60 rounded-xl p-4 pr-16 text-sm text-cfjj-text-primary focus:outline-none focus:ring-2 focus:ring-cfjj-blue/30 focus:border-cfjj-blue transition-all"
                        />
                        <button
                            className={cn(
                                "absolute right-3 bottom-3 p-2.5 rounded-lg transition-all",
                                input.trim()
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