"use client";

import { getApiBaseUrl } from '@/lib/api';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { resolveProductImageUrl } from '@/lib/marketplaceData';
import { 
    ArrowLeft, 
    Send, 
    Package, 
    Search,
    Inbox,
    Clock,
    ChevronRight,
    ExternalLink,
    Check,
    CheckCheck,
    MoreVertical,
    AlertCircle,
    WifiOff,
    RefreshCw,
    MessageSquare,
    Handshake,
    Sparkles
} from 'lucide-react';

export default function ManufacturerChatThreadPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const uid = user?.id || user?._id;

    const [threads, setThreads] = useState([]);
    const [thread, setThread] = useState(null);
    const [text, setText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [threadsLoading, setThreadsLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [reconnecting, setReconnecting] = useState(false);
    const bottomRef = useRef(null);

    const loadThreads = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${getApiBaseUrl()}/api/chats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setThreads(data.data || []);
            }
        } catch (e) {
            console.error('Failed to load thread list context');
        } finally {
            setThreadsLoading(false);
        }
    }, []);

    const loadActiveThread = useCallback(async (isReconnect = false) => {
        if (!id) return;
        try {
            if (isReconnect) setReconnecting(true);
            else setLoading(true);
            setError(null);
            
            const token = localStorage.getItem('token');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const res = await fetch(`${getApiBaseUrl()}/api/chats/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            const data = await res.json();
            if (data.success && data.data) {
                setThread(data.data);
                setError(null);
                
                fetch(`${getApiBaseUrl()}/api/chats/${id}/mark-read`, {
                    method: 'PUT',
                    headers: { Authorization: `Bearer ${token}` }
                }).then(() => {
                    window.dispatchEvent(new CustomEvent('chats-read'));
                    loadThreads();
                }).catch(err => console.error(err));
            } else {
                setError(data.error || 'Could not load active conversation');
                setThread(null);
            }
        } catch (e) {
            setError(e.name === 'AbortError' ? 'Connection timed out' : 'Could not connect to chat server');
            setThread(null);
        } finally {
            setLoading(false);
            setReconnecting(false);
        }
    }, [id, loadThreads]);

    useEffect(() => {
        loadThreads();
        loadActiveThread();
    }, [loadThreads, loadActiveThread]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [thread?.messages?.length]);

    const send = async (e) => {
        if (e) e.preventDefault();
        const t = text.trim();
        if (!t || !id || sending || !thread) return;
        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${getApiBaseUrl()}/api/chats/${id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ text: t })
            });
            const data = await res.json();
            if (data.success && data.data) {
                setThread(data.data);
                setText('');
                loadThreads();
            } else {
                alert(data.error || 'Message not sent');
            }
        } catch (err) {
            alert('Failed to send message. Please check your connection.');
        } finally {
            setSending(false);
        }
    };

    const getProductImage = (item) =>
        resolveProductImageUrl(item?.product?.image || item?.product?.images?.[0]);

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

    if (loading && !thread) {
        return (
            <div className="max-w-6xl mx-auto px-4 mt-6 pb-12 font-body text-slate-800">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex h-[620px] min-h-[500px]">
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
                        <div className="relative w-12 h-12 mb-4">
                            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-slate-900 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <p className="font-body text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connecting to Chat Server...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!loading && (error || !thread)) {
        return (
            <div className="max-w-6xl mx-auto px-4 mt-6 pb-12 font-body text-slate-800">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            Message Desk
                        </h1>
                        <p className="text-xs text-slate-400 font-semibold mt-1">
                            Secure B2B trade desk for negotiating product terms.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/manufacturer/chats')}
                        className="md:hidden self-start px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-body font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all"
                    >
                        <ArrowLeft size={12} /> All Chats
                    </button>
                </div>
                
                {/* Premium Error Card */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center h-[620px] min-h-[500px] p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent pointer-events-none"></div>
                    <div className="relative z-10 max-w-md w-full bg-white rounded-[2rem] border border-red-100/50 shadow-2xl p-10">
                        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
                            {reconnecting ? <RefreshCw size={28} className="animate-spin" /> : <WifiOff size={28} className="animate-pulse" />}
                        </div>
                        <h2 className="font-heading text-2xl font-black text-slate-900 tracking-tight mb-3">
                            Unable to connect
                        </h2>
                        <p className="font-body text-slate-500 text-sm mb-8 leading-relaxed">
                            We encountered an unexpected issue while loading your conversation data. {error}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center w-full min-w-0">
                            <button 
                                onClick={() => loadActiveThread(true)}
                                disabled={reconnecting}
                                className="flex-1 min-w-0 flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-body font-bold text-[10px] uppercase tracking-wider transition-colors shadow-md disabled:opacity-50"
                            >
                                {reconnecting ? 'Reconnecting...' : 'Try Again'}
                            </button>
                            <button 
                                onClick={() => router.push('/manufacturer/dashboard')}
                                className="flex-1 min-w-0 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-body font-bold text-[10px] uppercase tracking-wider border border-slate-200 transition-colors"
                            >
                                Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const buyerId = String(thread?.buyerId?._id ?? thread?.buyerId);
    const isBuyer = uid && buyerId === String(uid);
    const peer = isBuyer ? thread?.sellerId : thread?.buyerId;
    const threadImg = getProductImage(thread);

    return (
        <div className="max-w-6xl mx-auto px-4 mt-6 pb-12 font-sans text-[#0F172A]">
            
            {/* Header section info */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="font-sans text-[30px] font-[800] text-[#0F172A] tracking-tight flex items-center gap-2">
                        Message Desk
                    </h1>
                    <p className="font-sans text-[14px] text-[#64748B] font-[500] mt-1">
                        Secure B2B trade desk for negotiating product terms and lead times.
                    </p>
                </div>
                {/* Mobile screen return CTA */}
                <button
                    onClick={() => router.push('/manufacturer/chats')}
                    className="md:hidden px-3.5 py-1.5 bg-[#F8FAFC] hover:bg-[#E5E7EB] text-[#475569] rounded-xl font-sans font-[700] text-[11px] uppercase tracking-wider flex items-center gap-1 transition-all"
                >
                    <ArrowLeft size={12} /> All Chats
                </button>
            </div>

            {/* Split-pane Main Workspace */}
            <div className="bg-[#FFFFFF] rounded-[24px] border border-[#E5E7EB] shadow-[0_8px_24px_rgba(15,23,42,0.04)] overflow-hidden flex h-[80vh] min-h-[600px] max-h-[850px]">
                
                {/* 1. LEFT SIDEBAR: THREAD LIST (Hidden on active mobile chat) */}
                <div className={`w-full md:w-[340px] lg:w-[380px] border-r border-[#E5E7EB] flex flex-col shrink-0 ${
                    id ? 'hidden md:flex' : 'flex'
                }`}>
                    
                    {/* Sidebar search bar */}
                    <div className="p-4 border-b border-slate-100 bg-white">
                        <div className="relative group">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={16} />
                            <input 
                                type="text"
                                placeholder="Search negotiations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-4 pr-11 w-full bg-slate-50 border border-slate-200 rounded-xl h-11 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Sidebar threads scrolling area */}
                    <div className="flex-1 overflow-y-auto divide-y divide-transparent p-2">
                        {filteredThreads.length === 0 ? (
                            <div className="text-center py-12 text-[#94A3B8]">
                                <Inbox className="mx-auto mb-3 text-slate-300" size={24} />
                                <span className="font-semibold text-xs">No active negotiations.</span>
                            </div>
                        ) : (
                            filteredThreads.map((t) => {
                                const bId = String(t.buyerId?._id ?? t.buyerId);
                                const isBuy = uid && bId === String(uid);
                                const p = isBuy ? t.sellerId : t.buyerId;
                                const last = t.messages?.length ? t.messages[t.messages.length - 1] : null;
                                const sideImg = getProductImage(t);
                                const isUnread = last && !last.isRead && String(last.senderId?._id || last.senderId) !== String(uid);
                                const isActive = String(t._id) === String(id);

                                return (
                                    <Link
                                        key={t._id}
                                        href={`/manufacturer/chats/${t._id}`}
                                        className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group mb-2 min-w-0 border ${
                                            isActive
                                                ? 'bg-slate-100 border-slate-200 shadow-sm ring-1 ring-slate-900/5'
                                                : isUnread 
                                                    ? 'bg-slate-50 border-l-4 border-l-slate-900 shadow-sm hover:shadow-md' 
                                                    : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-200 hover:shadow-sm'
                                        }`}
                                        style={{ minHeight: '96px' }}
                                    >
                                        {/* Peer initials badge */}
                                        <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-heading font-black text-sm flex items-center justify-center shrink-0 shadow-sm relative">
                                            {p?.name?.slice(0, 2).toUpperCase() || 'TR'}
                                            {(isActive || isUnread) && <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-[2.5px] border-white shadow-sm ${isActive ? 'bg-slate-400' : 'bg-emerald-500'}`}></span>}
                                        </div>

                                        {/* Thread Text details */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="font-heading font-bold text-slate-900 text-sm truncate group-hover:text-slate-700 transition-colors">
                                                    {p?.name || 'Enterprise Trader'}
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
                                        {sideImg ? (
                                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0 shadow-sm ml-2">
                                                <img src={sideImg} alt={t.product?.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
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

                {/* 2. RIGHT CHAT MAIN CONSOLE */}
                <div className="flex-1 flex flex-col h-full bg-[#F8FAFC]/50 relative">
                    
                    {/* Premium Header Context Card */}
                    <div className="bg-white border-b border-slate-100 p-5 lg:px-8 lg:py-6 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm shrink-0 z-10 gap-4">
                        <div className="flex items-center gap-5 min-w-0">
                            {/* Larger Premium Product Thumbnail */}
                            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl overflow-hidden border border-slate-200 shrink-0 shadow-sm bg-slate-50 flex items-center justify-center">
                                {loading ? (
                                    <div className="w-full h-full bg-slate-100 animate-pulse" />
                                ) : (
                                    threadImg ? (
                                        <img src={threadImg} alt={thread?.product?.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    ) : (
                                        <Package className="text-slate-300" size={24} />
                                    )
                                )}
                            </div>

                            <div className="min-w-0">
                                <div className="font-heading font-black text-slate-900 text-lg tracking-tight truncate flex items-center gap-2 mb-1">
                                    {thread?.product?.name || 'Wholesale Listing Negotiation'}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                    <span className="font-body font-bold text-sm text-slate-600 flex items-center gap-1.5">
                                        {peer?.name || 'Verified Partner'}
                                        <CheckCheck size={16} className="text-emerald-500" />
                                    </span>
                                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                        <span className="font-body font-bold text-xs text-emerald-600 uppercase tracking-wider">Online</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick View Product */}
                        {thread?.product?._id && (
                            <Link
                                href={`/wholesaler/marketplace/product/${thread.product._id}`}
                                className="px-6 py-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-body font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 shadow-sm outline-none focus:ring-2 focus:ring-slate-900"
                            >
                                View Listing <ExternalLink size={14} />
                            </Link>
                        )}
                    </div>

                    {/* Messages Scroll Layout */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 z-0 flex flex-col">
                        {(thread?.messages || []).length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                    <MessageSquare className="text-slate-400" size={40} />
                                </div>
                                <h3 className="font-heading text-xl font-bold text-slate-900 tracking-tight mb-3">
                                    No messages yet
                                </h3>
                                <p className="font-body text-sm text-slate-500 font-medium max-w-[320px] leading-relaxed mx-auto">
                                    Send a message below to start this conversation with the buyer.
                                </p>
                            </div>
                        ) : (
                            (thread?.messages || []).map((m, idx) => {
                                const senderId = String(m.senderId?._id ?? m.senderId);
                                const isMine = uid && senderId === String(uid);

                                return (
                                    <div 
                                        key={m._id || idx} 
                                        className={`flex flex-col ${isMine ? 'items-end self-end' : 'items-start self-start'} max-w-[85%] sm:max-w-[75%] group`}
                                    >
                                        <div className={`px-5 py-3.5 text-[14px] font-[500] leading-relaxed transition-all ${
                                            isMine 
                                                ? 'bg-gradient-to-br from-[#071A35] to-[#1e3a5f] text-[#FFFFFF] rounded-[20px] rounded-tr-[4px] shadow-[0_8px_24px_rgba(7,26,53,0.12)] border border-[#FFFFFF]/10' 
                                                : 'bg-[#FFFFFF] border border-[#E5E7EB] text-[#0F172A] rounded-[20px] rounded-tl-[4px] shadow-[0_4px_16px_rgba(15,23,42,0.06)]'
                                        }`}>
                                            {/* Show sender tag only if not mine */}
                                            {!isMine && (
                                                <div className="text-[10px] font-black uppercase tracking-widest text-[#00A878] mb-1">
                                                    {m.senderId?.name || peer?.name || 'Partner'}
                                                </div>
                                            )}
                                            <p className="whitespace-pre-line break-words">{m.text}</p>
                                        </div>

                                        {/* Timestamp metadata */}
                                        <div className="flex items-center gap-1.5 mt-2 px-1 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                                            <span className="text-[10px] font-[700] text-[#94A3B8] uppercase tracking-wider">
                                                {formatTime(m.createdAt || m.date)}
                                            </span>
                                            {isMine && (
                                                m.isRead ? (
                                                    <CheckCheck size={14} className="text-[#00A878]" />
                                                ) : (
                                                    <Check size={14} className="text-[#94A3B8]" />
                                                )
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Premium Message Composer */}
                    <div className="p-4 lg:p-6 bg-white border-t border-slate-100 shrink-0 z-10 sticky bottom-0">
                        <form 
                            onSubmit={send} 
                            className="flex items-end gap-3 max-w-5xl mx-auto w-full min-w-0 relative"
                        >
                            {/* Input container */}
                            <div className="flex-1 relative bg-slate-50 border border-slate-200 rounded-2xl flex items-center min-w-0 transition-all focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-900 focus-within:bg-white shadow-sm">
                                <input 
                                    type="text"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Type your message here..."
                                    className="flex-1 bg-transparent px-4 py-4 font-body text-sm font-medium text-slate-900 focus:outline-none placeholder:text-slate-400 min-w-0 h-[56px]"
                                    maxLength={8000}
                                />
                            </div>

                            {/* Send CTA */}
                            <button 
                                type="submit"
                                disabled={sending || !text.trim()}
                                className="w-[56px] h-[56px] rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400 transition-all shrink-0 shadow-md hover:shadow-lg hover:-translate-y-0.5 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
                            >
                                {sending ? <div className="w-5 h-5 border-[2.5px] border-slate-400 border-t-white rounded-full animate-spin"></div> : <Send size={20} className="ml-1" />}
                            </button>
                        </form>
                    </div>

                </div>

            </div>
        </div>
    );
}



