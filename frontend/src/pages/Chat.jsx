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
        <div className="flex-1 flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">

            {/* Left Column: Chat Area */}
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

            {/* Right Column: Context/Evidence Panel */}
            <div className="w-full lg:w-80 flex flex-col gap-4 animate-slide-up flex-shrink-0">

                {/* Source References */}
                <div className="bg-white rounded-xl border border-cfjj-border/60 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-heading font-semibold text-cfjj-navy text-sm flex items-center gap-2">
                            <FileText className="w-4 h-4 text-cfjj-blue" />
                            Active Context
                        </h3>
                        <span className="text-[10px] uppercase tracking-wider font-mono text-cfjj-text-secondary font-semibold bg-cfjj-muted px-2 py-1 rounded">
                            Default
                        </span>
                    </div>
                    <p className="text-xs text-cfjj-text-secondary leading-relaxed mb-4">
                        Current analysis includes complaint narratives and structured intake records from the latest upload set.
                    </p>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-cfjj-bg border border-cfjj-border/50">
                            <div className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-cfjj-text-secondary" />
                                <span className="text-xs font-medium text-cfjj-text-primary">2024_Complaints.csv</span>
                            </div>
                            <span className="text-xs text-cfjj-text-secondary/70">8.2 MB</span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-cfjj-bg border border-cfjj-border/50">
                            <div className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-cfjj-text-secondary" />
                                <span className="text-xs font-medium text-cfjj-text-primary">BPD_Intakes_Q2.csv</span>
                            </div>
                            <span className="text-xs text-cfjj-text-secondary/70">1.4 MB</span>
                        </div>
                    </div>
                </div>

                {/* Quick Insights */}
                <div className="bg-white rounded-xl border border-cfjj-border/60 p-5 shadow-sm">
                    <h3 className="font-heading font-semibold text-cfjj-navy text-sm flex items-center gap-2 mb-4">
                        <Activity className="w-4 h-4 text-cfjj-blue" />
                        Data Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-cfjj-muted rounded-lg flex flex-col gap-1">
                            <span className="text-cfjj-text-secondary text-xs font-medium">Records Processed</span>
                            <span className="font-mono text-cfjj-navy text-lg font-bold">14,204</span>
                        </div>
                        <div className="p-3 bg-cfjj-muted rounded-lg flex flex-col gap-1">
                            <span className="text-cfjj-text-secondary text-xs font-medium">Narratives Built</span>
                            <span className="font-mono text-cfjj-navy text-lg font-bold">9,411</span>
                        </div>
                    </div>
                </div>

                {/* Suggested Follow-Ups */}
                <div className="bg-cfjj-navy text-white rounded-xl p-5 shadow-inner">
                    <h3 className="font-heading font-semibold text-sm flex items-center gap-2 mb-4 text-cfjj-surface">
                        <BarChart3 className="w-4 h-4 text-cfjj-soft-sky" />
                        Analytical Paths
                    </h3>
                    <div className="space-y-2">
                        {[
                            "Compare with prior uploads",
                            "Show most repeated concerns",
                            "Summarize differences by category"
                        ].map((path, i) => (
                            <button
                                key={i}
                                className="w-full flex items-center justify-between text-left text-xs text-cfjj-soft-sky hover:text-white p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                                onClick={() => setInput(path)}
                            >
                                <span>{path}</span>
                                <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
