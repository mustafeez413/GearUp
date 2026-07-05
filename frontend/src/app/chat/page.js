"use client";

import { getApiBaseUrl } from '@/lib/api';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ShieldCheck, Zap, Sparkles } from 'lucide-react';

const AIChatPage = () => {
    const [messages, setMessages] = useState([
        { id: 1, text: 'Neural link established. I am your GearUp Strategic Assistant. How can I optimize your operations today?', sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await fetch(`${getApiBaseUrl()}/api/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ message: input }),
            });

            const data = await response.json();

            if (data.success) {
                const botMessage = {
                    id: Date.now() + 1,
                    text: data.data.reply,
                    sender: 'bot'
                };
                setMessages(prev => [...prev, botMessage]);
            } else {
                throw new Error(data.error || 'Failed to get AI response');
            }
        } catch (error) {
            console.error('Chat Error:', error);
            const errorMessage = {
                id: Date.now() + 1,
                text: "Communication Contact unstable. System recalibrating... Please re-transmit your query.",
                sender: 'bot',
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pt-32 pb-20 px-4">
            <div className="max-w-5xl mx-auto flex flex-col items-center">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full text-emerald-600 font-body font-black text-[10px] uppercase tracking-widest mb-4">
                        <Sparkles size={14} /> AI Core Powered
                    </div>
                    <h1 className="font-heading text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-4">
                        Strategic Assistant
                    </h1>
                    <p className="font-body text-slate-500 font-medium text-lg tracking-tight max-w-2xl">
                        A real-time neural hub for market insights, supplier audits, and procurement logistics.
                    </p>
                </div>

                <div className="w-full bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col h-[700px] overflow-hidden relative">
                    {/* Header */}
                    <div className="p-8 bg-slate-900 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 animate-pulse">
                                <Bot size={24} />
                            </div>
                            <div>
                                <h3 className="font-heading text-xl font-black text-white uppercase italic tracking-tighter">GearUp Core</h3>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                                    <p className="font-body text-[10px] uppercase tracking-widest text-emerald-400 font-black">Active Contact</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="px-4 py-2 bg-white/5 rounded-xl font-body text-[10px] font-black uppercase tracking-widest text-white/50 border border-white/10">
                                256-bit AES
                            </div>
                        </div>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/30">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex gap-4 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${message.sender === 'user' ? 'bg-slate-900' : 'bg-white border border-slate-100'
                                        }`}>
                                        {message.sender === 'user' ? (
                                            <User className="text-white" size={20} />
                                        ) : (
                                            <Bot className="text-emerald-600" size={20} />
                                        )}
                                    </div>
                                    <div className={`rounded-[2rem] p-6 shadow-xl shadow-slate-200/20 ${message.sender === 'user'
                                        ? 'bg-slate-900 text-white rounded-tr-none'
                                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                        } ${message.isError ? 'border-red-500 bg-red-50 text-red-900' : ''}`}>
                                        <p className="font-body text-sm font-medium leading-relaxed">{message.text}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="flex gap-4 max-w-[80%]">
                                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-lg">
                                        <Bot className="text-emerald-600" size={20} />
                                    </div>
                                    <div className="bg-white rounded-[2rem] rounded-tl-none p-6 border border-slate-100 shadow-xl shadow-slate-200/20 flex gap-2">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-8 bg-white border-t border-slate-100">
                        <form onSubmit={handleSend} className="relative group">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Query the matrix (e.g., 'Find cricket suppliers in Sialkot')"
                                className="w-full pl-8 pr-32 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-500 transition-all font-body text-slate-900 font-bold placeholder-slate-400"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-body font-black text-[10px] uppercase tracking-widest italic hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-xl shadow-emerald-500/20"
                            >
                                <Send size={14} /> Send query
                            </button>
                        </form>
                        <div className="mt-4 flex gap-4 justify-center">
                            <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                                <Zap size={10} /> Market Trends
                            </button>
                            <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                                <ShieldCheck size={10} /> Verification Registry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIChatPage;
