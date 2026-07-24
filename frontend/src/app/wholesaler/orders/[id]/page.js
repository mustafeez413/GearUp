"use client";

import { getApiBaseUrl } from '@/lib/api';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    MapPin,
    CheckCircle,
    Clock,
    ChevronLeft,
    Package,
    Truck,
    CheckCircle2,
    Box,
    Building2,
    Calendar,
    DollarSign,
    Hash,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import InvoiceModal from '@/components/shared/InvoiceModal';
import DisputeModal from '@/components/disputes/DisputeModal';
import DisputeResolutionCard from '@/components/disputes/DisputeResolutionCard';
import { resolveProductImageUrl } from '@/lib/marketplaceData';
import { isItemDisputeLocked } from '@/lib/financeUtils';
import { subscribeFinancialSync } from '@/lib/financialSync';

const DISPUTABLE_ORDER_STATUSES = ['processing', 'shipped', 'delivered', 'completed'];

function getOrderItemProductId(item) {
    return String(item?.product?._id || item?.product || '');
}

function getOrderItemSellerId(item) {
    return String(item?.seller?._id || item?.seller || '');
}

function buildOrderTracking(o) {
    if (o.trackingLog?.length) {
        return o.trackingLog.map((e) => ({
            label: e.message || e.status,
            status: e.status,
            completed: true,
            date: e.createdAt
        }));
    }

    const st = (o.status || '').toLowerCase();
    const verified = o.isPaymentVerified || o.paymentStatus === 'verified';
    const at = (keys) => (keys.includes(st) ? (o.updatedAt || o.createdAt) : null);

    return [
        { label: 'Order Placed', completed: true, date: o.createdAt },
        { label: 'Card Payment', completed: verified, date: verified ? o.createdAt : null },
        { label: 'Processing', completed: ['processing', 'shipped', 'delivered', 'completed'].includes(st), date: at(['processing', 'shipped', 'delivered', 'completed']) },
        { label: 'Shipped', completed: ['shipped', 'delivered', 'completed'].includes(st), date: at(['shipped', 'delivered', 'completed']) },
        { label: 'Received', completed: ['delivered', 'completed'].includes(st), date: at(['delivered', 'completed']) }
    ];
}

const WholesalerOrderDetailsPage = ({ params }) => {
    const resolvedParams = React.use(params);
    const { id } = resolvedParams;
    const router = useRouter();
    const { user } = useAuth();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showInvoice, setShowInvoice] = useState(false);
    const [allOrders, setAllOrders] = useState([]);
    const [showDispute, setShowDispute] = useState(false);
    const [disputeItem, setDisputeItem] = useState(null);
    const [orderDisputes, setOrderDisputes] = useState([]);

    const fetchOrder = useCallback(async () => {
        if (!id) {
            setError('Invalid order ID');
            setLoading(false);
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            const response = await fetch(`${getApiBaseUrl()}/api/orders/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.success && data.data) {
                const o = data.data;
                // Map backend fields to frontend with proper null checks
                const sellerMap = new Map();
                (o.sellerStats || []).forEach((s) => {
                    const id = (s.seller?._id || s.seller)?.toString();
                    if (id) {
                        sellerMap.set(id, s.seller?.name || s.seller?.businessDetails?.companyName || s.seller?.businessDetails?.businessName || 'Seller');
                    }
                });
                (o.items || []).forEach((item) => {
                    const id = (item.seller?._id || item.seller)?.toString();
                    if (id && !sellerMap.has(id)) {
                        sellerMap.set(id, item.seller?.name || item.seller?.businessDetails?.companyName || 'Seller');
                    }
                });

                const mappedOrder = {
                    _id: o._id || '',
                    buyerId: String(o.buyer?._id || o.buyer || ''),
                    product: o.items?.[0]?.product?.name || o.items?.[0]?.name || 'Bulk Order',
                    items: (o.items || []).map((item) => ({
                        ...item,
                        disputeStatus: item.disputeStatus || 'none',
                    })),
                    quantity: o.items?.reduce((acc, i) => acc + (i.quantity || 0), 0) || 0,
                    unitPrice: o.items?.[0]?.price || 0,
                    total: o.totalAmount || 0,
                    status: o.status || 'pending',
                    date: o.createdAt || new Date().toISOString(),
                    sellers: Array.from(sellerMap.entries()).map(([id, name]) => ({ id, name })),
                    sellerStats: o.sellerStats || [],
                    paymentMethod: o.paymentMethod,
                    isPaymentVerified: o.isPaymentVerified,
                    trackingLog: o.trackingLog || [],
                    shippingAddress: o.shippingAddress?.address || 'Destination not specified',
                    shippingCity: o.shippingAddress?.city || '',
                    paymentStatus: o.paymentStatus || 'pending',
                    transactionReference: o.transactionReference || '',
                    tracking: buildOrderTracking(o)
                };
                setOrder(mappedOrder);
            } else {
                throw new Error(data.error || 'Failed to load order data');
            }
        } catch (err) {
            console.error('[OrderDetail] fetchOrder error:', err);
            setError(err.message || 'Could not retrieve order details. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    const fetchOrderDisputes = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${getApiBaseUrl()}/api/disputes/mine`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                const forOrder = (data.data || []).filter(
                    (d) => String(d.order?._id || d.order) === String(id)
                );
                setOrderDisputes(forOrder);
            }
        } catch {
            setOrderDisputes([]);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchOrder();
    }, [id, fetchOrder]);

    useEffect(() => {
        if (id) fetchOrderDisputes();
    }, [id, fetchOrderDisputes]);

    useEffect(() => {
        return subscribeFinancialSync(() => {
            fetchOrderDisputes();
            fetchOrder();
        });
    }, [fetchOrderDisputes, fetchOrder]);

    useEffect(() => {
        const fetchAllOrders = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${getApiBaseUrl()}/api/orders`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (data.success) {
                    setAllOrders(data.data || []);
                }
            } catch (err) {
                console.error('Failed to load related orders:', err);
            }
        };
        fetchAllOrders();
    }, []);

    const getStatusConfig = (status) => {
        const configs = {
            pending: { color: 'text-amber-500 bg-amber-50 border-amber-100', icon: Clock },
            processing: { color: 'text-blue-500 bg-blue-50 border-blue-100', icon: Package },
            shipped: { color: 'text-indigo-500 bg-indigo-50 border-indigo-100', icon: Truck },
            delivered: { color: 'text-emerald-500 bg-emerald-50 border-emerald-100', icon: CheckCircle2 }
        };
        return configs[status] || { color: 'text-slate-500 bg-slate-50 border-slate-100', icon: Clock };
    };

    const handleConfirmDelivery = async (targetSellerId = null) => {
        if (!confirm("Confirm delivery for these items? This will finalize this seller portion of your order.")) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${getApiBaseUrl()}/api/orders/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: 'completed', sellerId: targetSellerId })
            });
            const data = await response.json();
            if (data.success) {
                fetchOrder();
            } else {
                alert(data.error || 'Failed to confirm delivery');
                setLoading(false);
            }
        } catch (err) {
            alert('Communication loss during update.');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-slate-200 border-b-emerald-600 rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="font-body font-bold text-slate-400 uppercase tracking-widest text-xs">Loading Order Details...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="max-w-2xl mx-auto p-12 bg-white rounded-[3rem] border border-slate-100 shadow-2xl text-center">
                <AlertCircle className="mx-auto text-red-100 mb-8" size={100} />
                <h1 className="font-heading text-4xl font-black text-slate-900 tracking-tighter mb-4">Order Not Found</h1>
                <p className="font-body text-slate-500 mb-10 font-medium">{error || 'The requested order data is no longer available in our records.'}</p>
                <Link href="/wholesaler/orders" className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-body font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/10">
                    <ChevronLeft size={16} /> Return to Orders
                </Link>
            </div>
        );
    }

    const statusConfig = getStatusConfig(order.status);
    const currentUserId = String(user?.id || user?._id || '');
    const isOrderBuyer = Boolean(currentUserId && order.buyerId === currentUserId);

    const getItemSellerStatus = (item) => {
        const sellerId = getOrderItemSellerId(item);
        const stat = (order.sellerStats || []).find(
            (s) => String(s.seller?._id || s.seller || '') === sellerId
        );
        return (stat?.status || order.status || 'pending').toLowerCase();
    };

    const getItemDisputeRecord = (item) => {
        const productId = getOrderItemProductId(item);
        return orderDisputes.find(
            (d) => String(d.product?._id || d.product || '') === productId
        );
    };

    const getItemDisputeStatus = (item) => {
        const dbStatus = (item.disputeStatus || 'none').toLowerCase();
        if (dbStatus && dbStatus !== 'none') return dbStatus;
        return getItemDisputeRecord(item)?.status?.toLowerCase() || 'none';
    };

    const canFileDisputeForItem = (item) => {
        if (!isOrderBuyer) return false;
        const sellerStatus = getItemSellerStatus(item);
        const isSellerEligible = ['delivered', 'completed'].includes(sellerStatus);
        if (!isSellerEligible) return false;
        return !isItemDisputeLocked(getItemDisputeStatus(item));
    };

    const getItemStatusPresentation = (item) => {
        const status = getItemDisputeStatus(item);
        if (status === 'open' || ['awaiting_seller', 'seller_responded', 'under_review', 'investigating'].includes(status)) {
            return { label: 'Disputed', className: 'text-rose-600 bg-rose-50 border-rose-100' };
        }
        if (status === 'settled' || status === 'refunded') {
            return { label: 'Refunded', className: 'text-emerald-700 bg-emerald-50 border-emerald-100' };
        }
        if (status === 'rejected') {
            return { label: 'Dispute Denied', className: 'text-slate-600 bg-slate-50 border-slate-200' };
        }
        if (status === 'resolved') {
            return { label: 'Dispute Closed', className: 'text-slate-600 bg-slate-50 border-slate-200' };
        }
        const sellerStatus = getItemSellerStatus(item);
        if (sellerStatus === 'delivered') {
            return { label: 'Delivered', className: 'text-emerald-700 bg-emerald-50 border-emerald-100' };
        }
        if (sellerStatus === 'completed') {
            return { label: 'Completed', className: 'text-emerald-700 bg-emerald-50 border-emerald-100' };
        }
        if (sellerStatus === 'shipped') {
            return { label: 'Shipped', className: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
        }
        if (sellerStatus === 'processing') {
            return { label: 'Processing', className: 'text-blue-600 bg-blue-50 border-blue-100' };
        }
        return { label: sellerStatus || 'Pending', className: 'text-amber-600 bg-amber-50 border-amber-100' };
    };

    const refreshDisputeState = () => {
        fetchOrderDisputes();
        fetchOrder();
    };

    const openDisputeForItem = (item) => {
        const productId = getOrderItemProductId(item);
        const sellerId = getOrderItemSellerId(item);
        const sellerName =
            item.seller?.name ||
            item.seller?.businessDetails?.companyName ||
            order.sellers.find((s) => s.id === sellerId)?.name ||
            'Seller';

        setDisputeItem({
            productId,
            name: item.product?.name || item.name || 'Order item',
            image: resolveProductImageUrl(item.product?.images?.[0] || item.image),
            sellerId,
            sellerName,
        });
        setShowDispute(true);
    };

    const closeDisputeModal = () => {
        setShowDispute(false);
        setDisputeItem(null);
    };

    const getPaymentLabel = () => {
        if (order.paymentStatus === 'verified' || order.isPaymentVerified) {
            return 'Paid via Card (Stripe)';
        }
        return 'Card payment pending';
    };


    const renderBadge = (status, labelText = null) => {
        const text = (labelText || status || '').toLowerCase();
        
        let bgClass = 'bg-slate-50 text-slate-600 border-slate-200';
        
        if (['paid', 'verified', 'completed', 'delivered', 'approved', 'resolved', 'settled', 'success'].some(s => text.includes(s))) {
            bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        } else if (['pending', 'processing', 'awaiting', 'under_review', 'investigating'].some(s => text.includes(s))) {
            bgClass = 'bg-amber-50 text-amber-700 border-amber-200';
        } else if (['shipped', 'sent'].some(s => text.includes(s))) {
            bgClass = 'bg-blue-50 text-blue-700 border-blue-200';
        } else if (['cancelled', 'rejected', 'refunded', 'disputed', 'open'].some(s => text.includes(s))) {
            bgClass = 'bg-rose-50 text-rose-700 border-rose-200';
        }
        
        return (
            <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${bgClass} h-6`}>
                {labelText || status}
            </span>
        );
    };

    const btnBase = "inline-flex items-center justify-center gap-2 px-4 h-10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm";
    const btnSecondary = `${btnBase} bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:text-[#00A878] hover:border-[#00A878]`;
    const btnPrimary = `${btnBase} bg-[#00A878] hover:bg-[#059669] text-white border border-transparent`;
    const btnDanger = `${btnBase} bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100`;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20 px-4 md:px-0">
            {/* Top Nav / Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/wholesaler/orders"
                        className={btnSecondary}
                    >
                        <ChevronLeft size={16} />
                        Purchase History
                    </Link>
                    <button
                        type="button"
                        onClick={() => setShowInvoice(true)}
                        className={btnSecondary}
                    >
                        View Invoice
                    </button>
                    {order && ['shipped', 'processing'].includes(order.status?.toLowerCase()) && (
                        <button
                            type="button"
                            onClick={handleConfirmDelivery}
                            className={btnPrimary}
                        >
                            <CheckCircle2 size={16} /> Confirm Delivery
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 self-start sm:self-auto">
                    <div className="w-2 h-2 rounded-full bg-[#00A878] animate-pulse"></div>
                    <span className="font-body text-[10px] font-black uppercase text-emerald-700 tracking-[0.2em] italic">Order View Active</span>
                </div>
            </div>

            {/* Header Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="font-heading text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">
                                {order.product}
                            </h1>
                            {renderBadge(order.status?.toLowerCase() === 'delivered' ? 'Received' : order.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-slate-500 text-sm font-medium">
                            <span className="flex items-center gap-1.5">
                                <Hash size={16} className="text-slate-400" />
                                Ref: <span className="font-mono text-slate-700">{order._id}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar size={16} className="text-slate-400" />
                                {new Date(order.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Package size={16} className="text-slate-400" />
                                {order.quantity} Units Bulk Volume
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    {/* Total Price Section */}
                    <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-8 flex flex-col justify-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Order Total</span>
                        <span className="font-heading text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
                            PKR {order.total.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-2">
                            {renderBadge(getPaymentLabel())}
                        </div>
                    </div>
                    
                    {/* Detailed Metadata Grid */}
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                        <div>
                            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Method</span>
                            <span className="text-sm font-semibold text-slate-800">
                                Card Payment (Stripe)
                            </span>
                        </div>
                        <div>
                            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Transaction Ref</span>
                            <span className="text-sm font-mono font-semibold text-slate-600 truncate block">
                                {order.transactionReference || 'N/A'}
                            </span>
                        </div>
                        <div>
                            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Items</span>
                            <span className="text-sm font-semibold text-slate-800">
                                {order.quantity} Units Bulk Volume
                            </span>
                        </div>
                        <div>
                            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Order Date</span>
                            <span className="text-sm font-semibold text-slate-800">
                                {new Date(order.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shipment Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-[#00A878] border border-emerald-100">
                        <Truck size={16} />
                    </div>
                    <h2 className="font-heading text-lg font-bold tracking-tight text-slate-900">Shipment Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-slate-500">
                            <MapPin size={18} />
                        </div>
                        <div>
                            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Destination Address</span>
                            <p className="font-body text-sm font-semibold text-slate-700 leading-relaxed">
                                {order.shippingAddress}
                                {order.shippingCity && `, ${order.shippingCity}`}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-slate-500">
                            <Building2 size={18} />
                        </div>
                        <div>
                            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Supplier Details</span>
                            <p className="font-body text-sm font-semibold text-slate-700 leading-relaxed">
                                {order.sellers.map((s) => s.name).join(', ') || 'Authorized Suppliers'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product List Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-[#00A878] border border-emerald-100">
                        <Package size={16} />
                    </div>
                    <h2 className="font-heading text-lg font-bold tracking-tight text-slate-900">Items Ordered</h2>
                </div>
                
                <div className="space-y-4">
                    {order.items.map((item, i) => {
                        const itemStatus = getItemStatusPresentation(item);
                        const subtotal = item.quantity * item.price;
                        
                        return (
                            <div key={getOrderItemProductId(item) || i} className="bg-slate-50 rounded-xl border border-slate-200 p-5 hover:border-slate-350 transition-all duration-200">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    
                                    {/* Image + Product Details Group */}
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
                                            <img
                                                src={resolveProductImageUrl(item.product?.images?.[0] || item.image)}
                                                alt={item.product?.name || item.name || 'Order item'}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-heading text-sm font-bold text-slate-800 truncate mb-1">
                                                {item.product?.name || item.name}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-semibold text-slate-400">
                                                {item.product?.sku && (
                                                    <span>SKU: <span className="font-mono text-slate-600">{item.product.sku}</span></span>
                                                )}
                                                <span>Qty: <span className="text-slate-600">{item.quantity} {item.bulkUnit === 'Dozen' ? (item.quantity > 1 ? 'Dozens' : 'Dozen') : (item.bulkUnit || 'Pack') + (item.quantity > 1 ? 's' : '')}</span></span>
                                                <span>Price: <span className="text-slate-600">PKR {item.price?.toLocaleString()}</span></span>
                                            </div>
                                            <div className="mt-2.5 flex items-center gap-2">
                                                {renderBadge(itemStatus.label)}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Subtotal + Action Button Group */}
                                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 shrink-0 border-t md:border-t-0 border-slate-200/60 pt-4 md:pt-0">
                                        <div className="text-left md:text-right">
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Subtotal</span>
                                            <span className="font-heading text-base font-black text-slate-800">
                                                PKR {subtotal.toLocaleString()}
                                            </span>
                                        </div>
                                        {canFileDisputeForItem(item) && (
                                            <button
                                                type="button"
                                                onClick={() => openDisputeForItem(item)}
                                                className={btnDanger}
                                            >
                                                <AlertCircle size={14} /> File Dispute
                                            </button>
                                        )}
                                    </div>
                                    
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {orderDisputes.length > 0 && (
                <div className="space-y-4">
                    <h2 className="font-heading text-lg font-bold text-slate-900 tracking-tight mb-2">Active Disputes</h2>
                    {orderDisputes.map((d) => (
                        <DisputeResolutionCard
                            key={d._id}
                            dispute={d}
                            role="buyer"
                            onRefresh={refreshDisputeState}
                        />
                    ))}
                </div>
            )}

            {/* Order Tracking */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-[#00A878] border border-emerald-100">
                        <Truck size={16} />
                    </div>
                    <h2 className="font-heading text-lg font-bold tracking-tight text-slate-900">Order Shipment Log</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
                    <div className="absolute top-[28px] left-[32px] right-[32px] h-[3px] bg-slate-100 hidden md:block"></div>
                    {order.tracking.map((step, index) => (
                        <div key={index} className="relative z-10 flex flex-col items-center md:items-start group">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 border-white shadow-md transition-all duration-300 ${
                                step.completed 
                                    ? 'bg-[#00A878] text-white scale-105' 
                                    : 'bg-slate-100 text-slate-300'
                            }`}>
                                {step.completed ? <CheckCircle size={20} className="stroke-[2.5]" /> : <div className="w-2.5 h-2.5 rounded-full bg-slate-350" />}
                            </div>
                            
                            <div className="mt-4 text-center md:text-left">
                                <h3 className={`font-heading text-sm font-bold tracking-tight transition-colors duration-200 ${
                                    step.completed ? 'text-slate-800' : 'text-slate-400'
                                }`}>
                                    {step.label}
                                </h3>
                                {step.date && (
                                    <p className="font-body text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                                        {new Date(step.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showDispute && order && disputeItem && (
                <DisputeModal
                    order={order}
                    disputeItem={disputeItem}
                    onClose={closeDisputeModal}
                    onSuccess={() => {
                        alert('Issue reported for this item. The seller and GearUp admin were notified. Check notifications for updates.');
                        closeDisputeModal();
                        fetchOrder();
                        fetchOrderDisputes();
                    }}
                />
            )}
            {showInvoice && order && (
                <InvoiceModal
                    order={(() => {
                        let relatedOrders = [];
                        if (order.checkoutGroupId) {
                            relatedOrders = allOrders.filter(o => o.checkoutGroupId === order.checkoutGroupId);
                        } else {
                            const selectedTime = new Date(order.date).getTime();
                            relatedOrders = allOrders.filter(o => 
                                Math.abs(new Date(o.createdAt || o.date).getTime() - selectedTime) < 30000
                            );
                        }

                        if (relatedOrders.length <= 1) return order;

                        const combinedItems = [];
                        let combinedTotalAmount = 0;
                        let combinedPlatformCommission = 0;

                        relatedOrders.forEach(o => {
                            combinedItems.push(...(o.items || []));
                            combinedTotalAmount += (o.totalAmount || 0);
                            combinedPlatformCommission += (o.platformCommissionTotal || 0);
                        });

                        return {
                            ...order,
                            items: combinedItems,
                            totalAmount: combinedTotalAmount,
                            platformCommissionTotal: combinedPlatformCommission,
                            isCombined: true
                        };
                    })()}
                    viewMode="buyer"
                    onClose={() => setShowInvoice(false)}
                />
            )}
        </div>
    );
};

export default WholesalerOrderDetailsPage;
