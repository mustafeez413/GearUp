"use client";

import { getApiBaseUrl } from '@/lib/api';
import React, { useState, useEffect, useCallback } from 'react';
import {
    CreditCard,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Clock,
    RefreshCw,
    ExternalLink,
    DollarSign,
    ShieldCheck,
    Lock,
    TrendingUp,
    FileText
} from 'lucide-react';
import { formatPKR } from '@/lib/financeUtils';

export default function StripeConnectPayoutCard() {
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState(null);
    const [stripeData, setStripeData] = useState(null);
    const [earningsData, setEarningsData] = useState(null);

    const fetchStripeStatus = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            if (!token) return;

            const [statusRes, earningsRes] = await Promise.all([
                fetch(`${getApiBaseUrl()}/api/payouts/stripe-status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${getApiBaseUrl()}/api/payouts/earnings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const statusJson = await statusRes.json();
            const earningsJson = await earningsRes.json();

            if (statusJson.success) {
                setStripeData(statusJson.data);
            }
            if (earningsJson.success) {
                setEarningsData(earningsJson.data);
            }
        } catch (err) {
            console.error('[stripe-connect-fetch-error]', err);
            setError('Failed to sync Stripe account details.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStripeStatus();
    }, [fetchStripeStatus]);

    const handleConnectStripe = async () => {
        try {
            setConnecting(true);
            setError(null);
            const token = localStorage.getItem('token');
            const res = await fetch(`${getApiBaseUrl()}/api/payouts/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success && data.url) {
                window.location.href = data.url;
            } else {
                setError(data.error || 'Failed to generate Stripe onboarding link');
            }
        } catch (err) {
            console.error('[connect-stripe-err]', err);
            setError('Could not connect to Stripe.');
        } finally {
            setConnecting(false);
        }
    };

    const handleOpenDashboard = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${getApiBaseUrl()}/api/payouts/stripe-login`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && data.url) {
                window.open(data.url, '_blank');
            } else {
                setError(data.error || 'Failed to generate dashboard link');
            }
        } catch (err) {
            console.error('[open-dashboard-err]', err);
            setError('Failed to open Stripe Express dashboard.');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Verified':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider"><CheckCircle2 size={14} /> Verified</span>;
            case 'Pending':
            case 'Pending Verification':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold uppercase tracking-wider"><Clock size={14} /> Onboarding Pending</span>;
            case 'Restricted':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs font-bold uppercase tracking-wider"><AlertTriangle size={14} /> Restricted</span>;
            case 'Disabled':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold uppercase tracking-wider"><XCircle size={14} /> Disabled</span>;
            default:
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-bold uppercase tracking-wider">Not Connected</span>;
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm animate-pulse space-y-4">
                <div className="h-6 bg-slate-100 rounded w-1/3"></div>
                <div className="h-20 bg-slate-50 rounded-2xl"></div>
            </div>
        );
    }

    const isConnected = stripeData?.stripeAccountId && stripeData?.stripeAccountStatus !== 'Not Connected';
    const isVerified = stripeData?.stripeAccountStatus === 'Verified';

    return (
        <div className="space-y-8">
            {/* Stripe Account Management Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200/80 p-6 lg:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <h2 className="font-sans text-xl font-bold text-slate-900 tracking-tight">Stripe Connect Marketplace Payouts</h2>
                            <p className="text-xs text-slate-500 font-medium">Automated, direct bank payout account management powered by Stripe Express</p>
                        </div>
                    </div>
                    <div>
                        {getStatusBadge(stripeData?.stripeAccountStatus || 'Not Connected')}
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <XCircle size={16} /> {error}
                    </div>
                )}

                {/* Account Details & Capabilities Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Stripe Account ID</span>
                        <span className="font-mono text-xs font-bold text-slate-800">{stripeData?.stripeAccountId || '—'}</span>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Charges Capability</span>
                        <span className={`text-xs font-bold flex items-center gap-1.5 ${stripeData?.stripeChargesEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {stripeData?.stripeChargesEnabled ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                            {stripeData?.stripeChargesEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Payouts Capability</span>
                        <span className={`text-xs font-bold flex items-center gap-1.5 ${stripeData?.stripePayoutsEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {stripeData?.stripePayoutsEnabled ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                            {stripeData?.stripePayoutsEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Last Synced</span>
                        <span className="text-xs font-bold text-slate-800">
                            {stripeData?.lastStripeSync ? new Date(stripeData.lastStripeSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </span>
                    </div>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-wrap gap-3 pt-2">
                    {!isVerified && (
                        <button
                            type="button"
                            onClick={handleConnectStripe}
                            disabled={connecting}
                            className="px-6 py-3.5 bg-[#00A878] hover:bg-[#009166] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-emerald-500/10 flex items-center gap-2 disabled:opacity-50"
                        >
                            {connecting ? <RefreshCw size={16} className="animate-spin" /> : <CreditCard size={16} />}
                            {isConnected ? 'Complete Onboarding' : 'Connect Stripe Account'}
                        </button>
                    )}

                    {isConnected && (
                        <button
                            type="button"
                            onClick={handleOpenDashboard}
                            className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
                        >
                            <ExternalLink size={16} /> Manage Stripe Dashboard
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={fetchStripeStatus}
                        className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                    >
                        <RefreshCw size={16} /> Refresh Status
                    </button>
                </div>
            </div>

            {/* Earnings Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Available Balance</span>
                    <span className="text-2xl font-extrabold text-emerald-600 tracking-tight">
                        {formatPKR(earningsData?.summary?.availableBalance || 0)}
                    </span>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Pending Balance</span>
                    <span className="text-2xl font-extrabold text-amber-600 tracking-tight">
                        {formatPKR(earningsData?.summary?.pendingBalance || 0)}
                    </span>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Lifetime Earnings</span>
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {formatPKR(earningsData?.summary?.lifetimeEarnings || 0)}
                    </span>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Last Payout</span>
                    <span className="text-lg font-bold text-slate-900 tracking-tight block">
                        {earningsData?.summary?.lastPayout ? formatPKR(earningsData.summary.lastPayout.amount) : '—'}
                    </span>
                    {earningsData?.summary?.lastPayout?.date && (
                        <span className="text-[11px] font-medium text-slate-400 mt-1 block">
                            {new Date(earningsData.summary.lastPayout.date).toLocaleDateString()}
                        </span>
                    )}
                </div>
            </div>

            {/* Payout History Table */}
            <div className="bg-white rounded-[2rem] border border-slate-200/80 p-6 lg:p-8 shadow-sm space-y-6">
                <h3 className="font-sans text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <FileText size={20} className="text-slate-500" /> Recent Payout History
                </h3>

                {(!earningsData?.payouts || earningsData.payouts.length === 0) ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 text-sm font-medium">
                        No payout history records found yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    <th className="pb-3 px-4">Date</th>
                                    <th className="pb-3 px-4">Order</th>
                                    <th className="pb-3 px-4 text-right">Gross</th>
                                    <th className="pb-3 px-4 text-right">Commission</th>
                                    <th className="pb-3 px-4 text-right">Net Amount</th>
                                    <th className="pb-3 px-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {earningsData.payouts.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-4 font-medium text-slate-600">
                                            {new Date(p.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-4 font-mono font-bold text-slate-900">
                                            #{p.orderNumber}
                                        </td>
                                        <td className="py-4 px-4 text-right font-medium text-slate-700">
                                            {formatPKR(p.grossAmount)}
                                        </td>
                                        <td className="py-4 px-4 text-right font-medium text-red-600">
                                            -{formatPKR(p.platformCommission)}
                                        </td>
                                        <td className="py-4 px-4 text-right font-bold text-emerald-600">
                                            {formatPKR(p.netAmount)}
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            {p.disputeHold ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-[10px] font-bold uppercase tracking-wider" title={p.disputeHoldReason}>
                                                    Held Due To Active Dispute
                                                </span>
                                            ) : (
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    p.status === 'Released' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                    p.status === 'Held' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                    p.status === 'Failed' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                    'bg-blue-50 text-blue-700 border border-blue-200'
                                                }`}>
                                                    {p.status}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
