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
    const wallet = o.paymentMethod === 'platform_wallet';
    const verified = o.isPaymentVerified || o.paymentStatus === 'verified';
    const at = (keys) => (keys.includes(st) ? (o.updatedAt || o.createdAt) : null);

    if (wallet) {
        return [
            { label: 'Order Placed', completed: true, date: o.createdAt },
            { label: 'Wallet Payment', completed: verified, date: verified ? o.createdAt : null },
            { label: 'Processing', completed: ['processing', 'shipped', 'delivered', 'completed'].includes(st), date: at(['processing', 'shipped', 'delivered', 'completed']) },
            { label: 'Shipped', completed: ['shipped', 'delivered', 'completed'].includes(st), date: at(['shipped', 'delivered', 'completed']) },
            { label: 'Received', completed: ['delivered', 'completed'].includes(st), date: at(['delivered', 'completed']) }
        ];
    }

    return [
        { label: 'Proof Uploaded', completed: !!o.paymentProof, date: o.paymentProof ? (o.updatedAt || o.createdAt) : null },
        { label: 'Payment Verified', completed: verified, date: verified ? (o.updatedAt || o.createdAt) : null },
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

    const handleConfirmDelivery = async () => {
        if (!confirm("Confirm you received all items? This completes the order on your side.")) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${getApiBaseUrl()}/api/orders/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: 'completed' })
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

    const canDisputeItems = isOrderBuyer && DISPUTABLE_ORDER_STATUSES.includes(order.status?.toLowerCase());

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
        if (!canDisputeItems) return false;
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
        const orderStatus = order.status?.toLowerCase();
        if (orderStatus === 'delivered') {
            return { label: 'Delivered', className: 'text-emerald-700 bg-emerald-50 border-emerald-100' };
        }
        if (orderStatus === 'completed') {
            return { label: 'Completed', className: 'text-emerald-700 bg-emerald-50 border-emerald-100' };
        }
        return { label: order.status, className: 'text-emerald-700 bg-emerald-50 border-emerald-100' };
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
        if (order.paymentMethod === 'platform_wallet') {
            if (order.paymentStatus === 'verified' || order.isPaymentVerified) {
                return 'Paid via wallet';
            }
            return 'Wallet payment pending';
        }
        if (order.paymentStatus === 'verified' || order.paymentStatus === 'completed') {
            return 'Payment verified';
        }
        if (order.paymentStatus === 'pending_approval') {
            return 'Pending approval';
        }
        return 'Payment pending';
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20">
            {/* Top Nav */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/wholesaler/orders"
                        className="group flex items-center gap-2 p-2 px-4 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:text-emerald-600 hover:border-emerald-500 transition-all font-body font-bold text-xs uppercase tracking-widest shadow-sm"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Purchase History
                    </Link>
                        <button
                            type="button"
                            onClick={() => setShowInvoice(true)}
                            className="group flex items-center gap-2 p-2 px-4 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:text-emerald-600 hover:border-emerald-500 transition-all font-body font-bold text-xs uppercase tracking-widest shadow-sm cursor-pointer"
                        >
                            View Invoice
                        </button>
                    {order && ['shipped', 'processing'].includes(order.status?.toLowerCase()) && (
                        <button
                            type="button"
                            onClick={handleConfirmDelivery}
                            className="group flex items-center gap-2 p-2 px-4 bg-emerald-600 border border-emerald-500 rounded-2xl text-white hover:bg-emerald-700 transition-all font-body font-bold text-xs uppercase tracking-widest shadow-sm cursor-pointer"
                        >
                            <CheckCircle2 size={16} /> Confirm Delivery
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="font-body text-[10px] font-black uppercase text-emerald-700 tracking-[0.2em] italic">Order View Active</span>
                </div>
            </div>

            {/* Hero Header */}
            <div className="bg-white rounded-[3rem] border border-slate-100 p-10 lg:p-14 shadow-xl shadow-slate-200/50">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-10">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusConfig.color}`}>
                                {order.status?.toLowerCase() === 'delivered' ? 'Received' : order.status}
                            </div>
                            <span className="font-mono text-xs text-slate-300 font-bold tracking-tighter uppercase italic">Ref: {order._id}</span>
                        </div>
                        <h1 className="font-heading text-5xl font-black text-slate-900 tracking-tighter leading-tight mb-4">
                            {order.product}
                        </h1>
                        <div className="flex flex-wrap gap-6 text-slate-500 font-body font-bold text-sm tracking-tight">
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-emerald-500" />
                                {new Date(order.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                            </div>
                            <div className="flex items-center gap-2">
                                <Hash size={18} className="text-emerald-500" />
                                {order.quantity} Units Bulk volume
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-auto p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl">
                        <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Order Total</div>
                        <div className="font-heading text-4xl font-black tracking-tighter text-emerald-400">PKR {order.total.toLocaleString()}</div>
                        <div className="mt-6 flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                <CheckCircle2 size={14} /> {getPaymentLabel()}
                            </div>
                            {order.transactionReference && (
                                <div className="text-[10px] text-white/40 font-mono">Ref: {order.transactionReference}</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-10 mt-14 pt-10 border-t border-slate-50">
                    {/* Logistic Data */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-900 border border-slate-100">
                                <Truck size={20} />
                            </div>
                            <h3 className="font-heading text-xl font-bold tracking-tight text-slate-900">Shipment Vectors</h3>
                        </div>

                        <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                            <div className="flex items-start gap-4">
                                <MapPin className="text-emerald-500 mt-1" size={20} />
                                <div>
                                    <div className="font-body text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination Address</div>
                                    <p className="font-body font-bold text-slate-700 leading-relaxed text-sm">
                                        {order.shippingAddress}
                                        {order.shippingCity && `, ${order.shippingCity}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <Building2 className="text-emerald-500 mt-1" size={20} />
                                <div>
                                    <div className="font-body text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Suppliers</div>
                                    <p className="font-body font-bold text-slate-700 leading-relaxed text-sm">
                                        {order.sellers.map((s) => s.name).join(', ') || 'Authorized Suppliers'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Item Manifest */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-900 border border-slate-100">
                                <Package size={20} />
                            </div>
                            <h3 className="font-heading text-xl font-bold tracking-tight text-slate-900">SKU Manifest</h3>
                        </div>

                        <div className="space-y-3">
                            {order.items.map((item, i) => {
                                const itemStatus = getItemStatusPresentation(item);

                                return (
                                <div key={getOrderItemProductId(item) || i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
                                            <img
                                                src={resolveProductImageUrl(item.product?.images?.[0] || item.image)}
                                                alt={item.product?.name || item.name || 'Order item'}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-heading font-bold text-slate-900 text-sm">{item.product?.name || item.name}</div>
                                            <div className="font-body text-[10px] text-slate-400 font-black uppercase tracking-widest">{item.quantity} {item.bulkUnit === 'Dozen' ? (item.quantity > 1 ? 'Dozens' : 'Dozen') : (item.bulkUnit || 'Pack') + (item.quantity > 1 ? 's' : '')} x PKR {item.price?.toLocaleString()}</div>
                                            <span className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${itemStatus.className}`}>
                                                {itemStatus.label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="font-heading font-black text-slate-900">PKR {(item.quantity * item.price).toLocaleString()}</div>
                                        {canFileDisputeForItem(item) && (
                                            <button
                                                type="button"
                                                onClick={() => openDisputeForItem(item)}
                                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-rose-100 rounded-2xl text-rose-500 hover:text-white hover:bg-rose-500 transition-all font-body font-bold text-[10px] uppercase tracking-widest shadow-sm"
                                            >
                                                <AlertCircle size={14} /> File Dispute
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                </div>
            </div>

            {orderDisputes.length > 0 && (
                <div className="space-y-4">
                    <h2 className="font-heading text-xl font-bold text-slate-900">Your dispute</h2>
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
            <div className="bg-white rounded-[3rem] border border-slate-100 p-10 lg:p-14 shadow-xl shadow-slate-200/50">
                <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight mb-14">Order Tracking</h2>
                <div className="grid md:grid-cols-5 gap-4 relative">
                    <div className="absolute top-8 left-0 w-full h-0.5 bg-slate-50 hidden md:block"></div>
                    {order.tracking.map((step, index) => (
                        <div key={index} className="relative z-10 flex flex-col items-center md:items-start group">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-4 border-white shadow-2xl transition-all duration-500 ${step.completed ? 'bg-emerald-600 text-white scale-110 rotate-12' : 'bg-slate-50 text-slate-200'
                                }`}>
                                {step.completed ? <CheckCircle size={24} /> : <div className="w-3 h-3 rounded-full bg-slate-200" />}
                            </div>
                            <div className="mt-8 text-center md:text-left">
                                <h3 className={`font-heading text-sm font-bold tracking-tight group-hover:text-emerald-600 transition-colors ${step.completed ? 'text-slate-900' : 'text-slate-300'}`}>
                                    {step.label}
                                </h3>
                                {step.date && (
                                    <p className="font-body text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
                                        {new Date(step.date).toLocaleDateString()}
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
