"use client";

import { getApiBaseUrl } from '@/lib/api';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

const GlobalChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Welcome to GearUp!\nI'm your virtual assistant.\nI can help you with:\n• Search wholesale products\n• Track orders\n• Payment information\n• Refunds\n• Seller payout information\n• Refund policy/procedure\n\nChoose one of the options above or type your question.",
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
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
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

    const quickQuestions = [
        'How do I find suppliers?',
        'What is the order process?',
        'Help with analytics',
        'Contact support'
    ];

    return (
        <>
            {/* Floating Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 bg-emerald-600 text-white p-4 rounded-full shadow-2xl hover:bg-emerald-700 transition-all duration-300 z-[9999] group transform scale-90 origin-bottom-right"
                    title="Chat with AI Assistant"
                >
                    <MessageCircle size={24} />
                    <div className="absolute -top-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white shadow-sm"></div>
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 z-[9999] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Bot size={22} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-heading font-bold text-sm tracking-tight">GearUp AI Assistant</h3>
                                <p className="font-body text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Always Online</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="bg-white/10 hover:bg-white/20 transition-colors p-2 rounded-lg"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 scrollbar-thin">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex gap-4 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${message.sender === 'user' ? 'bg-slate-900' : 'bg-emerald-100 text-emerald-600'
                                        }`}>
                                        {message.sender === 'user' ? (
                                            <User size={14} className="text-white" />
                                        ) : (
                                            <Bot size={14} />
                                        )}
                                    </div>
                                    <div className={`rounded-2xl p-4 shadow-sm ${message.sender === 'user'
                                        ? 'bg-slate-900 text-white rounded-tr-none'
                                        : message.isError
                                            ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none'
                                            : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                                        }`}>
                                        <p className="font-body text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                                        <p className={`font-body text-[10px] mt-2 font-medium ${message.sender === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl rounded-tl-none p-4 shadow-sm">
                                    <div className="flex gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Questions */}
                    <div className="px-6 py-4 bg-white border-t border-slate-50">
                        <div className="flex flex-wrap gap-2">
                            {quickQuestions.map((question, index) => (
                                <button
                                    key={index}
                                    onClick={() => setInput(question)}
                                    disabled={isLoading}
                                    className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-500 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm disabled:opacity-50"
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-6 border-t border-slate-100 bg-white">
                        <div className="flex gap-3">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading}
                                placeholder="Ask about sourcing..."
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 outline-none transition-all font-body text-sm text-slate-900 placeholder-slate-400 disabled:bg-neutral-50"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:bg-slate-200 disabled:shadow-none"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
};

export default GlobalChatbot;
