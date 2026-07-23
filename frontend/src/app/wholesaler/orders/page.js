"use client";

import { getApiBaseUrl } from '@/lib/api';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Package,
    Calendar,
    Banknote,
    Clock,
    AlertCircle,
    Search,
    Filter,
    ChevronRight,
    ArrowUpRight,
    Target,
    ShieldCheck,
    LayoutGrid,
    ListFilter,
    Building2,
    CheckCircle,
    MapPin,
    ArrowRight,
    RefreshCw,
    FileText
} from 'lucide-react';
import PageShell from '@/components/dashboard/PageShell';
import PageHeader from '@/components/dashboard/PageHeader';
import { useAuth } from '@/context/AuthContext';
import InvoiceModal from '@/components/shared/InvoiceModal';
import { formatPKR, sumBuyerRefundDeductions, countBuyerRefunds, getUserFinancialMetrics } from '@/lib/financeUtils';
import { isBuyerOnOrder, resolveUserId } from '@/lib/dashboardAnalytics';
import { useRefundRecords } from '@/hooks/useRefundRecords';
import { subscribeFinancialSync } from '@/lib/financialSync';
import { resolveProductImageUrl } from '@/lib/marketplaceData';

const WholesalerOrdersPage = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
    const { refundRecords } = useRefundRecords();
    const userId = resolveUserId(user);

    const handleViewInvoice = useCallback((selectedOrder) => {
        if (!selectedOrder) return;

        let relatedOrders = [];
        if (selectedOrder.checkoutGroupId) {
            relatedOrders = orders.filter(o => o.checkoutGroupId === selectedOrder.checkoutGroupId);
        } else {
            const selectedTime = new Date(selectedOrder.createdAt).getTime();
            relatedOrders = orders.filter(o => 
                Math.abs(new Date(o.createdAt).getTime() - selectedTime) < 30000
            );
        }

        if (relatedOrders.length <= 1) {
            setSelectedInvoiceOrder(selectedOrder);
            return;
        }

        const combinedItems = [];
        let combinedTotalAmount = 0;
        let combinedPlatformCommission = 0;

        relatedOrders.forEach(o => {
            combinedItems.push(...(o.items || []));
            combinedTotalAmount += (o.totalAmount || 0);
            combinedPlatformCommission += (o.platformCommissionTotal || 0);
        });

        setSelectedInvoiceOrder({
            ...selectedOrder,
            items: combinedItems,
            totalAmount: combinedTotalAmount,
            platformCommissionTotal: combinedPlatformCommission,
            isCombined: true
        });
    }, [orders]);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${getApiBaseUrl()}/api/orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setOrders(data.data);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch purchase orders database.');
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

    const purchaseOrders = useMemo(() => {
        return orders.filter((order) => isBuyerOnOrder(order, userId));
    }, [orders, userId]);

    const purchaseStats = useMemo(() => {
        const buyerRefundsCount = countBuyerRefunds(refundRecords, userId, null);
        
        const spent = purchaseOrders.reduce((sum, order) => {
            const status = (order.status || '').toLowerCase();
            
            const isPayRefunded = (order.paymentStatus || '').toLowerCase() === 'refunded';
            const isRefundRecord = refundRecords?.some(r => {
                const rId = (r.order?._id || r.order?.id || r.order)?.toString();
                const oId = (order?._id || order?.id)?.toString();
                return rId && oId && rId === oId;
            });
            const isRefunded = isPayRefunded || isRefundRecord;

            if (!isRefunded && (status === 'delivered' || status === 'completed')) {
                return sum + (order.totalAmount || 0);
            }
            return sum;
        }, 0);

        return { totalSpent: spent, buyerRefundsCount };
    }, [purchaseOrders, refundRecords, userId]);

    const filteredOrders = useMemo(() => {
        let result = purchaseOrders;

        if (filter !== 'all') {
            if (filter === 'refunded') {
                result = result.filter(order => {
                    const isPayRefunded = (order.paymentStatus || '').toLowerCase() === 'refunded';
                    return isPayRefunded || refundRecords?.some(r => {
                        const rId = (r.order?._id || r.order?.id || r.order)?.toString();
                        const oId = (order?._id || order?.id)?.toString();
                        return rId && oId && rId === oId;
                    });
                });
            } else {
                result = result.filter(order => order.status?.toLowerCase() === filter.toLowerCase());
            }
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(order => {
                const orderId = (order._id || '').toLowerCase();
                const firstItemName = (order.items?.[0]?.product?.name || order.items?.[0]?.name || '').toLowerCase();
                const supplierName = (
                    order.manufacturer?.name || 
                    order.sellerStats?.[0]?.seller?.name || 
                    ''
                ).toLowerCase();
                return orderId.includes(query) || firstItemName.includes(query) || supplierName.includes(query);
            });
        }

        return result;
    }, [purchaseOrders, filter, searchQuery]);

    const getStatusStyle = (status) => {
        const styles = {
            pending: 'text-amber-600 bg-amber-50 border-amber-100',
            paid: 'text-emerald-600 bg-emerald-50 border-emerald-100',
            shipped: 'text-blue-600 bg-blue-50 border-blue-100',
            delivered: 'text-emerald-700 bg-emerald-100 border-emerald-200',
            cancelled: 'text-red-600 bg-red-50 border-red-100'
        };
        return styles[status?.toLowerCase()] || 'text-slate-500 bg-slate-50 border-slate-100';
    };

    const handleReorder = (items) => {
        try {
            const savedCart = localStorage.getItem('wholesaler_cart');
            let currentCart = savedCart ? JSON.parse(savedCart) : [];
            
            items.forEach(item => {
                const prodId = item.product?._id ?? item.product;
                const existing = currentCart.find(c => c.productId === prodId);
                if (existing) {
                    existing.quantity += item.quantity;
                } else {
                    currentCart.push({
                        id: prodId,
                        productId: prodId,
                        name: item.product?.name || item.name || 'Product Listing',
                        image: item.product?.images?.[0] || item.image || null,
                        manufacturer: item.product?.seller?.name || 'Verified Supplier',
                        price: item.price || 0,
                        quantity: item.quantity || 1,
                        moq: item.product?.minimumOrderQuantity || 1,
                        bulkUnit: item.product?.bulkUnit || 'Dozen',
                        packSize: item.product?.packSize || 1
                    });
                }
            });
            localStorage.setItem('wholesaler_cart', JSON.stringify(currentCart));
            router.push('/wholesaler/cart');
        } catch (e) {
            alert('Could not process reorder.');
        }
    };

    const renderTimeline = (status) => {
        const steps = ['pending', 'paid', 'shipped', 'delivered'];
        const stepLabels = ['Placed', 'Paid', 'Shipped', 'Received'];
        
        const lowerStatus = status?.toLowerCase();
        let currentIndex = steps.indexOf(lowerStatus);
        
        // Custom check for shipped status in processing
        if (lowerStatus === 'processing') currentIndex = 1;

        return (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 overflow-x-auto scrollbar-none">
                {stepLabels.map((label, index) => {
                    const isCompleted = index <= currentIndex && lowerStatus !== 'cancelled';
                    const isActive = index === currentIndex && lowerStatus !== 'cancelled';
                    
                    return (
                        <React.Fragment key={label}>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black ${
                                    isActive ? 'bg-emerald-600 text-white animate-pulse' : 
                                    isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                                }`}>
                                    {isCompleted ? '✓' : index + 1}
                                </div>
                                <span className={`text-[10px] font-body font-black uppercase tracking-wider ${
                                    isActive ? 'text-slate-900 font-extrabold' : 
                                    isCompleted ? 'text-emerald-600' : 'text-slate-400'
                                }`}>
                                    {label}
                                </span>
                            </div>
                            {index < stepLabels.length - 1 && (
                                <div className={`flex-1 h-[2px] min-w-[16px] max-w-[40px] rounded shrink-0 ${
                                    index < currentIndex && lowerStatus !== 'cancelled' ? 'bg-emerald-500' : 'bg-slate-100'
                                }`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-slate-200 border-b-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="font-sans font-bold text-slate-400 uppercase tracking-widest text-xs">Loading Purchase Orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 w-full pb-16">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="font-heading text-3xl font-black text-[#0F172A] tracking-tight">Purchase Orders</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1 max-w-xl leading-relaxed">
                        Track your wholesale orders, payments, and deliveries.
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-5 mb-2">
                {[
                    { label: 'Total Spent', value: formatPKR(purchaseStats.totalSpent), icon: Banknote, color: 'text-blue-700', bg: 'bg-blue-100' },
                    { label: 'Total Purchases', value: purchaseOrders.length, icon: Package, color: 'text-indigo-700', bg: 'bg-indigo-100' },
                    { label: 'Pending Orders', value: purchaseOrders.filter(o => o.status === 'pending' || o.status === 'processing').length, icon: Clock, color: 'text-amber-700', bg: 'bg-amber-100' },
                    { label: 'Refund Orders', value: purchaseStats.buyerRefundsCount, icon: AlertCircle, color: 'text-red-700', bg: 'bg-red-100' },
                    { label: 'Active Suppliers', value: new Set(purchaseOrders.map(o => o.seller?._id || o.manufacturer?._id || o.sellerStats?.[0]?.seller?._id).filter(Boolean)).size || purchaseOrders.length > 0 ? new Set(purchaseOrders.map(o => o.seller?._id || o.manufacturer?._id || o.sellerStats?.[0]?.seller?._id).filter(Boolean)).size : 0, icon: ShieldCheck, color: 'text-emerald-700', bg: 'bg-emerald-100' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                                <stat.icon size={18} className="stroke-[2.5]" />
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{stat.label}</div>
                            <div className="font-sans text-2xl font-bold text-slate-900">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Error handling */}
            {error && (
                <div className="p-4 bg-[#FEF2F2] border border-[#EF4444]/20 rounded-[14px] flex items-center gap-3 text-[#EF4444]">
                    <AlertCircle size={18} />
                    <p className="font-sans text-[13px] font-[600]">{error}</p>
                </div>
            )}

            {/* Main Content Layout Grid */}
            <div className="flex flex-col gap-8 items-start w-full">
                
                {/* Full Width: Search, Filters, Status Tabs, and Orders List/Table */}
                <div className="flex flex-col gap-6 min-w-0 w-full">
                    
                    {/* Control Panel: Search & Advanced Filters */}
                    <div className="filter-bar-enterprise space-y-5">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            {/* Search */}
                            <div className="relative w-full md:flex-1">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by Order ID, product, or supplier..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="search-enterprise"
                                />
                            </div>
                        </div>

                        {/* Professional Tabs Row */}
                        <div className="flex items-center gap-2 overflow-x-auto border-t border-[#F1F5F9] pt-5 scrollbar-none pb-1">
                            {['all', 'pending', 'shipped', 'delivered', 'refunded'].map((f) => {
                                const isActive = filter === f;
                                let count = 0;
                                if (f === 'all') count = purchaseOrders.length;
                                else if (f === 'refunded') count = purchaseStats.buyerRefundsCount;
                                else count = purchaseOrders.filter(o => o.status?.toLowerCase() === f.toLowerCase()).length;
                                return (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`status-tab ${isActive ? 'active' : ''}`}
                                    >
                                        <span className="capitalize">{f === 'delivered' ? 'Received' : f}</span>
                                        <span className={`px-2 py-0.5 ml-2 rounded-[8px] text-[11px] font-[700] leading-none ${
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
                                        <table className="min-w-[900px]">
                                            <thead>
                                                <tr>
                                                    <th>Order ID</th>
                                                    <th>Supplier</th>
                                                    <th className="min-w-[200px]">Product Details</th>
                                                    <th>Total Value</th>
                                                    <th>Status</th>
                                                    <th className="text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#F1F5F9]">
                                                {filteredOrders.map((order) => {
                                                    const formattedDate = new Date(order.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
                                                    const supplierName = order.manufacturer?.name || order.sellerStats?.[0]?.seller?.name || 'Verified Supplier';

                                                    const isPayRefunded = (order.paymentStatus || '').toLowerCase() === 'refunded';
                                                    const isRefunded = isPayRefunded || refundRecords?.some(r => {
                                                        const rId = (r.order?._id || r.order?.id || r.order)?.toString();
                                                        const oId = (order?._id || order?.id)?.toString();
                                                        return rId && oId && rId === oId;
                                                    });
                                                    let displayStatus = order.status;
                                                    if (isRefunded && (displayStatus.toLowerCase() === 'delivered' || displayStatus.toLowerCase() === 'completed')) {
                                                        displayStatus = 'Returned';
                                                    }
                                                    
                                                    const statusStyle = getStatusStyle(displayStatus);

                                                    return (
                                                        <tr key={order._id} className="h-[72px] hover:bg-[#F8FFFB] transition-all duration-200 group">
                                                            {/* ID */}
                                                            <td className="px-6 py-4 whitespace-nowrap align-middle">
                                                                <div className="font-sans font-[800] text-[14px] text-[#0F172A] group-hover:text-[#00A878] transition-colors">
                                                                    #{order._id.slice(-8).toUpperCase()}
                                                                </div>
                                                                <div className="font-mono text-[11px] text-[#94A3B8] font-[500] mt-1 flex items-center gap-1">
                                                                    <Calendar size={10} /> {formattedDate}
                                                                </div>
                                                            </td>

                                                            {/* Supplier */}
                                                            <td className="px-6 py-4 align-middle">
                                                                <div className="font-sans text-[14px] font-[600] text-[#0F172A] line-clamp-1 max-w-[150px]" title={supplierName}>
                                                                    {supplierName}
                                                                </div>
                                                                <div className="flex items-center gap-1 mt-1 text-[#94A3B8] font-sans text-[11px] font-[500]">
                                                                    <MapPin size={12} className="shrink-0 text-[#CBD5E1]" />
                                                                    <span className="truncate max-w-[130px]">Pakistan</span>
                                                                </div>
                                                            </td>

                                                            {/* Product Details */}
                                                            <td className="px-6 py-4 align-middle">
                                                                <div className="flex items-start gap-3">
                                                                    <div className="w-10 h-10 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] flex items-center justify-center shrink-0 overflow-hidden">
                                                                        {order.items?.[0]?.product?.images?.[0] || order.items?.[0]?.image ? (
                                                                            <img 
                                                                                src={resolveProductImageUrl(order.items[0].product?.images?.[0] || order.items[0].image)}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <Package size={18} className="text-[#94A3B8]" />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-sans text-[14px] font-[700] text-[#0F172A] line-clamp-1 max-w-[200px] leading-snug" title={order.items?.[0]?.product?.name || order.items?.[0]?.name}>
                                                                            {order.items?.[0]?.product?.name || order.items?.[0]?.name || 'Consolidated Procurement'}
                                                                        </div>
                                                                        {order.items?.length > 1 && (
                                                                            <div className="font-sans text-[11px] text-[#00A878] font-[700] uppercase tracking-widest mt-1">
                                                                                +{order.items.length - 1} items
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Total Value */}
                                                            <td className="px-6 py-4 align-middle font-sans text-[15px] font-[700] text-[#0F172A] whitespace-nowrap">
                                                                PKR {order.totalAmount?.toLocaleString()}
                                                            </td>

                                                            {/* Status Badge */}
                                                            <td>
                                                                <div className={`badge-enterprise inline-flex ${displayStatus.toLowerCase() === 'delivered' || displayStatus.toLowerCase() === 'paid' ? 'success' : displayStatus.toLowerCase() === 'shipped' ? 'info' : displayStatus.toLowerCase() === 'cancelled' || displayStatus.toLowerCase() === 'returned' ? 'danger' : 'warning'}`}>
                                                                    {displayStatus.toLowerCase() === 'delivered' ? 'Received' : displayStatus}
                                                                </div>
                                                            </td>

                                                            {/* Action buttons */}
                                                            <td className="px-6 py-4 align-middle whitespace-nowrap text-right">
                                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleReorder(order.items)}
                                                                        className="h-10 w-10 flex items-center justify-center bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] rounded-[10px] transition-all cursor-pointer hover:-translate-y-0.5"
                                                                        title="Reorder"
                                                                    >
                                                                        <RefreshCw size={18} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleViewInvoice(order)}
                                                                        className="h-10 w-10 flex items-center justify-center bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] rounded-[10px] transition-all cursor-pointer hover:-translate-y-0.5"
                                                                        title="View Invoice"
                                                                    >
                                                                        <FileText size={18} />
                                                                    </button>
                                                                    <Link
                                                                        href={`/wholesaler/orders/${order._id}`}
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
                                        const formattedDate = new Date(order.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
                                        const supplierName = order.manufacturer?.name || order.sellerStats?.[0]?.seller?.name || 'Verified Supplier';
                                        
                                        const isPayRefunded = (order.paymentStatus || '').toLowerCase() === 'refunded';
                                        const isRefunded = isPayRefunded || refundRecords?.some(r => {
                                            const rId = (r.order?._id || r.order?.id || r.order)?.toString();
                                            const oId = (order?._id || order?.id)?.toString();
                                            return rId && oId && rId === oId;
                                        });
                                        let displayStatus = order.status;
                                        if (isRefunded && (displayStatus.toLowerCase() === 'delivered' || displayStatus.toLowerCase() === 'completed')) {
                                            displayStatus = 'Returned';
                                        }

                                        const statusStyle = getStatusStyle(displayStatus);

                                        return (
                                            <div key={order._id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow transition-all space-y-4">
                                                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                                    <div>
                                                        <div className="font-sans font-bold text-[14px] text-slate-900">
                                                            #{order._id.slice(-8).toUpperCase()}
                                                        </div>
                                                        <div className="font-mono text-[11px] text-slate-400 font-medium mt-1">
                                                            {formattedDate}
                                                        </div>
                                                    </div>
                                                    <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${statusStyle}`}>
                                                        {displayStatus.toLowerCase() === 'delivered' ? 'Received' : displayStatus}
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="font-sans text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Supplier</div>
                                                        <div className="font-sans text-[13px] font-semibold text-slate-800">{supplierName}</div>
                                                    </div>

                                                    <div className="flex gap-3 items-center">
                                                        <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                                            {order.items?.[0]?.product?.images?.[0] || order.items?.[0]?.image ? (
                                                                <img 
                                                                    src={resolveProductImageUrl(order.items[0].product?.images?.[0] || order.items[0].image)} 
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <Package size={18} className="text-slate-300" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-sans text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Product</div>
                                                            <div className="font-sans text-[13px] font-semibold text-slate-800 line-clamp-1">
                                                                {order.items?.[0]?.product?.name || order.items?.[0]?.name || 'Consolidated Procurement'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-1">
                                                        <div className="font-sans text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Value</div>
                                                        <div className="font-sans text-[14px] font-bold text-slate-900">
                                                            PKR {order.totalAmount?.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-3 border-t border-slate-50">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReorder(order.items)}
                                                        className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-sans font-bold text-[11px] uppercase tracking-widest transition-all cursor-pointer"
                                                    >
                                                        Reorder
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewInvoice(order)}
                                                        className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-sans font-bold text-[11px] uppercase tracking-widest transition-all cursor-pointer"
                                                    >
                                                        Invoice
                                                    </button>
                                                    <Link
                                                        href={`/wholesaler/orders/${order._id}`}
                                                        className="flex-1 text-center py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-sans font-bold text-[11px] uppercase tracking-widest transition-all shadow-md"
                                                    >
                                                        Details
                                                    </Link>
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
                                    <Package size={28} />
                                </div>
                                <h3 className="font-sans text-xl font-bold text-slate-800 uppercase tracking-tight mb-2">
                                    No purchases found
                                </h3>
                                <p className="font-sans text-slate-400 text-[14px] font-medium max-w-[420px] mb-6 leading-relaxed">
                                    You have no purchase history under this status filter. Check other filters or shop in the marketplace.
                                </p>
                                <Link
                                    href="/wholesaler/marketplace"
                                    className="px-5 py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-sans font-bold text-[12px] uppercase tracking-widest shadow-md transition-all duration-200"
                                >
                                    Explore Marketplace
                                </Link>
                            </div>
                        )}
                    </div>
                </div>


            </div>

            {selectedInvoiceOrder && (
                <InvoiceModal
                    order={selectedInvoiceOrder}
                    viewMode="buyer"
                    onClose={() => setSelectedInvoiceOrder(null)}
                />
            )}
        </div>
    );
};

export default WholesalerOrdersPage;
