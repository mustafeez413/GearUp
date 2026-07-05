"use client";

import React from 'react';
import DisputeResolutionCard from '@/components/disputes/DisputeResolutionCard';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const OPEN_STATUSES = ['open', 'awaiting_seller', 'seller_responded', 'under_review', 'investigating'];

export default function DisputesListView({
    title,
    subtitle,
    disputes = [],
    loading,
    role,
    onRefresh,
    emptyTitle = 'No order issues yet',
    emptyHint
}) {
    const openCount = disputes.filter((d) => OPEN_STATUSES.includes(d.status)).length;

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-black text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="text-rose-500" size={28} />
                        {title}
                    </h1>
                    {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
                </div>
                <button
                    type="button"
                    onClick={onRefresh}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-50"
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {openCount > 0 && (
                <div className="px-4 py-3 bg-rose-50 border border-rose-100 rounded-2xl text-sm text-rose-800 font-medium">
                    {openCount} open issue{openCount !== 1 ? 's' : ''} need attention
                </div>
            )}

            {loading ? (
                <p className="text-slate-400 text-sm">Loading order issues…</p>
            ) : disputes.length === 0 ? (
                <div className="dashboard-card text-center py-20 px-6 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{emptyTitle}</h3>
                    {emptyHint && (
                        <p className="text-sm text-slate-500 max-w-[450px] leading-relaxed w-full">
                            {emptyHint}
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {disputes.map((d) => (
                        <DisputeResolutionCard
                            key={d._id}
                            dispute={d}
                            role={role}
                            onRefresh={onRefresh}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
