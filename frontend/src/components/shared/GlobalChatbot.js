"use client";

import { getApiBaseUrl } from '@/lib/api';
import React, { useState, useRef, useEffect } from 'react';
import {
    MessageCircle,
    X,
    Send,
    Bot,
    User,
    Sparkles,
    Search,
    Package,
    CreditCard,
    BarChart3,
    DollarSign,
    Headphones,
    ShoppingBag
} from 'lucide-react';

const INITIAL_WELCOME_MESSAGE = `👋 Welcome to GearUp!
I'm your AI wholesale assistant.

I can help you with:
✓ Find Suppliers
✓ Browse Products
✓ Track Wholesale Orders
✓ Payment Information
✓ Seller Payouts
✓ Refund Policy
✓ Marketplace Guidance

Type your question below or choose one of the suggestions.`;

const QUICK_ACTIONS = [
    { label: 'Find Suppliers', icon: Search, query: 'How do I find suppliers?' },
    { label: 'Browse Products', icon: ShoppingBag, query: 'How do I browse wholesale products?' },
    { label: 'Track Order', icon: Package, query: 'What is the order process and tracking?' },
    { label: 'Payments', icon: CreditCard, query: 'What payment methods are supported?' },
    { label: 'Analytics', icon: BarChart3, query: 'Help with analytics and reporting' },
    { label: 'Seller Payout', icon: DollarSign, query: 'How do seller payouts work?' },
    { label: 'Contact Support', icon: Headphones, query: 'How can I contact support?' }
];

const GlobalChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: INITIAL_WELCOME_MESSAGE,
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            text: input,
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${getApiBaseUrl()}/api/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify({ message: currentInput }),
            });

            const data = await response.json();

            if (data.success) {
                const botMessage = {
                    id: Date.now() + 1,
                    text: data.data.reply,
                    sender: 'bot',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, botMessage]);
            } else {
                throw new Error(data.error || 'Failed to get AI response');
            }
        } catch (error) {
            console.error('Chat Error:', error);
            const botMessage = {
                id: Date.now() + 1,
                text: "I'm having trouble connecting to the AI assistant. Please try again later.",
                sender: 'bot',
                timestamp: new Date(),
                isError: true
            };
            setMessages(prev => [...prev, botMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Trigger Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-[9999] group flex items-center gap-3 bg-gradient-to-r from-slate-900 to-[#062B20] text-white p-2.5 pr-5 rounded-full shadow-[0_12px_30px_rgba(0,168,120,0.35)] hover:shadow-[0_16px_40px_rgba(0,168,120,0.5)] border border-[#00A878]/30 transition-all duration-300 hover:scale-105 active:scale-95"
                    title="Chat with GearUp AI Assistant"
                >
                    <div className="relative w-11 h-11 bg-gradient-to-tr from-[#00A878] to-emerald-400 rounded-full flex items-center justify-center shadow-inner">
                        <Sparkles size={20} className="text-white group-hover:rotate-12 transition-transform duration-300" />
                        <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full">
                            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60"></span>
                        </span>
                    </div>
                    <div className="text-left hidden sm:block">
                        <div className="text-xs font-bold font-heading text-white tracking-tight leading-tight">
                            GearUp AI Assistant
                        </div>
                        <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">Online & Ready</div>
                    </div>
                </button>
            )}

            {/* Modern Chat Panel Container */}
            {isOpen && (
                <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[430px] h-[calc(100vh-4rem)] sm:h-[650px] max-h-[700px] bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 z-[9999] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
                    
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#062B20] text-white px-6 py-4.5 flex items-center justify-between border-b border-white/10 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-tr from-[#00A878] to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-[#00A878]/30 ring-2 ring-white/10">
                                    <Sparkles size={20} className="text-white" />
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full shadow-sm">
                                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
                                </span>
                            </div>
                            <div>
                                <div className="font-heading font-black text-sm tracking-tight flex items-center gap-1.5 text-white" style={{ color: '#ffffff' }}>
                                    <span className="font-extrabold text-white" style={{ color: '#ffffff' }}>GearUp AI Assistant</span>
                                    <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-widest bg-[#00A878]/30 border border-[#00A878]/50 rounded-full" style={{ color: '#6ee7b7' }}>
                                        Active
                                    </span>
                                </div>
                                <p className="font-body text-[11px] font-medium leading-tight mt-0.5 text-slate-300" style={{ color: '#cbd5e1' }}>
                                    Helping wholesalers & manufacturers
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all active:scale-95"
                            aria-label="Close Assistant"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F8FAFC] scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
                        {messages.map((message) => {
                            const isUser = message.sender === 'user';
                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                                >
                                    <div className={`flex gap-3 max-w-[88%] items-start ${isUser ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5 ${
                                            isUser 
                                                ? 'bg-slate-900 text-white' 
                                                : 'bg-[#00A878]/10 text-[#00A878] border border-[#00A878]/20'
                                        }`}>
                                            {isUser ? <User size={15} /> : <Bot size={16} />}
                                        </div>
                                        <div className={`rounded-2xl px-4.5 py-3.5 shadow-sm font-sans text-sm leading-relaxed ${
                                            isUser
                                                ? 'bg-gradient-to-r from-slate-900 to-[#062B20] text-white rounded-tr-none shadow-md'
                                                : message.isError
                                                    ? 'bg-rose-50 text-rose-800 border border-rose-200 rounded-tl-none'
                                                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                                        }`}>
                                            <p className="whitespace-pre-line font-medium text-[13.5px] leading-relaxed">{message.text}</p>
                                            <span className={`block text-[9.5px] font-semibold mt-2 ${isUser ? 'text-slate-400 text-right' : 'text-slate-400'}`}>
                                                {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Typing Loader */}
                        {isLoading && (
                            <div className="flex justify-start animate-in fade-in duration-200">
                                <div className="flex gap-3 max-w-[85%] items-start">
                                    <div className="w-8 h-8 rounded-xl bg-[#00A878]/10 border border-[#00A878]/20 flex items-center justify-center shrink-0 text-[#00A878] shadow-sm mt-0.5">
                                        <Bot size={16} />
                                    </div>
                                    <div className="rounded-2xl rounded-tl-none px-4 py-3 bg-white border border-slate-200/80 shadow-sm flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-[#00A878] rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-[#00A878] rounded-full animate-bounce [animation-delay:0.15s]"></span>
                                        <span className="w-2 h-2 bg-[#00A878] rounded-full animate-bounce [animation-delay:0.3s]"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Reply Pills */}
                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 shrink-0">
                        <div className="text-[9.5px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                            <Sparkles size={11} className="text-[#00A878]" /> Suggested Actions
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto scrollbar-none">
                            {QUICK_ACTIONS.map((action, idx) => {
                                const Icon = action.icon;
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                            setInput(action.query);
                                            if (inputRef.current) inputRef.current.focus();
                                        }}
                                        disabled={isLoading}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-[#00A878] text-slate-700 hover:text-[#00A878] rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        <Icon size={13} className="text-[#00A878]" />
                                        <span>{action.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Message Input Bar */}
                    <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 shrink-0">
                        <div className="flex items-center gap-2 bg-[#FAFCFD] border border-slate-200 rounded-2xl p-1.5 focus-within:border-[#00A878] focus-within:ring-4 focus-within:ring-[#00A878]/10 focus-within:bg-white transition-all">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading}
                                placeholder="Ask about products, suppliers or orders..."
                                className="flex-1 px-3 py-2 bg-transparent text-sm font-sans font-semibold text-slate-900 placeholder:text-slate-400 outline-none border-none disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="w-10 h-10 rounded-xl bg-[#00A878] hover:bg-[#0DBB85] text-white flex items-center justify-center transition-all shadow-md shadow-[#00A878]/25 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:shadow-none shrink-0 cursor-pointer"
                                aria-label="Send Message"
                            >
                                <Send size={18} className="translate-x-0.5 -translate-y-0.5" />
                            </button>
                        </div>
                    </form>

                </div>
            )}
        </>
    );
};

export default GlobalChatbot;
