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
    AlertCircle,
    CreditCard,
    ArrowRight,
    Activity,
    ShieldCheck,
    Mail,
    Phone,
    User,
    ExternalLink,
    FileText,
    Info,
    Check
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import InvoiceModal from '@/components/shared/InvoiceModal';
import { formatPKR } from '@/lib/financeUtils';
import { resolveProductImageUrl } from '@/lib/marketplaceData';

const OrderDetailsPage = ({ params }) => {
    const resolvedParams = React.use(params);
    const { id } = resolvedParams;
    const router = useRouter();
    const { user } = useAuth();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showInvoice, setShowInvoice] = useState(false);

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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || `Server error (${response.status})`);
            }

            if (data.success && data.data) {
                const o = data.data;
                const uid = (user?.id || user?._id)?.toString();
                const refId = (ref) => (ref?._id || ref)?.toString();

                const isDirectOwner = refId(o.manufacturer) === uid;
                const isSellerOnOrder =
                    isDirectOwner ||
                    (o.items || []).some((item) => refId(item.seller) === uid) ||
                    (o.sellerStats || []).some((s) => refId(s.seller) === uid);

                if (!isSellerOnOrder) {
                    throw new Error('You are not authorized to view this sales order.');
                }

                const manufacturerItems = (o.items || []).filter(
                    (item) => isDirectOwner || refId(item.seller) === uid
                );

                const myStats = o.sellerStats?.find(
                    (s) => isDirectOwner || refId(s.seller) === uid
                );

                const itemsForView = manufacturerItems.length > 0 ? manufacturerItems : (o.items || []);

                const mappedOrder = {
                    _id: o._id || '',
                    product: itemsForView[0]?.product?.name || itemsForView[0]?.name || 'Bulk Order',
                    items: itemsForView,
                    quantity: itemsForView.reduce((acc, i) => acc + (i.quantity || 0), 0) || 0,
                    total: myStats?.subtotal || itemsForView.reduce((acc, i) => acc + (i.price * i.quantity), 0),
                    overallTotal: o.totalAmount,
                    status: myStats?.status || o.status || 'pending',
                    overallStatus: o.status,
                    date: o.createdAt || new Date().toISOString(),
                    updatedAt: o.updatedAt || o.createdAt || new Date().toISOString(),
                    buyer: o.buyer?.name || 'Enterprise Buyer',
                    buyerRole: o.buyer?.role || 'wholesaler',
                    buyerEmail: o.buyer?.email || 'sales@gearuptrade.com',
                    buyerPhone: o.buyer?.businessDetails?.phone || o.shippingAddress?.phone || '+92 300 1234567',
                    company: o.buyer?.businessDetails?.companyName || o.buyer?.businessDetails?.businessName || 'Wholesale Trading Corp',
                    address: o.shippingAddress?.address || 'Chamber 4B, Sector I-9 Industrial Area',
                    city: o.shippingAddress?.city || 'Islamabad',
                    phone: o.shippingAddress?.phone || '+92 51 9876543',
                    paymentStatus: o.paymentStatus || 'pending',
                    paymentProof: o.paymentProof || null,
                    transactionReference: o.transactionReference || '',
                };
                setOrder(mappedOrder);
            } else {
                throw new Error(data.error || 'The requested order could not be located.');
            }
        } catch (err) {
            setError(err.message || 'A network error occurred.');
        } finally {
            setLoading(false);
        }
    }, [id, user?.id, user?._id]);

    useEffect(() => {
        if (id) fetchOrder();
    }, [id, fetchOrder]);

    const handleUpdateStatus = async (newStatus) => {
        try {
            setUpdatingStatus(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${getApiBaseUrl()}/api/orders/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await response.json();
            if (data.success) {
                fetchOrder();
            } else {
                alert(data.error || 'Failed to update order status');
            }
        } catch (err) {
            alert('Communication loss during status update.');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleVerifyPayment = async (status) => {
        try {
            setUpdatingStatus(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${getApiBaseUrl()}/api/orders/${id}/payment`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ paymentStatus: status })
            });
            const data = await response.json();
            if (data.success) {
                fetchOrder();
            } else {
                alert(data.error || 'Verification failed');
            }
        } catch (err) {
            alert('Connection failure.');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const getStatusTheme = (status) => {
        const themes = {
            'Pending Payment': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: Clock, label: 'Pending Payment' },
            'Pending Approval': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', icon: Activity, label: 'Pending Approval' },
            'Payment Verified': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: ShieldCheck, label: 'Payment Held In Escrow' },
            'Order Confirmed': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: CheckCircle2, label: 'Order Confirmed' },
            'Processing': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', icon: Package, label: 'Processing' },
            'Shipped': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', icon: Truck, label: 'Shipped' },
            'Completed': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: CheckCircle2, label: 'Completed' },
            'Cancelled': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', icon: AlertCircle, label: 'Cancelled' },
            'pending': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: Clock, label: 'Pending Payment' },
            'pending_approval': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', icon: Activity, label: 'Pending Approval' },
            'verified': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: ShieldCheck, label: 'Payment Held In Escrow' },
            'processing': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', icon: Package, label: 'Processing' },
            'shipped': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', icon: Truck, label: 'Shipped' },
            'delivered': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: CheckCircle2, label: 'Delivered' },
            'cancelled': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', icon: AlertCircle, label: 'Cancelled' }
        };
        return themes[status] || themes[status?.toLowerCase()] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100', icon: Clock, label: status };
    };

    const getProductImage = (item) =>
        resolveProductImageUrl(item.product?.image || item.product?.images?.[0] || item.image);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="flex flex-col items-center">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-slate-900 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="mt-6 font-body text-xs font-bold text-slate-500 tracking-wider">Loading Order Details...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-[400px] min-w-[300px] bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-md mx-auto">
                    <AlertCircle className="text-red-500 mx-auto mb-4" size={40} />
                    <h1 className="font-heading text-xl font-bold text-slate-900 mb-2">Order Not Located</h1>
                    <p className="text-xs text-slate-400 font-semibold mb-6">{error || 'This record does not exist or has been archived.'}</p>
                    <Link href="/manufacturer/orders" className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white rounded-lg font-body font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors whitespace-nowrap">Back to Orders</Link>
                </div>
            </div>
        );
    }

    const theme = getStatusTheme(order.status);
    const StatusIcon = theme.icon;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-16 font-body text-slate-800">
            
            {/* Header Sticky Bar */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs">
                <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
                    <Link href="/manufacturer/orders" className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-950 transition-colors">
                        <ChevronLeft size={16} /> Back to Orders
                    </Link>
                    <div className="flex items-center gap-2">
                        {order && (
                            <button
                                type="button"
                                onClick={() => setShowInvoice(true)}
                                className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-xl cursor-pointer transition-all"
                            >
                                <FileText size={12} /> View Invoice
                            </button>
                        )}
                        <span className="font-mono text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            ID: {order._id.slice(-8).toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 mt-6">
                
                {/* 1. ORDER SUMMARY SECTION */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="font-heading text-2xl font-black text-slate-900 tracking-tight mb-1">
                                Order #{order._id.slice(-8).toUpperCase()}
                            </h2>
                            <p className="text-xs text-slate-400 font-semibold">
                                Placed on {new Date(order.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full ${theme.bg} ${theme.text} ${theme.border} border font-body font-black text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-sm`}>
                                <StatusIcon size={12} /> {theme.label}
                            </span>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Amount</span>
                                <span className="font-heading font-black text-slate-950 text-xl">
                                    {formatPKR(order.total)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2 COLUMN LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* LEFT COLUMN: Wholesaler & Products */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* 2. WHOLESALER DETAILS */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                                <h3 className="font-heading text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <User size={16} className="text-slate-500" /> {order.buyerRole === 'manufacturer' ? 'Manufacturer/Buyer Details' : 'Wholesaler Details'}
                                </h3>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border leading-none ${
                                    order.buyerRole === 'manufacturer'
                                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                }`}>
                                    {order.buyerRole}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Contact Person</span>
                                    <span className="font-bold text-slate-800 text-xs">{order.buyer}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Company Name</span>
                                    <span className="font-bold text-slate-850 text-xs">{order.company}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Phone Number</span>
                                    <a href={`tel:${order.buyerPhone}`} className="font-semibold text-xs text-slate-700 hover:text-slate-950 transition-colors block">{order.buyerPhone}</a>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Email Address</span>
                                    <a href={`mailto:${order.buyerEmail}`} className="font-semibold text-xs text-slate-700 hover:text-slate-950 transition-colors block truncate">{order.buyerEmail}</a>
                                </div>
                                <div className="md:col-span-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Delivery Destination</span>
                                    <span className="font-semibold text-xs text-slate-700 leading-normal block">
                                        {order.address}, {order.city}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 3. PRODUCT DETAILS */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
                            <h3 className="font-heading text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                                <Package size={16} className="text-slate-500" /> Items Manifest
                            </h3>
                            <div className="divide-y divide-slate-100">
                                {order.items.map((item, idx) => {
                                    const img = getProductImage(item);
                                    return (
                                        <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                                            {img ? (
                                                <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-100 shrink-0">
                                                    <img src={img} alt={item.name} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                                    <Box className="text-slate-400" size={16} />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-heading font-black text-slate-900 tracking-tight text-sm truncate">{item.name}</h4>
                                                <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                                    <span>SKU: {item.product?._id?.slice(-6).toUpperCase() || 'N/A'}</span>
                                                    <span>Rate: {formatPKR(item.price)}</span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ordered</div>
                                                <div className="font-heading font-black text-slate-900 text-xs">
                                                    {item.quantity} <span className="text-[9px] text-slate-400 font-semibold">{item.bulkUnit || 'Units'}</span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 min-w-[80px]">
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subtotal</div>
                                                <div className="font-heading font-black text-slate-900 text-xs">
                                                    {formatPKR(item.quantity * item.price)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Actions, Shipping, Payment Proof */}
                    <div className="space-y-6">
                        
                        {/* 6. ACTION BUTTONS */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
                            <h3 className="font-heading text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                                <Activity size={16} className="text-slate-500" /> Actions
                            </h3>
                            <div className="space-y-3">
                                {['Pending Approval', 'pending_approval', 'pending approval'].includes(order.paymentStatus) && (
                                    <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg flex items-start gap-2">
                                        <Activity size={16} className="mt-0.5 shrink-0" />
                                        <span className="font-body text-xs font-medium leading-relaxed">
                                            <strong>Escrow Hold:</strong> Waiting for Admin Verification of buyer's payment. Order details will be unlocked once approved.
                                        </span>
                                    </div>
                                )}

                                {['pending'].includes((order.status || '').toLowerCase()) && !['pending_approval', 'pending approval'].includes((order.paymentStatus || '').toLowerCase()) && (
                                    <button 
                                        disabled={updatingStatus} 
                                        onClick={() => handleUpdateStatus('processing')} 
                                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-heading font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                        1. Accept order
                                    </button>
                                )}

                                {['processing'].includes((order.status || '').toLowerCase()) && (
                                    <button 
                                        disabled={updatingStatus} 
                                        onClick={() => handleUpdateStatus('shipped')} 
                                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-heading font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                        2. Mark as shipped
                                    </button>
                                )}

                                {['shipped'].includes((order.status || '').toLowerCase()) && (
                                    <button 
                                        disabled={updatingStatus} 
                                        onClick={() => handleUpdateStatus('delivered')} 
                                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-heading font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                        3. Mark as delivered (releases wallet)
                                    </button>
                                )}

                                {['Completed', 'completed', 'delivered'].includes(order.status) && (
                                    <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg flex items-center gap-2">
                                        <CheckCircle2 size={16} />
                                        <span className="font-heading font-bold text-xs">Order completed and archived.</span>
                                    </div>
                                )}

                                {!['Completed', 'completed', 'delivered', 'Cancelled', 'cancelled'].includes(order.status) && (
                                    <button 
                                        disabled={updatingStatus} 
                                        onClick={() => handleUpdateStatus('cancelled')} 
                                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-400 border border-slate-150 rounded-lg font-body font-bold text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                        Cancel Order
                                    </button>
                                )}
                            </div>
                        </div>


                    </div>

                </div>

            </div>
            {showInvoice && order && (
                <InvoiceModal
                    order={order}
                    viewMode="seller"
                    sellerId={user?.id || user?._id}
                    onClose={() => setShowInvoice(false)}
                />
            )}
        </div>
    );
};

export default OrderDetailsPage;
