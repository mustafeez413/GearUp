"use client";

import { getApiBaseUrl } from '@/lib/api';
import React, { useState, useEffect, useCallback } from 'react';
import {
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Send,
    Lock,
    Unlock,
    ExternalLink,
    Eye,
    ShieldAlert,
    Info,
    X,
    RotateCcw,
    AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { formatPKR } from '@/lib/financeUtils';

const normalizeStatus = (status) => {
    if (!status) return 'Pending';
    const s = String(status).trim().toLowerCase();
    if (s === 'released' || s === 'paid' || s === 'completed' || s === 'paid out') return 'Released';
    if (s === 'holding' || s === 'held') return 'Held';
    if (s === 'failed') return 'Failed';
    if (s === 'cancelled' || s === 'canceled' || s === 'refunded') return 'Cancelled';
    if (s === 'approved' || s === 'pending') return 'Pending';
    return 'Pending';
};

export default function AdminPayoutsPage() {
    const [loading, setLoading] = useState(true);
    const [payouts, setPayouts] = useState([]);
    const [metrics, setMetrics] = useState({
        totalPending: 0,
        totalReleased: 0,
        totalHeld: 0,
        totalFailed: 0
    });
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [releasingId, setReleasingId] = useState(null);
    const [refundingId, setRefundingId] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [actionSuccess, setActionSuccess] = useState(null);

    // Modal states
    const [cancelModalPayout, setCancelModalPayout] = useState(null);
    const [cancellationReason, setCancellationReason] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [cancelling, setCancelling] = useState(false);

    const [viewDetailsPayout, setViewDetailsPayout] = useState(null);

    const fetchPayouts = useCallback(async () => {
        try {
            setLoading(true);
            setActionError(null);
            const token = localStorage.getItem('token');
            const query = new URLSearchParams();
            if (statusFilter && statusFilter !== 'all') query.append('status', statusFilter);
            if (search) query.append('search', search);

            const res = await fetch(`${getApiBaseUrl()}/api/payouts/admin/list?${query.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPayouts(data.data || []);
                if (data.metrics) setMetrics(data.metrics);
            } else {
                setActionError(data.error || 'Failed to fetch payouts list.');
            }
        } catch (err) {
            console.error('[fetch-admin-payouts-err]', err);
            setActionError('Could not connect to server.');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => {
        fetchPayouts();
    }, [fetchPayouts]);

    const handleReleasePayout = async (payout) => {
        if (!confirm(`Are you sure you want to release payment of PKR ${payout.netAmount?.toLocaleString()}?`)) return;

        try {
            setReleasingId(payout._id);
            setActionError(null);
            setActionSuccess(null);
            const token = localStorage.getItem('token');
            const res = await fetch(`${getApiBaseUrl()}/api/payouts/admin/${payout._id}/release`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setActionSuccess(data.message || 'Payout released successfully.');
                fetchPayouts();
            } else {
                setActionError(data.error || 'Failed to release payout.');
            }
        } catch (err) {
            console.error('[release-payout-err]', err);
            setActionError('An error occurred while releasing payout.');
        } finally {
            setReleasingId(null);
        }
    };

    const handleRefundBuyer = async (payout) => {
        if (!confirm(`Are you sure you want to refund this cancelled order to the buyer? This will reverse the payment.`)) return;

        try {
            setRefundingId(payout._id);
            setActionError(null);
            setActionSuccess(null);
            const token = localStorage.getItem('token');
            const res = await fetch(`${getApiBaseUrl()}/api/transactions/admin/refunds`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ orderId: payout.order?._id, reason: 'Admin requested refund for cancelled order' })
            });
            const data = await res.json();
            if (data.success) {
                setActionSuccess('Refund processed successfully.');
                fetchPayouts();
            } else {
                setActionError(data.error || 'Failed to process refund.');
            }
        } catch (err) {
            console.error('[refund-buyer-err]', err);
            setActionError('An error occurred while processing the refund.');
        } finally {
            setRefundingId(null);
        }
    };

    const handleUnholdPayout = async (payoutId) => {
        if (!confirm('Are you sure you want to cancel hold and reset payout status to Pending?')) return;

        try {
            setActionError(null);
            setActionSuccess(null);
            const token = localStorage.getItem('token');
            const res = await fetch(`${getApiBaseUrl()}/api/payouts/admin/${payoutId}/unhold`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setActionSuccess(data.message || 'Hold cancelled successfully.');
                fetchPayouts();
            } else {
                setActionError(data.error || 'Failed to cancel hold.');
            }
        } catch (err) {
            setActionError('Failed to execute unhold action.');
        }
    };

    const handleConfirmCancelPayout = async (e) => {
        e.preventDefault();
        if (!cancellationReason.trim()) {
            alert('Please enter a cancellation reason.');
            return;
        }

        try {
            setCancelling(true);
            setActionError(null);
            setActionSuccess(null);
            const token = localStorage.getItem('token');
            const res = await fetch(`${getApiBaseUrl()}/api/payouts/admin/${cancelModalPayout._id}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    cancellationReason: cancellationReason.trim(),
                    adminNotes: adminNotes.trim()
                })
            });
            const data = await res.json();
            if (data.success) {
                setActionSuccess('Payout cancelled successfully.');
                setCancelModalPayout(null);
                setCancellationReason('');
                setAdminNotes('');
                fetchPayouts();
            } else {
                setActionError(data.error || 'Failed to cancel payout.');
            }
        } catch (err) {
            setActionError('Failed to cancel payout.');
        } finally {
            setCancelling(false);
        }
    };

    return (
        <div className="space-y-8 w-full pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="font-heading text-3xl font-black text-slate-900 tracking-tight">Marketplace Payout Management</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Review, release, and manage Stripe Connect & manual seller payouts</p>
                </div>
                <button
                    onClick={fetchPayouts}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Data
                </button>
            </div>

            {/* Alerts */}
            {actionError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <XCircle size={16} /> {actionError}
                    </div>
                    <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                </div>
            )}
            {actionSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-bold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} /> {actionSuccess}
                    </div>
                    <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-emerald-600"><X size={14} /></button>
                </div>
            )}

            {/* KPI Cards Header */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Pending Release</span>
                    <span className="text-2xl font-extrabold text-amber-600 tracking-tight">{formatPKR(metrics.totalPending)}</span>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Released Payouts</span>
                    <span className="text-2xl font-extrabold text-emerald-600 tracking-tight">{formatPKR(metrics.totalReleased)}</span>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Held Payouts</span>
                    <span className="text-2xl font-extrabold text-purple-600 tracking-tight">{formatPKR(metrics.totalHeld)}</span>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <input
                        type="text"
                        placeholder="Search seller, order ID, or Stripe ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-slate-900 transition-all"
                    />
                    <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Filter size={16} className="text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-slate-900 cursor-pointer"
                    >
                        <option value="all">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Released">Released</option>
                        <option value="Held">Held</option>
                        <option value="Failed">Failed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Payouts Data Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <th className="py-4 px-6">Seller Details</th>
                                <th className="py-4 px-6">Order & Reference</th>
                                <th className="py-4 px-6 text-right">Gross</th>
                                <th className="py-4 px-6 text-right">Commission</th>
                                <th className="py-4 px-6 text-right">Net Payout</th>
                                <th className="py-4 px-6 text-center">Stripe Status</th>
                                <th className="py-4 px-6 text-center">Workflow Status</th>
                                <th className="py-4 px-6 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center text-slate-400 font-medium">
                                        Loading payout records...
                                    </td>
                                </tr>
                            ) : payouts.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center text-slate-400 font-medium">
                                        No payout records match the selected filter.
                                    </td>
                                </tr>
                            ) : (
                                payouts.map(p => {
                                    const seller = p.seller || {};
                                    const order = p.order || {};
                                    const isDisputed = p.disputeHold;
                                    const sellerRole = seller.role || 'seller';
                                    const sellerLink = sellerRole === 'manufacturer' ? '/admin/manufacturers' : '/admin/wholesalers';
                                    const displayStatus = normalizeStatus(p.status);

                                    const orderStatus = order.status ? order.status.toLowerCase() : '';
                                    const isOrderDelivered = orderStatus === 'delivered' || orderStatus === 'completed';
                                    const isOrderCancelled = orderStatus === 'cancelled';

                                    let workflowMessage = "Waiting for Seller Response";
                                    if (isOrderCancelled) {
                                        workflowMessage = "Order Cancelled - Refund Required";
                                        if (String(order.paymentStatus).toLowerCase() === 'refunded') {
                                            workflowMessage = "Order Cancelled - Refund Processed";
                                        }
                                    } else if (displayStatus === 'Released') {
                                        workflowMessage = "Payment Successfully Released";
                                    } else if (orderStatus === 'processing' || orderStatus === 'accepted') {
                                        workflowMessage = "Order is Being Processed";
                                    } else if (orderStatus === 'shipped') {
                                        workflowMessage = "Order Shipped - Waiting for Buyer Confirmation";
                                    } else if (isOrderDelivered) {
                                        workflowMessage = "Order Delivered - Ready for Payment Release";
                                    } else if (orderStatus === 'pending' || orderStatus === 'pending_approval' || orderStatus === 'pending approval' || orderStatus === 'verified' || !orderStatus) {
                                        workflowMessage = "Waiting for Seller Response";
                                    }

                                    return (
                                        <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                                    {seller.name || 'Unknown Seller'}
                                                    <Link href={sellerLink} className="text-slate-400 hover:text-indigo-600" title="View Seller">
                                                        <ExternalLink size={12} />
                                                    </Link>
                                                </div>
                                                <div className="text-[11px] text-slate-400">{seller.email || '—'}</div>
                                                <span className="inline-block mt-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                                    {sellerRole}
                                                </span>
                                            </td>

                                            <td className="py-4 px-6">
                                                <Link href={`/admin/orders`} className="font-mono font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                                    #{order.orderNumber || String(order._id || '').slice(-6).toUpperCase()}
                                                    <ExternalLink size={11} />
                                                </Link>
                                                <span className="font-mono text-[10px] text-slate-400 block truncate max-w-[140px]" title={p.paymentIntentId}>
                                                    {p.paymentIntentId || 'Manual Order'}
                                                </span>
                                            </td>

                                            <td className="py-4 px-6 text-right font-medium text-slate-700">
                                                {formatPKR(p.grossAmount)}
                                            </td>

                                            <td className="py-4 px-6 text-right font-medium text-red-600">
                                                -{formatPKR(p.platformCommission)}
                                            </td>

                                            <td className="py-4 px-6 text-right font-extrabold text-emerald-600 text-sm">
                                                {formatPKR(p.netAmount)}
                                            </td>

                                            <td className="py-4 px-6 text-center">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    seller.stripeAccountStatus === 'Verified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                    seller.stripeAccountStatus === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                    'bg-slate-100 text-slate-600 border border-slate-200'
                                                }`}>
                                                    {seller.stripeAccountStatus || 'Not Connected'}
                                                </span>
                                            </td>

                                            <td className="py-4 px-6 text-center">
                                                {isDisputed ? (
                                                    <span className="inline-flex flex-col items-center gap-1 px-2.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-[10px] font-extrabold uppercase tracking-wider" title={p.disputeHoldReason}>
                                                        <span className="flex items-center gap-1"><ShieldAlert size={12} /> Held Due To Dispute</span>
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                                            displayStatus === 'Released' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                            displayStatus === 'Held' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                                            displayStatus === 'Failed' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                            displayStatus === 'Cancelled' || displayStatus === 'Refunded' ? 'bg-slate-100 text-slate-600 border border-slate-300' :
                                                            'bg-amber-50 text-amber-700 border border-amber-200'
                                                        }`}>
                                                            PAYMENT: {displayStatus}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-700 text-center max-w-[140px] leading-tight">
                                                            {workflowMessage}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-4 px-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* PENDING STATUS ACTIONS */}
                                                    {displayStatus === 'Pending' && !isOrderCancelled && (
                                                        <>
                                                            {isOrderDelivered && (
                                                                <button
                                                                    onClick={() => handleReleasePayout(p)}
                                                                    disabled={isDisputed || releasingId === p._id}
                                                                    className={`px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wider shadow-sm transition-all flex items-center gap-1 ${
                                                                        isDisputed ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                                    }`}
                                                                >
                                                                    {isDisputed ? <Lock size={12} /> : (releasingId === p._id ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />)}
                                                                    Release Payment
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => setViewDetailsPayout(p)}
                                                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                                            >
                                                                <Eye size={14} /> View Details
                                                            </button>

                                                            <button
                                                                onClick={() => setCancelModalPayout(p)}
                                                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 text-red-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                                                title="Cancel Payout"
                                                            >
                                                                <XCircle size={14} /> Cancel Payout
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* HELD STATUS ACTIONS */}
                                                    {displayStatus === 'Held' && !isOrderCancelled && (
                                                        <>
                                                            {isOrderDelivered && (
                                                                <button
                                                                    onClick={() => handleReleasePayout(p)}
                                                                    disabled={isDisputed || releasingId === p._id}
                                                                    className={`px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wider shadow-sm transition-all flex items-center gap-1 ${
                                                                        isDisputed ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                                    }`}
                                                                >
                                                                    {isDisputed ? <Lock size={12} /> : <Send size={12} />}
                                                                    Release Payment
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => handleUnholdPayout(p._id)}
                                                                className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                                                title="Cancel Hold"
                                                            >
                                                                <Unlock size={14} /> Cancel Hold
                                                            </button>

                                                            <button
                                                                onClick={() => setViewDetailsPayout(p)}
                                                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                                            >
                                                                <Eye size={14} /> View Details
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* CANCELLED ACTIONS */}
                                                    {isOrderCancelled && String(order.paymentStatus).toLowerCase() !== 'refunded' && (order.isPaymentVerified || ['paid', 'payment verified', 'verified', 'held'].includes(String(order.paymentStatus).toLowerCase())) && (
                                                        <>
                                                            <button
                                                                onClick={() => handleRefundBuyer(p)}
                                                                disabled={refundingId === p._id}
                                                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] uppercase tracking-wider shadow-sm transition-all flex items-center gap-1 disabled:opacity-50"
                                                            >
                                                                {refundingId === p._id ? <RefreshCw size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                                                                Refund Buyer
                                                            </button>
                                                            <button
                                                                onClick={() => setViewDetailsPayout(p)}
                                                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                                            >
                                                                <Eye size={14} /> View Details
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* FAILED STATUS ACTIONS */}
                                                    {displayStatus === 'Failed' && !isOrderCancelled && (
                                                        <>
                                                            <button
                                                                onClick={() => handleReleasePayout(p)}
                                                                disabled={releasingId === p._id}
                                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] uppercase tracking-wider shadow-sm transition-all flex items-center gap-1 disabled:opacity-50"
                                                            >
                                                                {releasingId === p._id ? <RefreshCw size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                                                                Retry
                                                            </button>

                                                            <button
                                                                onClick={() => setViewDetailsPayout(p)}
                                                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                                            >
                                                                <Eye size={14} /> View Details
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* RELEASED OR CANCELLED STATUS ACTIONS */}
                                                    {(displayStatus === 'Released' || displayStatus === 'Cancelled') && (
                                                        <button
                                                            onClick={() => setViewDetailsPayout(p)}
                                                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                                        >
                                                            <Eye size={14} /> View Details
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CANCEL PAYOUT MODAL */}
            {cancelModalPayout && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
                                <AlertTriangle className="text-red-500" size={20} /> Cancel Payout
                            </h3>
                            <button onClick={() => setCancelModalPayout(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed">
                            Are you sure you want to cancel this payout record for Order <strong className="text-slate-900">#{cancelModalPayout.order?.orderNumber || String(cancelModalPayout.order?._id).slice(-6)}</strong>? The payout record will be marked as Cancelled.
                        </p>

                        <form onSubmit={handleConfirmCancelPayout} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Cancellation Reason <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Duplicate order, Seller request, Incorrect billing"
                                    value={cancellationReason}
                                    onChange={(e) => setCancellationReason(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Admin Notes (Optional)
                                </label>
                                <textarea
                                    rows="3"
                                    placeholder="Internal notes regarding this cancellation..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-900"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setCancelModalPayout(null)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={cancelling}
                                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm disabled:opacity-50"
                                >
                                    {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW DETAILS MODAL */}
            {viewDetailsPayout && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="bg-white rounded-3xl w-[95vw] md:w-[80vw] lg:w-[750px] max-w-[90vw] max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 overflow-hidden">
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-4 sm:py-5 border-b border-slate-100 shrink-0 bg-slate-50/50">
                            <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Info className="text-indigo-600 shrink-0" size={20} /> Payout Record Details
                            </h3>
                            <button
                                type="button"
                                onClick={() => setViewDetailsPayout(null)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body - Scrollable */}
                        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm text-slate-700">
                            {/* Section 1: Payout Information */}
                            <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-100 space-y-3">
                                <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 pb-1.5 border-b border-slate-200/60">
                                    Payout Information
                                </h4>
                                <div className="space-y-2.5 pt-1">
                                    <div className="flex items-center justify-between gap-4 py-1 border-b border-slate-200/40">
                                        <span className="text-slate-500 font-medium shrink-0">Status</span>
                                        <span className="font-bold text-slate-900 text-right">{normalizeStatus(viewDetailsPayout.status)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-1 border-b border-slate-200/40">
                                        <span className="text-slate-500 font-medium shrink-0">Gross Amount</span>
                                        <span className="font-semibold text-slate-800 text-right">{formatPKR(viewDetailsPayout.grossAmount)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-1 border-b border-slate-200/40">
                                        <span className="text-slate-500 font-medium shrink-0">Platform Commission</span>
                                        <span className="font-semibold text-red-600 text-right">-{formatPKR(viewDetailsPayout.platformCommission)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-1">
                                        <span className="text-slate-500 font-medium shrink-0">Net Payout</span>
                                        <span className="font-extrabold text-emerald-600 text-right text-sm sm:text-base">{formatPKR(viewDetailsPayout.netAmount)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Seller Information */}
                            <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-100 space-y-3">
                                <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 pb-1.5 border-b border-slate-200/60">
                                    Seller Information
                                </h4>
                                <div className="space-y-2.5 pt-1">
                                    <div className="flex items-center justify-between gap-4 py-1 border-b border-slate-200/40">
                                        <span className="text-slate-500 font-medium shrink-0">Seller Name</span>
                                        <span className="font-bold text-slate-900 text-right break-words max-w-[65%]">{viewDetailsPayout.seller?.name || '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-1 border-b border-slate-200/40">
                                        <span className="text-slate-500 font-medium shrink-0">Email</span>
                                        <span className="font-medium text-slate-800 text-right break-all max-w-[65%]">{viewDetailsPayout.seller?.email || '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-1">
                                        <span className="text-slate-500 font-medium shrink-0">Seller Type</span>
                                        <span className="font-medium text-slate-800 text-right capitalize">{viewDetailsPayout.seller?.role || viewDetailsPayout.sellerType || '—'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Order Information */}
                            <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-100 space-y-3">
                                <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 pb-1.5 border-b border-slate-200/60">
                                    Order Information
                                </h4>
                                <div className="space-y-2.5 pt-1">
                                    <div className="flex items-center justify-between gap-4 py-1 border-b border-slate-200/40">
                                        <span className="text-slate-500 font-medium shrink-0">Order Number</span>
                                        <span className="font-mono font-bold text-slate-900 text-right break-all">
                                            #{viewDetailsPayout.order?.orderNumber || (viewDetailsPayout.order?._id ? String(viewDetailsPayout.order._id).slice(-6) : '—')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-1 border-b border-slate-200/40">
                                        <span className="text-slate-500 font-medium shrink-0">Payment Method</span>
                                        <span className="font-medium text-slate-800 text-right capitalize">{viewDetailsPayout.order?.paymentMethod || viewDetailsPayout.paymentMethod || '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-1">
                                        <span className="text-slate-500 font-medium shrink-0">Payment Status</span>
                                        <span className="font-semibold text-slate-900 text-right capitalize">{viewDetailsPayout.order?.paymentStatus || viewDetailsPayout.paymentStatus || '—'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Stripe Information */}
                            <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-100 space-y-3">
                                <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 pb-1.5 border-b border-slate-200/60">
                                    Stripe Information
                                </h4>
                                <div className="space-y-2.5 pt-1">
                                    <div className="flex items-center justify-between gap-4 py-1 border-b border-slate-200/40">
                                        <span className="text-slate-500 font-medium shrink-0">Stripe Status</span>
                                        <span className="font-semibold text-slate-800 text-right capitalize">{viewDetailsPayout.seller?.stripeAccountStatus || viewDetailsPayout.stripeStatus || '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-1 border-b border-slate-200/40">
                                        <span className="text-slate-500 font-medium shrink-0">Transfer ID</span>
                                        <span className="font-mono font-bold text-indigo-600 text-right break-all max-w-[65%]">{viewDetailsPayout.transferId || '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-1 border-b border-slate-200/40">
                                        <span className="text-slate-500 font-medium shrink-0">Payout ID</span>
                                        <span className="font-mono font-medium text-slate-700 text-right break-all max-w-[65%]">{viewDetailsPayout.stripePayoutId || viewDetailsPayout.payoutId || viewDetailsPayout._id || '—'}</span>
                                    </div>
                                    {viewDetailsPayout.transferredAmountEur && (
                                        <div className="flex items-center justify-between gap-4 py-1 border-b border-slate-200/40">
                                            <span className="text-slate-500 font-medium shrink-0">Transferred to Stripe</span>
                                            <span className="font-semibold text-indigo-700 text-right">€{Number(viewDetailsPayout.transferredAmountEur).toFixed(2)} EUR</span>
                                        </div>
                                    )}
                                    {viewDetailsPayout.exchangeRateUsed && (
                                        <div className="flex items-center justify-between gap-4 py-1">
                                            <span className="text-slate-500 font-medium shrink-0">Exchange Rate</span>
                                            <span className="font-medium text-slate-800 text-right">1 EUR = {Number(viewDetailsPayout.exchangeRateUsed).toFixed(2)} PKR</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section 5: Timeline */}
                            <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-100 space-y-3">
                                <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 pb-1.5 border-b border-slate-200/60">
                                    Timeline
                                </h4>
                                <div className="space-y-2.5 pt-1">
                                    <div className="flex items-center justify-between gap-4 py-1 border-b border-slate-200/40">
                                        <span className="text-slate-500 font-medium shrink-0">Created At</span>
                                        <span className="font-medium text-slate-800 text-right">{viewDetailsPayout.createdAt ? new Date(viewDetailsPayout.createdAt).toLocaleString() : '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-1 border-b border-slate-200/40">
                                        <span className="text-slate-500 font-medium shrink-0">Released At</span>
                                        <span className="font-medium text-slate-800 text-right">{viewDetailsPayout.releasedAt ? new Date(viewDetailsPayout.releasedAt).toLocaleString() : '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-1">
                                        <span className="text-slate-500 font-medium shrink-0">Updated At</span>
                                        <span className="font-medium text-slate-800 text-right">{viewDetailsPayout.updatedAt ? new Date(viewDetailsPayout.updatedAt).toLocaleString() : '—'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 6: Notes */}
                            <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-100 space-y-3">
                                <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 pb-1.5 border-b border-slate-200/60">
                                    Notes
                                </h4>
                                <div className="space-y-2.5 pt-1">
                                    <div className="flex items-start justify-between gap-4 py-1 border-b border-slate-200/40">
                                        <span className="text-slate-500 font-medium shrink-0 pt-0.5">Reason</span>
                                        <span className="font-medium text-slate-800 text-right break-words max-w-[65%]">{viewDetailsPayout.reason || viewDetailsPayout.cancellationReason || '—'}</span>
                                    </div>
                                    <div className="flex items-start justify-between gap-4 py-1">
                                        <span className="text-slate-500 font-medium shrink-0 pt-0.5">Admin Notes</span>
                                        <span className="font-medium text-slate-800 text-right break-words max-w-[65%]">{viewDetailsPayout.adminNotes || viewDetailsPayout.notes || '—'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end items-center px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
                            <button
                                type="button"
                                onClick={() => setViewDetailsPayout(null)}
                                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-sm transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
