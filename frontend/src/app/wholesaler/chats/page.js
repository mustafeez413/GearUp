"use client";

import { getApiBaseUrl } from '@/lib/api';
import { resolveProductImageUrl } from '@/lib/marketplaceData';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
    MessageSquare, 
    Package, 
    ArrowRight, 
    Clock, 
    Search, 
    User,
    Check,
    CheckCheck,
    ChevronRight,
    Sparkles,
    Handshake,
    Inbox
} from 'lucide-react';

export default function WholesalerChatsPage() {
    const { user } = useAuth();
    const uid = user?.id || user?._id;
    const [threads, setThreads] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${getApiBaseUrl()}/api/chats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setThreads(data.data || []);
                setError(null);
            } else {
                setError(data.error || 'Could not load conversations');
            }
        } catch (e) {
            setError('Could not load conversations');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const getProductImage = (t) => resolveProductImageUrl(t.product?.image || t.product?.images?.[0]);

    const formatTime = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const filteredThreads = threads.filter(t => {
        const buyerId = String(t.buyerId?._id ?? t.buyerId);
        const isBuyer = uid && buyerId === String(uid);
        const peer = isBuyer ? t.sellerId : t.buyerId;
        const peerName = (peer?.name || '').toLowerCase();
        const productName = (t.product?.name || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return peerName.includes(query) || productName.includes(query);
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="flex flex-col items-center">
                    <div className="relative w-12 h-12">
                        <div className="absolute inset-0 border-4 border-[#E5E7EB] rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-slate-900 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="mt-4 font-sans text-[11px] font-[700] text-[#94A3B8] uppercase tracking-widest">Loading Chats...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 mt-6 pb-12 font-sans text-[#0F172A]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="font-heading text-3xl font-black text-[#0F172A] tracking-tight">Marketplace Chats</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1 max-w-xl leading-relaxed">
                        Secure direct wholesale messaging and bulk deal settlement hub.
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-2xl border border-red-150 bg-red-50 px-6 py-4 text-red-700 font-sans text-[12px] font-[700] shadow-[0_2px_8px_rgba(239,68,68,0.1)]">
                    {error}
                </div>
            )}

            {/* Split Pane Chat Container */}
            <div className="bg-[#FFFFFF] rounded-[24px] border border-[#E5E7EB] shadow-[0_8px_24px_rgba(15,23,42,0.04)] overflow-hidden flex h-[80vh] min-h-[600px] max-h-[850px]">
                
                {/* 1. LEFT PANE: THREAD LIST */}
                <div className="w-full md:w-[340px] lg:w-[380px] border-r border-[#E5E7EB] flex flex-col shrink-0">
                    
                    {/* Thread Search Box */}
                    <div className="p-4 border-b border-slate-100 bg-white">
                        <div className="relative group">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={16} />
                            <input 
                                type="text"
                                placeholder="Search negotiations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-4 pr-11 w-full bg-slate-50 border border-slate-200 rounded-xl h-12 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Thread List Scrollable Area */}
                    <div className="flex-1 overflow-y-auto divide-y divide-transparent p-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent hover:scrollbar-thumb-slate-300">
                        {filteredThreads.length === 0 ? (
                            <div className="text-center py-12 text-[#94A3B8]">
                                <Inbox className="mx-auto mb-3 text-slate-300" size={24} />
                                <span className="font-semibold text-xs">No active negotiations found.</span>
                            </div>
                        ) : (
                            filteredThreads.map((t) => {
                                const buyerId = String(t.buyerId?._id ?? t.buyerId);
                                const isBuyer = uid && buyerId === String(uid);
                                const peer = isBuyer ? t.sellerId : t.buyerId;
                                const last = t.messages?.length ? t.messages[t.messages.length - 1] : null;
                                const img = getProductImage(t);
                                const isUnread = last && !last.isRead && String(last.senderId?._id || last.senderId) !== String(uid);

                                return (
                                    <Link
                                        key={t._id}
                                        href={`/wholesaler/chats/${t._id}`}
                                        className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group mb-2 min-w-0 border ${
                                            isUnread 
                                                ? 'bg-slate-50 border-l-4 border-l-slate-900 shadow-sm hover:shadow-md' 
                                                : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-200 hover:shadow-sm'
                                        }`}
                                        style={{ minHeight: '96px' }}
                                    >
                                        {/* Peer initials badge */}
                                        <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-heading font-black text-sm flex items-center justify-center shrink-0 shadow-sm relative">
                                            {peer?.name?.slice(0, 2).toUpperCase() || 'TR'}
                                            {isUnread && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[2.5px] border-white shadow-sm"></span>}
                                        </div>

                                        {/* Thread Text details */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="font-heading font-bold text-slate-900 text-sm truncate group-hover:text-slate-700 transition-colors">
                                                    {peer?.name || 'Enterprise Trader'}
                                                </span>
                                                {last && (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0 whitespace-nowrap">
                                                        {formatTime(last.createdAt)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="font-body font-semibold text-slate-700 text-xs truncate mb-1.5">
                                                {t.product?.name || 'Product negotiation'}
                                            </div>
                                            {last && (
                                                <p className={`text-xs truncate ${isUnread ? 'font-black text-slate-900' : 'text-slate-500 font-medium'}`}>
                                                    {last.text}
                                                </p>
                                            )}
                                        </div>

                                        {/* Product thumbnail */}
                                        {img ? (
                                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0 shadow-sm ml-2">
                                                <img src={img} alt={t.product?.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shrink-0 shadow-sm ml-2">
                                                <Package className="text-slate-300" size={16} />
                                            </div>
                                        )}
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 2. RIGHT PANE: CHAT EMPTY STATE */}
                <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-slate-50/50 z-0 relative min-w-0 w-full">
                    <div className="flex-1 flex flex-col items-center justify-center animate-fadeIn w-full">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-5 border border-slate-100 shadow-sm">
                            <MessageSquare className="text-slate-300" size={32} />
                        </div>
                        <h3 className="font-heading text-lg font-bold text-slate-800 tracking-tight mb-2">
                            Select a conversation
                        </h3>
                        <p className="font-body text-sm text-slate-500 font-medium max-w-[320px] leading-relaxed mx-auto">
                            Choose a conversation from the left panel to view messages.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}



