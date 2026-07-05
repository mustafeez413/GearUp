'use client';

import { useMemo, useState } from 'react';
import DisputeResolutionCard from '@/components/disputes/DisputeResolutionCard';
import { sectionTitle, sectionSubtitle, innerStatCard, btnOutline } from './escrowTheme';
import { Scale, AlertTriangle, Clock, CheckCircle, Filter } from 'lucide-react';

const OPEN = ['open', 'awaiting_seller', 'seller_responded'];
const REVIEW = ['under_review', 'investigating'];
const RESOLVED = ['refunded', 'rejected', 'resolved'];

function disputePriority(status) {
  if (REVIEW.includes(status)) return { label: 'High', cls: 'bg-red-50 text-red-700 border-red-200' };
  if (OPEN.includes(status)) return { label: 'Medium', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'Low', cls: 'bg-slate-50 text-slate-600 border-slate-200' };
}

function resolutionProgress(status) {
  if (RESOLVED.includes(status)) return 100;
  if (REVIEW.includes(status)) return 65;
  if (status === 'seller_responded') return 50;
  if (status === 'awaiting_seller') return 35;
  return 20;
}

export default function EscrowDisputesPanel({ disputes, onRefresh }) {
  const [filter, setFilter] = useState('all');

  const buckets = useMemo(
    () => ({
      open: disputes.filter((d) => OPEN.includes(d.status)),
      review: disputes.filter((d) => REVIEW.includes(d.status)),
      resolved: disputes.filter((d) => RESOLVED.includes(d.status)),
    }),
    [disputes]
  );

  const filtered = useMemo(() => {
    if (filter === 'open') return [...buckets.open, ...buckets.review];
    if (filter === 'review') return buckets.review;
    if (filter === 'resolved') return buckets.resolved;
    return disputes;
  }, [disputes, filter, buckets]);

  const filters = [
    { id: 'all', label: 'All', count: disputes.length },
    { id: 'open', label: 'Open', count: buckets.open.length + buckets.review.length },
    { id: 'review', label: 'Under review', count: buckets.review.length },
    { id: 'resolved', label: 'Resolved', count: buckets.resolved.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${sectionTitle} flex items-center gap-2`}>
          <Scale size={18} className="text-[#64748B]" />
          Dispute resolution center
        </h2>
        <p className={sectionSubtitle}>
          Review claims, message parties, and process refunds — marketplace A-to-Z style resolution.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={innerStatCard}>
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <AlertTriangle size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Open</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums">{buckets.open.length}</p>
        </div>
        <div className={innerStatCard}>
          <div className="flex items-center gap-2 text-blue-700 mb-2">
            <Clock size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Under review</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums">{buckets.review.length}</p>
        </div>
        <div className={innerStatCard}>
          <div className="flex items-center gap-2 text-emerald-700 mb-2">
            <CheckCircle size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Resolved</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums">{buckets.resolved.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Filter size={14} className="text-[#94A3B8]" />
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              filter === f.id
                ? 'bg-[#0F172A] text-white border-[#0F172A]'
                : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]'
            }`}
          >
            {f.label}
            <span className="opacity-70 tabular-nums">{f.count}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]/50 px-6 py-14 text-center">
          <Scale size={28} className="mx-auto text-[#94A3B8] mb-3" />
          <p className="text-base font-semibold text-[#0F172A]">No disputes in this view</p>
          <p className="text-sm text-[#64748B] mt-2 max-w-md mx-auto">
            When buyers report order issues, they will appear here for review and resolution.
          </p>
          <button type="button" onClick={() => setFilter('all')} className={`${btnOutline} mt-4`}>
            Show all disputes
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((d) => {
            const pri = disputePriority(d.status);
            const progress = resolutionProgress(d.status);
            return (
              <div key={d._id} className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 px-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${pri.cls}`}>
                    {pri.label} priority
                  </span>
                  <span className="text-xs text-[#64748B] tabular-nums">Resolution {progress}%</span>
                  <div className="flex-1 min-w-[120px] max-w-[200px] h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div className="h-full bg-[#10B981] rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <DisputeResolutionCard dispute={d} role="admin" onRefresh={onRefresh} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
