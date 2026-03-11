<<<<<<< HEAD
import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Send, Sparkles, Folders, MessageSquare, Bot, User,
    Plus, Trash2, Loader2, Clock
=======
import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Send, Sparkles, FileText, Activity,
    BarChart3, Folders, Clock, ChevronRight, MessageSquare,
    Plus, Trash2, Loader2
>>>>>>> main
} from 'lucide-react';
import { useAuth } from '@clerk/react';
import { cn } from '../lib/utils';
import { createApiClient } from '../lib/api';

export default function Chat() {
    const { getToken } = useAuth();
    const api = useCallback(() => createApiClient(getToken), [getToken])();

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [chatList, setChatList] = useState([]);
    const [sending, setSending] = useState(false);
    const [loadingChats, setLoadingChats] = useState(true);
<<<<<<< HEAD
    const bottomRef = useRef(null);
    const textareaRef = useRef(null);
=======
    const messagesEndRef = useRef(null);
>>>>>>> main

    const suggestedPrompts = [
        "What trends are emerging across complaint narratives?",
        "What issues appear most frequently by school setting?",
        "Summarize recurring concerns raised in recent complaints",
        "Are there notable patterns across officer-related narratives?"
    ];

    // Load chat list on mount
    useEffect(() => {
        api.listChats()
            .then(setChatList)
            .catch(console.error)
            .finally(() => setLoadingChats(false));
    }, []);

<<<<<<< HEAD
    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, sending]);

    // Auto-resize textarea
    useEffect(() => {
        const t = textareaRef.current;
        if (!t) return;
        t.style.height = 'auto';
        t.style.height = `${Math.min(t.scrollHeight, 200)}px`;
    }, [input]);
=======
    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
>>>>>>> main

    function startNewChat() {
        setActiveChatId(null);
        setMessages([]);
        setInput('');
    }

    async function loadChat(id) {
        try {
            const chat = await api.getChat(id);
            setActiveChatId(chat._id);
            setMessages(chat.messages);
        } catch (err) {
            console.error('Failed to load chat:', err);
        }
    }

    async function deleteChat(e, id) {
        e.stopPropagation();
        try {
            await api.deleteChat(id);
<<<<<<< HEAD
            setChatList(prev => prev.filter(c => c._id !== id));
=======
            setChatList((prev) => prev.filter((c) => c._id !== id));
>>>>>>> main
            if (activeChatId === id) startNewChat();
        } catch (err) {
            console.error('Failed to delete chat:', err);
        }
    }

    async function handleSend() {
        const text = input.trim();
        if (!text || sending) return;

        setSending(true);
<<<<<<< HEAD
        setMessages(prev => [...prev, { role: 'user', content: text }]);
=======
        const userMessage = { role: 'user', content: text };
        setMessages((prev) => [...prev, userMessage]);
>>>>>>> main
        setInput('');

        try {
            let chatId = activeChatId;

            if (!chatId) {
<<<<<<< HEAD
                const newChat = await api.createChat(text);
                chatId = newChat._id;
                setActiveChatId(chatId);
                setChatList(prev => [
=======
                // Create new chat
                const newChat = await api.createChat(text);
                chatId = newChat._id;
                setActiveChatId(chatId);
                setChatList((prev) => [
>>>>>>> main
                    { _id: newChat._id, title: newChat.title, updatedAt: newChat.updatedAt },
                    ...prev,
                ]);
            } else {
<<<<<<< HEAD
                await api.appendMessage(chatId, 'user', text);
            }

            const placeholder = { role: 'assistant', content: 'Analysis coming soon...' };
            await api.appendMessage(chatId, 'assistant', placeholder.content);
            setMessages(prev => [...prev, placeholder]);

        } catch (err) {
            console.error('Send failed:', err);
            setMessages(prev => [
=======
                // Append user message
                await api.appendMessage(chatId, 'user', text);
            }

            // Placeholder assistant message
            const placeholder = { role: 'assistant', content: 'Analysis coming soon...' };
            await api.appendMessage(chatId, 'assistant', placeholder.content);
            setMessages((prev) => [...prev, placeholder]);

        } catch (err) {
            console.error('Send failed:', err);
            setMessages((prev) => [
>>>>>>> main
                ...prev,
                { role: 'assistant', content: 'Something went wrong. Please try again.' },
            ]);
        } finally {
            setSending(false);
        }
    }

<<<<<<< HEAD
    const handleKeyDown = (e) => {
=======
    function handleKeyDown(e) {
>>>>>>> main
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
<<<<<<< HEAD
    };

    const handlePromptClick = (prompt) => {
        setInput(prompt);
        textareaRef.current?.focus();
    };
=======
    }

    const hasMessages = messages.length > 0;
>>>>>>> main

    return (
        <div className="flex-1 flex flex-row gap-0 h-[calc(100vh-8rem)] overflow-hidden">

            {/* Left Sidebar: Chat History */}
            <div className="w-56 flex-shrink-0 flex flex-col bg-white border-r border-cfjj-border/60 rounded-l-2xl overflow-hidden">
                <div className="p-3 border-b border-cfjj-border/60 flex items-center justify-between flex-shrink-0">
                    <span className="text-xs font-semibold text-cfjj-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        History
                    </span>
                    <button
                        onClick={startNewChat}
                        className="p-1 rounded-md hover:bg-cfjj-muted text-cfjj-text-secondary hover:text-cfjj-navy transition-colors"
                        title="New Chat"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto py-1">
                    {loadingChats ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="w-4 h-4 animate-spin text-cfjj-text-secondary" />
                        </div>
                    ) : chatList.length === 0 ? (
                        <p className="text-xs text-cfjj-text-secondary/70 text-center p-4">No saved chats yet</p>
                    ) : (
                        chatList.map((chat) => (
                            <div
                                key={chat._id}
                                onClick={() => loadChat(chat._id)}
                                className={cn(
                                    "group flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer transition-colors",
                                    activeChatId === chat._id
                                        ? "bg-cfjj-muted text-cfjj-navy"
                                        : "hover:bg-cfjj-muted/60 text-cfjj-text-secondary hover:text-cfjj-navy"
                                )}
                            >
                                <span className="text-xs font-medium truncate flex-1">{chat.title}</span>
                                <button
                                    onClick={(e) => deleteChat(e, chat._id)}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-500 transition-all flex-shrink-0"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Center: Chat Area */}
<<<<<<< HEAD
            <div className="flex-1 flex flex-col bg-white border-y border-r border-cfjj-border/60 rounded-r-2xl overflow-hidden animate-fade-in">

                {/* Message Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">

                    {/* Welcome State */}
                    {messages.length === 0 && !sending && (
                        <div className="max-w-2xl mx-auto w-full flex flex-col items-center justify-center space-y-8 animate-slide-up min-h-full">
=======
            <div className="flex-1 flex flex-col bg-white border-y border-cfjj-border/60 overflow-hidden animate-fade-in">

                {/* Messages or Welcome */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {!hasMessages ? (
                        <div className="max-w-2xl mx-auto w-full flex flex-col items-center justify-center h-full space-y-8 animate-slide-up">
>>>>>>> main
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
<<<<<<< HEAD
                                        onClick={() => handlePromptClick(prompt)}
=======
                                        onClick={() => setInput(prompt)}
>>>>>>> main
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
<<<<<<< HEAD
                    )}

                    {/* Conversation — bubble styling */}
                    {messages.length > 0 && (
                        <div className="max-w-3xl mx-auto w-full space-y-6">
                            {messages.map((m, i) => (
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
                                    <div className={cn(
                                        "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                                        m.role === 'user'
                                            ? "bg-cfjj-navy text-white rounded-tr-sm"
                                            : "bg-cfjj-muted text-cfjj-text-primary rounded-tl-sm"
                                    )}>
                                        {m.content}
                                    </div>
                                    {m.role === 'user' && (
                                        <div className="w-8 h-8 rounded-lg bg-cfjj-orange/10 text-cfjj-orange flex items-center justify-center flex-none mt-1">
                                            <User className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Thinking indicator*/}
                            {sending && (
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
=======
                    ) : (
                        <div className="max-w-3xl mx-auto space-y-4">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex gap-3",
                                        msg.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-7 h-7 rounded-lg bg-cfjj-muted text-cfjj-navy flex items-center justify-center flex-shrink-0 mt-1">
                                            <Sparkles className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                    <div
                                        className={cn(
                                            "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                                            msg.role === 'user'
                                                ? "bg-cfjj-navy text-white rounded-tr-sm"
                                                : "bg-cfjj-muted text-cfjj-text-primary rounded-tl-sm"
                                        )}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {sending && (
                                <div className="flex gap-3 justify-start">
                                    <div className="w-7 h-7 rounded-lg bg-cfjj-muted text-cfjj-navy flex items-center justify-center flex-shrink-0 mt-1">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    </div>
                                    <div className="bg-cfjj-muted rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-cfjj-text-secondary italic">
                                        Thinking...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
>>>>>>> main
                        </div>
                    )}
                </div>

<<<<<<< HEAD
                {/* Input Composer — your version */}
=======
                {/* Input Composer */}
>>>>>>> main
                <div className="p-4 border-t border-cfjj-border/50 bg-white flex-shrink-0">
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
                            disabled={!input.trim() || sending}
                            className={cn(
                                "absolute right-3 bottom-3 p-2.5 rounded-lg transition-all",
                                input.trim() && !sending
                                    ? "bg-cfjj-orange text-white hover:bg-[#c66b3d] shadow-sm transform hover:scale-105"
                                    : "bg-cfjj-border/60 text-cfjj-text-secondary/50 cursor-not-allowed"
                            )}
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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

<<<<<<< HEAD
=======
            {/* Right Column: Context/Evidence Panel */}
            <div className="w-72 flex-shrink-0 flex flex-col gap-4 bg-cfjj-bg border-l border-cfjj-border/60 rounded-r-2xl p-4 overflow-y-auto animate-slide-up">

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
>>>>>>> main
        </div>
    );
}