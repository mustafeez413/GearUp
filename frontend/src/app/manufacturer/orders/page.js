"use client";

import { getApiBaseUrl } from '@/lib/api';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import InvoiceModal from '@/components/shared/InvoiceModal';
import Card from '@/components/common/Card';
import Skeleton from '@/components/common/Skeleton';
import Badge from '@/components/common/Badge';
import PageShell from '@/components/dashboard/PageShell';
import PageHeader from '@/components/dashboard/PageHeader';
import StatCard from '@/components/dashboard/StatCard';
import { formatPKR, countSellerRefunds, getUserFinancialMetrics } from '@/lib/financeUtils';
import { isSellerOnOrder, resolveUserId } from '@/lib/dashboardAnalytics';
import { useRefundRecords } from '@/hooks/useRefundRecords';
import { subscribeFinancialSync } from '@/lib/financialSync';
import { getAuthHeaders } from '@/lib/authToken';
import useReadOnlyMode from '@/hooks/useReadOnlyMode';
import {
    Clock,
    AlertCircle,
    Search,
    Filter,
    ArrowRight,
    CheckCircle2,
    Package,
    Truck,
    CheckCircle,
    MoreVertical,
    Banknote,
    TrendingUp,
    Download,
    Inbox,
    RefreshCw,
    Activity,
    FileText,
    Calendar,
    User,
    MapPin
} from 'lucide-react';

const ManufacturerOrdersPage = () => {
    const { user } = useAuth();
    const { isReadOnlyMode, guardAction } = useReadOnlyMode();
    const [filter, setFilter] = useState('all');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
    
    // Custom filtering/sorting states
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const { refundRecords } = useRefundRecords();

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${getApiBaseUrl()}/api/orders`, {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (data.success) {
                setOrders(data.data);
            } else {
                setError(data.error);
                if (response.status === 401) {
                    setError('Your session has expired. Please sign out and log in again.');
                }
            }
        } catch (err) {
            setError('Communication loss with order terminal.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        return subscribeFinancialSync(() => {
            fetchOrders();
        });
    }, [fetchOrders]);

    const userId = resolveUserId(user);

    const handleStatusUpdate = async (orderId, newStatus) => {
        if (!guardAction()) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${getApiBaseUrl()}/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await response.json();
            if (data.success && data.data) {
                const updatedOrder = data.data;
                setOrders(prev => prev.map(o => {
                    if (o._id === orderId) {
                        return { 
                            ...o, 
                            status: updatedOrder.status || 'Processing', 
                            paymentStatus: updatedOrder.paymentStatus || o.paymentStatus,
                            isPaymentVerified: updatedOrder.isPaymentVerified !== undefined ? updatedOrder.isPaymentVerified : o.isPaymentVerified,
                            sellerStats: updatedOrder.sellerStats || o.sellerStats 
                        };
                    }
                    return o;
                }));
            } else {
                alert(data.error || 'Protocol update failed.');
            }
        } catch (err) {
            alert('Network instability detected.');
        }
    };

    const salesOrders = orders.filter((order) => isSellerOnOrder(order, userId));
    // Calculate dynamic stats
    const totalOrders = salesOrders.length;
    const pendingOrders = salesOrders.filter(o => {
        const s = o.sellerStats?.find(stat => (stat.seller?._id || stat.seller) === (user?.id || user?._id));
        return (s?.status || o.status).toLowerCase().startsWith('pending');
    }).length;
    const processingOrders = salesOrders.filter(o => {
        const s = o.sellerStats?.find(stat => (stat.seller?._id || stat.seller) === (user?.id || user?._id));
        return (s?.status || o.status).toLowerCase() === 'processing';
    }).length;
    const deliveredOrders = salesOrders.filter(o => {
        const s = o.sellerStats?.find(stat => (stat.seller?._id || stat.seller) === (user?.id || user?._id));
        const status = (s?.status || o.status).toLowerCase();
        return status === 'delivered' || status === 'completed';
    }).length;
    const { totalRevenue, sellerRefundsCount } = useMemo(() => {
        const refundsCount = countSellerRefunds(refundRecords, userId, null);
        
        const revenue = salesOrders.reduce((sum, order) => {
            const myStats = order.sellerStats?.find(s => (s.seller?._id || s.seller) === (user?.id || user?._id));
            const myItems = order.items?.filter(i => (i.seller?._id || i.seller) === (user?.id || user?._id)) || [];
            const myStatus = (myStats?.status || order.status || '').toLowerCase();
            
            const isPayRefunded = (order.paymentStatus || '').toLowerCase() === 'refunded';
            const isRefundRecord = refundRecords?.some(r => {
                const rId = (r.order?._id || r.order?.id || r.order)?.toString();
                const oId = (order?._id || order?.id)?.toString();
                return rId && oId && rId === oId;
            });
            const isRefunded = isPayRefunded || isRefundRecord;

            if (!isRefunded && (myStatus === 'delivered' || myStatus === 'completed')) {
                const amount = myStats?.subtotal || myItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                return sum + amount;
            }
            return sum;
        }, 0);

        return { totalRevenue: revenue, sellerRefundsCount: refundsCount };
    }, [salesOrders, refundRecords, user]);

    // Dynamic count per status tab
    const getCountForStatus = (status) => {
        if (status === 'all') return salesOrders.length;
        if (status === 'refunded') return sellerRefundsCount;
        return salesOrders.filter(o => {
            const s = o.sellerStats?.find(stat => (stat.seller?._id || stat.seller) === (user?.id || user?._id));
            const currentStatus = (s?.status || o.status).toLowerCase();
            if (status === 'delivered') {
                return currentStatus === 'delivered' || currentStatus === 'completed';
            }
            if (status === 'pending') {
                return currentStatus.startsWith('pending');
            }
            return currentStatus === status;
        }).length;
    };

    // Filtered and sorted orders array
    const filteredOrders = salesOrders.filter(order => {
        const myStats = order.sellerStats?.find(s => (s.seller?._id || s.seller) === (user?.id || user?._id));
        const myItems = order.items?.filter(i => (i.seller?._id || i.seller) === (user?.id || user?._id)) || [];
        const myStatus = (myStats?.status || order.status).toLowerCase();
        
        // Tab status filter
        if (filter !== 'all') {
            if (filter === 'delivered') {
                if (myStatus !== 'delivered' && myStatus !== 'completed') return false;
            } else if (filter === 'pending') {
                if (!myStatus.startsWith('pending')) return false;
            } else if (filter === 'refunded') {
                const isPayRefunded = (order.paymentStatus || '').toLowerCase() === 'refunded';
                const hasRefund = isPayRefunded || refundRecords?.some(r => {
                    const rId = (r.order?._id || r.order?.id || r.order)?.toString();
                    const oId = (order?._id || order?.id)?.toString();
                    return rId && oId && rId === oId;
                });
                if (!hasRefund) return false;
            } else if (myStatus !== filter) {
                return false;
            }
        }

        // Payment status filter
        if (paymentStatusFilter !== 'all') {
            const payStatus = (order.paymentStatus || '').toLowerCase();
            if (paymentStatusFilter === 'verified' && !payStatus.includes('verified')) return false;
            if (paymentStatusFilter === 'pending' && !payStatus.includes('pending')) return false;
            if (paymentStatusFilter === 'rejected' && !payStatus.includes('rejected')) return false;
        }

        // Search query filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const orderIdMatches = order._id.toLowerCase().includes(query);
            const buyerMatches = (order.buyer?.name || '').toLowerCase().includes(query);
            const productMatches = myItems.some(i => (i.name || '').toLowerCase().includes(query));
            if (!orderIdMatches && !buyerMatches && !productMatches) return false;
        }

        return true;
    }).sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        
        const getSubtotal = (order) => {
            const s = order.sellerStats?.find(stat => (stat.seller?._id || stat.seller) === (user?.id || user?._id));
            const myItems = order.items?.filter(i => (i.seller?._id || i.seller) === (user?.id || user?._id)) || [];
            return s?.subtotal || myItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        };
        
        if (sortBy === 'amount-high') return getSubtotal(b) - getSubtotal(a);
        if (sortBy === 'amount-low') return getSubtotal(a) - getSubtotal(b);
        return 0;
    });

    const getStatusConfig = (status) => {
        const configs = {
            pending: { color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Clock },
            pending_approval: { color: 'text-blue-600 bg-blue-50 border-blue-100', icon: Clock },
            'pending approval': { color: 'text-blue-600 bg-blue-50 border-blue-100', icon: Clock },
            verified: { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle },
            'payment verified': { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle },
            processing: { color: 'text-orange-600 bg-orange-50 border-orange-100', icon: RefreshCw },
            shipped: { color: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: Truck },
            delivered: { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle },
            completed: { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle2 },
            cancelled: { color: 'text-red-600 bg-red-50 border-red-100', icon: AlertCircle },
            returned: { color: 'text-red-600 bg-red-50 border-red-100', icon: AlertCircle }
        };
        const s = (status || '').toLowerCase();
        return configs[s] || { color: 'text-slate-600 bg-slate-50 border-slate-100', icon: Clock };
    };

    const getPaymentStatusConfig = (paymentStatus) => {
        const status = (paymentStatus || '').toLowerCase();
        if (status.includes('verified')) {
            return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        }
        if (status.includes('pending')) {
            return 'text-amber-600 bg-amber-50 border-amber-100';
        }
        if (status.includes('rejected')) {
            return 'text-red-600 bg-red-50 border-red-100';
        }
        return 'text-slate-600 bg-slate-50 border-slate-100';
    };

    // Client-side CSV export of filtered sales orders
    const exportCSV = () => {
        const headers = ['Order ID', 'Buyer Name', 'Product(s)', 'Units', 'Revenue (PKR)', 'Order Status', 'Payment Status', 'Order Date'];
        const rows = filteredOrders.map(order => {
            const myStats = order.sellerStats?.find(s => (s.seller?._id || s.seller) === (user?.id || user?._id));
            const myItems = order.items?.filter(i => (i.seller?._id || i.seller) === (user?.id || user?._id)) || [];
            const revenue = myStats?.subtotal || myItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const products = myItems.map(i => i.name).join('; ');
            const units = myItems.reduce((acc, i) => acc + i.quantity, 0);
            return [
                order._id,
                order.buyer?.name || 'N/A',
                products,
                units,
                revenue,
                myStats?.status || order.status,
                order.paymentStatus,
                new Date(order.createdAt).toLocaleDateString()
            ];
        });
        const csvContent = [headers, ...rows].map(e => e.map(val => `"${val}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `sales_orders_report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading && orders.length === 0) {
        return (
            <div className="space-y-6 w-full animate-in fade-in duration-300">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="font-heading text-3xl font-black text-[#0F172A] tracking-tight">Sales Orders</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1 max-w-xl leading-relaxed">
                            Manage and track your inbound sales orders in real time.
                        </p>
                    </div>
                </div>

                {/* Skeletons stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} variant="stat" />
                    ))}
                </div>

                {/* Main Content Skeletons */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
                    <div className="xl:col-span-3 space-y-6">
                        <Skeleton variant="table" rows={6} />
                    </div>
                    <div className="space-y-6">
                        <Skeleton variant="card" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="font-heading text-3xl font-black text-[#0F172A] tracking-tight">Sales Orders</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1 max-w-xl leading-relaxed">
                        Manage and track your inbound sales orders in real time.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 bg-[#00A878] hover:bg-[#0DBB85] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-[0_4px_12px_-4px_rgba(0,200,117,0.4)] hover:shadow-[0_8px_16px_-6px_rgba(0,200,117,0.5)] hover:-translate-y-0.5 outline-none"
                        title="Export current view to CSV"
                    >
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Error handling */}
            {error && (
                <div className="p-4 bg-[#FEF2F2] border border-[#EF4444]/20 rounded-[14px] flex items-center gap-3 text-[#EF4444]">
                    <AlertCircle size={18} />
                    <p className="font-sans text-[13px] font-[600]">{error}</p>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-5">
                {[
                    { label: "Total Orders", value: totalOrders, icon: Package, color: "text-[#0F172A]", bg: "bg-[#F8FAFC]", topColor: "accent-slate" },
                    { label: "Pending", value: pendingOrders, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", topColor: "accent-amber" },
                    { label: "Processing", value: processingOrders, icon: RefreshCw, color: "text-blue-600", bg: "bg-blue-50", topColor: "accent-blue" },
                    { label: "Delivered", value: deliveredOrders, icon: CheckCircle, color: "text-[#00A878]", bg: "bg-[#E8FFF5]", topColor: "accent-green" },
                    { label: "Refund Orders", value: sellerRefundsCount, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", topColor: "accent-red" },
                    { label: "Revenue", value: formatPKR(totalRevenue), icon: Banknote, color: "text-[#0F172A]", bg: "bg-[#F8FAFC]", topColor: "accent-slate" },
                ].map((stat, idx) => (
                    <div key={idx} className={`kpi-card-enterprise ${stat.topColor} flex flex-col`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-2.5 rounded-[12px] ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                                <stat.icon size={18} className="stroke-[2.5]" />
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] font-[700] text-[#64748B] uppercase tracking-widest mb-1.5">{stat.label}</div>
                            <div className="font-sans text-[24px] font-[800] text-[#0F172A]">{loading ? '-' : stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Layout Grid */}
            <div className="flex flex-col gap-8 items-start w-full">
                
                {/* Full Width: Search, Filters, Status Tabs, and Orders List/Table */}
                <div className="flex flex-col gap-6 min-w-0 w-full">
                    
                    {/* Control Panel: Search & Advanced Filters */}
                    <div className="filter-bar-enterprise space-y-5">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            {/* Search */}
                            <div className="relative w-full md:flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search order ID, buyer, or product..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="search-enterprise"
                                />
                            </div>

                            {/* Dropdowns */}
                            <div className="flex gap-4 w-full md:w-auto">
                                {/* Payment Status Dropdown */}
                                <div className="flex items-center bg-[#FFFFFF] border border-[#CBD5E1] rounded-[14px] h-[52px] px-4 flex-1 md:flex-initial hover:border-[#94A3B8] transition-colors focus-within:border-[#00A878] focus-within:ring-[4px] focus-within:ring-[#00A878]/10">
                                    <span className="text-[11px] font-[700] text-[#64748B] uppercase tracking-widest mr-3">Payment</span>
                                    <select
                                        value={paymentStatusFilter}
                                        onChange={(e) => setPaymentStatusFilter(e.target.value)}
                                        className="bg-transparent text-[#0F172A] font-sans text-[14px] font-[600] outline-none cursor-pointer w-full appearance-none"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="verified">Verified</option>
                                        <option value="pending">Pending</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>

                                {/* Sort Dropdown */}
                                <div className="flex items-center bg-[#FFFFFF] border border-[#CBD5E1] rounded-[14px] h-[52px] px-4 flex-1 md:flex-initial hover:border-[#94A3B8] transition-colors focus-within:border-[#00A878] focus-within:ring-[4px] focus-within:ring-[#00A878]/10">
                                    <span className="text-[11px] font-[700] text-[#64748B] uppercase tracking-widest mr-3">Sort</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="bg-transparent text-[#0F172A] font-sans text-[14px] font-[600] outline-none cursor-pointer w-full appearance-none"
                                    >
                                        <option value="newest">Latest</option>
                                        <option value="oldest">Oldest</option>
                                        <option value="amount-high">Amount: High</option>
                                        <option value="amount-low">Amount: Low</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Professional Tabs Row */}
                        <div className="flex items-center gap-2 overflow-x-auto border-t border-[#F1F5F9] pt-5 scrollbar-none pb-1">
                            {['all', 'pending', 'processing', 'shipped', 'delivered', 'refunded'].map((status) => {
                                const count = getCountForStatus(status);
                                const isActive = filter === status;
                                return (
                                    <button
                                        key={status}
                                        onClick={() => setFilter(status)}
                                        className={`status-tab ${isActive ? 'active' : ''}`}
                                    >
                                        <span className="capitalize">{status}</span>
                                        <span className={`px-2 py-0.5 rounded-[8px] text-[11px] font-[700] leading-none ${
                                            isActive ? 'bg-white/20 text-white' : 'bg-[#E2E8F0] text-[#64748B]'
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Table View for Desktop / List Cards View for Mobile */}
                    <div className="space-y-4">
                        {filteredOrders.length > 0 ? (
                            <>
                                {/* Desktop Table */}
                                <div className="desktop-only table-enterprise">
                                    <div className="w-full overflow-x-auto scrollbar-enterprise">
                                        <table className="min-w-[1000px]">
                                            <thead>
                                                <tr>
                                                    <th>Order ID</th>
                                                    <th>Buyer</th>
                                                    <th className="min-w-[200px]">Product Details</th>
                                                    <th>Qty</th>
                                                    <th>Subtotal</th>
                                                    <th>Payment</th>
                                                    <th>Delivery</th>
                                                    <th className="text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#F1F5F9]">
                                                {filteredOrders.map((order) => {
                                                    const myStats = order.sellerStats?.find(s => (s.seller?._id || s.seller) === (user?.id || user?._id));
                                                    const myItems = order.items?.filter(i => (i.seller?._id || i.seller) === (user?.id || user?._id)) || [];
                                                    let myStatus = myStats?.status || order.status;
                                                    
                                                    const isPayRefunded = (order.paymentStatus || '').toLowerCase() === 'refunded';
                                                    const isRefunded = isPayRefunded || refundRecords?.some(r => {
                                                        const rId = (r.order?._id || r.order?.id || r.order)?.toString();
                                                        const oId = (order?._id || order?.id)?.toString();
                                                        return rId && oId && rId === oId;
                                                    });
                                                    
                                                    if (isRefunded && (myStatus.toLowerCase() === 'delivered' || myStatus.toLowerCase() === 'completed')) {
                                                        myStatus = 'Returned';
                                                    }

                                                    const config = getStatusConfig(myStatus.toLowerCase());
                                                    
                                                    // Payment Badges
                                                    const payStat = (order.paymentStatus || '').toLowerCase();
                                                    let payBadge = 'text-slate-600 bg-slate-50 border-slate-100';
                                                    if (payStat.includes('verified')) payBadge = 'text-[#00A878] bg-[#E8FFF5] border-[#00A878]/20';
                                                    else if (payStat.includes('pending')) payBadge = 'text-amber-600 bg-amber-50 border-amber-200';
                                                    else if (payStat.includes('rejected')) payBadge = 'text-red-600 bg-red-50 border-red-200';

                                                    const StatusIcon = config.icon;
                                                    const formattedDate = new Date(order.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});

                                                    return (
                                                        <tr key={order._id} className="h-[72px] hover:bg-[#F8FFFB] transition-all duration-200 group">
                                                            {/* ID */}
                                                            <td className="px-6 py-4 whitespace-nowrap align-middle">
                                                                <div className={`font-sans font-[800] text-[14px] ${config.color.split(' ')[0]} group-hover:text-[#00A878] transition-colors`}>
                                                                    #{order._id.slice(-8).toUpperCase()}
                                                                </div>
                                                                <div className="font-mono text-[11px] text-[#94A3B8] font-[500] mt-1">
                                                                    {formattedDate}
                                                                </div>
                                                            </td>

                                                            {/* Buyer */}
                                                            <td className="px-6 py-4 align-middle">
                                                                <div className="font-sans text-[14px] font-[600] text-[#0F172A] line-clamp-1 max-w-[150px]" title={order.buyer?.name}>
                                                                    {order.buyer?.name || 'N/A'}
                                                                </div>
                                                                 <div className="flex items-center gap-1 mt-1 text-[#94A3B8] font-sans text-[11px] font-[500]">
                                                                     <MapPin size={12} className="shrink-0 text-[#CBD5E1]" />
                                                                     <span className="truncate max-w-[130px]">{order.shippingAddress?.city || 'N/A'}</span>
                                                                 </div>
                                                            </td>

                                                            {/* Product name & count */}
                                                            <td className="px-6 py-4 align-middle">
                                                                <div className="font-sans text-[14px] font-[700] text-[#0F172A] line-clamp-1 max-w-[240px] leading-snug" title={myItems[0]?.name}>
                                                                    {myItems[0]?.name || 'Bulk Order'}
                                                                </div>
                                                                {myItems.length > 1 && (
                                                                    <div className="font-sans text-[11px] text-[#00A878] font-[700] uppercase tracking-widest mt-1">
                                                                        +{myItems.length - 1} items
                                                                    </div>
                                                                )}
                                                            </td>

                                                            {/* Quantity */}
                                                            <td className="px-6 py-4 align-middle font-sans text-[14px] font-[600] text-[#334155] whitespace-nowrap">
                                                                {myItems.reduce((acc, i) => acc + i.quantity, 0)} units
                                                            </td>

                                                            {/* Amount */}
                                                            <td className="px-6 py-4 align-middle font-sans text-[15px] font-[700] text-[#0F172A] whitespace-nowrap">
                                                                {formatPKR(myStats?.subtotal || myItems.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                                                            </td>

                                                            {/* Payment Status */}
                                                            <td>
                                                                <div className={`badge-enterprise inline-flex ${payStat.includes('verified') ? 'success' : payStat.includes('rejected') ? 'danger' : 'warning'}`}>
                                                                    {order.paymentStatus || 'Pending'}
                                                                </div>
                                                            </td>

                                                            {/* Status Badge */}
                                                            <td>
                                                                <div className={`badge-enterprise inline-flex items-center gap-1.5 ${myStatus.toLowerCase() === 'delivered' || myStatus.toLowerCase() === 'completed' ? 'success' : myStatus.toLowerCase() === 'cancelled' || myStatus.toLowerCase() === 'returned' ? 'danger' : myStatus.toLowerCase() === 'shipped' ? 'info' : 'warning'}`}>
                                                                    <StatusIcon size={12} strokeWidth={3} />
                                                                    {myStatus}
                                                                </div>
                                                            </td>

                                                            {/* Action buttons */}
                                                            <td className="px-6 py-4 align-middle whitespace-nowrap text-right">
                                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                                    {!isReadOnlyMode && myStatus.toLowerCase() === 'pending' && !['pending_approval', 'pending approval'].includes(order.paymentStatus?.toLowerCase()) && (
                                                                        <button
                                                                            onClick={() => handleStatusUpdate(order._id, 'processing')}
                                                                            className="h-10 w-10 flex items-center justify-center bg-[#E8FFF5] border border-[#00A878]/20 hover:bg-[#00A878] text-[#00A878] hover:text-white rounded-[10px] transition-all cursor-pointer hover:-translate-y-0.5"
                                                                            title="Accept Order"
                                                                        >
                                                                            <CheckCircle size={18} />
                                                                        </button>
                                                                    )}
                                                                    {!isReadOnlyMode && myStatus.toLowerCase() === 'processing' && (
                                                                        <button
                                                                            onClick={() => handleStatusUpdate(order._id, 'shipped')}
                                                                            className="h-10 w-10 flex items-center justify-center bg-blue-50 border border-blue-200 hover:bg-blue-600 text-blue-600 hover:text-white rounded-[10px] transition-all cursor-pointer hover:-translate-y-0.5"
                                                                            title="Mark Shipped"
                                                                        >
                                                                            <Truck size={18} />
                                                                        </button>
                                                                    )}
                                                                    {!isReadOnlyMode && myStatus.toLowerCase() === 'shipped' && (
                                                                        <button
                                                                            onClick={() => handleStatusUpdate(order._id, 'delivered')}
                                                                            className="h-10 w-10 flex items-center justify-center bg-[#E8FFF5] border border-[#00A878]/20 hover:bg-[#00A878] text-[#00A878] hover:text-white rounded-[10px] transition-all cursor-pointer hover:-translate-y-0.5"
                                                                            title="Mark Delivered"
                                                                        >
                                                                            <CheckCircle2 size={18} />
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setSelectedInvoiceOrder(order)}
                                                                        className="h-10 w-10 flex items-center justify-center bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] rounded-[10px] transition-all cursor-pointer hover:-translate-y-0.5"
                                                                        title="View Invoice"
                                                                    >
                                                                        <FileText size={18} />
                                                                    </button>
                                                                    <Link
                                                                        href={`/manufacturer/orders/${order._id}`}
                                                                        className="h-10 w-10 flex items-center justify-center bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] rounded-[10px] transition-all hover:-translate-y-0.5"
                                                                        title="Inspect Details"
                                                                    >
                                                                        <ArrowRight size={18} />
                                                                    </Link>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Mobile Cards (Visible only on < 768px) */}
                                <div className="mobile-only grid grid-cols-1 gap-4">
                                    {filteredOrders.map((order) => {
                                        const myStats = order.sellerStats?.find(s => (s.seller?._id || s.seller) === (user?.id || user?._id));
                                        const myItems = order.items?.filter(i => (i.seller?._id || i.seller) === (user?.id || user?._id)) || [];
                                        const myStatus = myStats?.status || order.status;
                                        const config = getStatusConfig(myStatus.toLowerCase());
                                        const payConfig = getPaymentStatusConfig(order.paymentStatus);
                                        const formattedDate = new Date(order.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});

                                        return (
                                            <div key={order._id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow transition-all space-y-4">
                                                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                                    <div>
                                                        <div className="font-heading font-black text-sm text-slate-900">
                                                            #{order._id.slice(-8).toUpperCase()}
                                                        </div>
                                                        <div className="font-body text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                                            {formattedDate}
                                                        </div>
                                                    </div>
                                                    <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${config.color}`}>
                                                        {myStatus}
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="font-body text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Buyer</div>
                                                        <div className="font-body text-xs font-bold text-slate-800">{order.buyer?.name || 'N/A'}</div>
                                                    </div>

                                                    <div>
                                                        <div className="font-body text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Products</div>
                                                        <div className="font-body text-xs font-bold text-slate-800">
                                                            {myItems[0]?.name || 'Bulk Order'}
                                                            {myItems.length > 1 && <span className="text-emerald-600 ml-1.5">+{myItems.length - 1} items</span>}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 pt-1">
                                                        <div>
                                                            <div className="font-body text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Subtotal</div>
                                                            <div className="font-heading text-xs font-black text-slate-900">
                                                                {formatPKR(myStats?.subtotal || myItems.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="font-body text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Payment</div>
                                                            <div className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border inline-block ${payConfig}`}>
                                                                {order.paymentStatus || 'Pending'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-3 border-t border-slate-50">
                                                    <Link
                                                        href={`/manufacturer/orders/${order._id}`}
                                                        className="flex-1 text-center py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-body font-bold text-xs uppercase tracking-widest transition-all"
                                                    >
                                                        Details
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedInvoiceOrder(order)}
                                                        className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-body font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
                                                    >
                                                        Invoice
                                                    </button>

                                                    {!isReadOnlyMode && myStatus.toLowerCase() === 'pending' && !['pending_approval', 'pending approval'].includes(order.paymentStatus?.toLowerCase()) && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(order._id, 'processing')}
                                                            className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-body font-black text-xs uppercase tracking-widest transition-all border border-emerald-100 cursor-pointer"
                                                        >
                                                            Accept
                                                        </button>
                                                    )}
                                                    {!isReadOnlyMode && myStatus.toLowerCase() === 'processing' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(order._id, 'shipped')}
                                                            className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-body font-black text-xs uppercase tracking-widest transition-all border border-blue-100 cursor-pointer"
                                                        >
                                                            Mark shipped
                                                        </button>
                                                    )}
                                                    {!isReadOnlyMode && myStatus.toLowerCase() === 'shipped' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(order._id, 'delivered')}
                                                            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-body font-black text-xs uppercase tracking-widest transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
                                                        >
                                                            Mark delivered
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            /* Empty State Redesign */
                            <div className="text-center py-24 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col items-center">
                                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mb-5 border border-slate-100 shadow-inner">
                                    <Inbox size={28} />
                                </div>
                                <h3 className="font-heading text-xl font-black text-slate-800 uppercase tracking-tight mb-2">
                                    No orders found
                                </h3>
                                <p className="font-body text-slate-400 text-sm font-semibold max-w-[420px] mb-6 leading-relaxed">
                                    Wholesale orders from buyers will appear here. Manage inventory details to capture inbound wholesale orders.
                                </p>
                                <Link
                                    href="/manufacturer/products"
                                    className="px-5 py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-body font-bold text-xs uppercase tracking-widest shadow-md transition-all duration-200"
                                >
                                    Manage Products Catalog
                                </Link>
                            </div>
                        )}
                    </div>
                </div>



            </div>
            {selectedInvoiceOrder && (
                <InvoiceModal
                    order={selectedInvoiceOrder}
                    viewMode="seller"
                    sellerId={user?.id || user?._id}
                    onClose={() => setSelectedInvoiceOrder(null)}
                />
            )}
        </div>
    );
};

export default ManufacturerOrdersPage;
