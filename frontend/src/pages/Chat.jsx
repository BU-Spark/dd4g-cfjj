import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Send, Sparkles, Folders, MessageSquare, Bot, User,
    Plus, Trash2, Loader2, Clock
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
    const bottomRef = useRef(null);
    const textareaRef = useRef(null);

    const suggestedPrompts = [
        "What trends are emerging across complaint narratives?",
        "What issues appear most frequently by school setting?",
        "Summarize recurring concerns raised in recent complaints",
        "Are there notable patterns across officer-related narratives?"
    ];

    useEffect(() => {
        api.listChats()
            .then(setChatList)
            .catch(console.error)
            .finally(() => setLoadingChats(false));
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, sending]);

    useEffect(() => {
        const t = textareaRef.current;
        if (!t) return;
        t.style.height = 'auto';
        t.style.height = `${Math.min(t.scrollHeight, 200)}px`;
    }, [input]);

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
            setChatList(prev => prev.filter(c => c._id !== id));
            if (activeChatId === id) startNewChat();
        } catch (err) {
            console.error('Failed to delete chat:', err);
        }
    }

    async function handleSend() {
        const text = input.trim();
        if (!text || sending) return;

        setSending(true);
        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setInput('');

        try {
            let chatId = activeChatId;

            if (!chatId) {
                const newChat = await api.createChat(text);
                chatId = newChat._id;
                setActiveChatId(chatId);
                setChatList(prev => [
                    { _id: newChat._id, title: newChat.title, updatedAt: newChat.updatedAt },
                    ...prev,
                ]);
            } else {
                await api.appendMessage(chatId, 'user', text);
            }

            const placeholder = { role: 'assistant', content: 'Analysis coming soon...' };
            await api.appendMessage(chatId, 'assistant', placeholder.content);
            setMessages(prev => [...prev, placeholder]);

        } catch (err) {
            console.error('Send failed:', err);
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: 'Something went wrong. Please try again.' },
            ]);
        } finally {
            setSending(false);
        }
    }

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
            <div className="flex-1 flex flex-col bg-white border-y border-r border-cfjj-border/60 rounded-r-2xl overflow-hidden animate-fade-in">

                <div className="flex-1 overflow-y-auto p-6 md:p-8">

                    {/* Welcome State */}
                    {messages.length === 0 && !sending && (
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

                            {/* Thinking indicator */}
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
                        </div>
                    )}
                </div>

                {/* Input Composer */}
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

        </div>
    );
}