'use client';

import { chartCard, sectionTitle, innerStatCard } from './escrowTheme';
import { Lock, CheckCircle, RotateCcw, Activity, TrendingUp } from 'lucide-react';

function InnerStat({ label, value, icon: Icon }) {
  return (
    <div className={innerStatCard}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-sm text-[#64748B]">{label}</p>
        {Icon && <Icon size={15} className="text-[#94A3B8]" />}
      </div>
      <p className="text-lg font-semibold tabular-nums text-[#0F172A]">{value}</p>
    </div>
  );
}

function WorkflowBar({ label, current, total, tone = 'bg-[#10B981]' }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-[#64748B]">{label}</span>
        <span className="font-medium tabular-nums text-[#0F172A]">{current} / {total} ({pct}%)</span>
      </div>
      <div className="w-full bg-[#F1F5F9] rounded-full h-2">
        <div className={`${tone} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function EscrowDashboardPanel({ metrics, operationsSummary }) {
  if (!metrics) {
    return <p className="text-sm text-[#64748B]">Loading escrow metrics…</p>;
  }

  const total = metrics.total || 0;
  const refundedOrders = operationsSummary?.refundedOrders ?? metrics.refundedOrders ?? metrics.refunded ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <InnerStat label="Total Escrow Funds" value={`PKR ${(metrics.totalEscrowFunds || 0).toLocaleString()}`} icon={Lock} />
        <InnerStat label="Active Escrows" value={String(metrics.active || 0)} icon={Activity} />
        <InnerStat label="Released Escrows" value={String(metrics.released || 0)} icon={CheckCircle} />
        <InnerStat label="Refunded To Buyer" value={String(refundedOrders)} icon={RotateCcw} />
        <InnerStat label="Escrow Success Rate" value={`${metrics.successRate || 0}%`} icon={TrendingUp} />
        <InnerStat label="Open Disputes" value={String(metrics.openDisputes || 0)} icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={chartCard}>
          <h3 className={`${sectionTitle} mb-4`}>Escrow Lifecycle</h3>
          <div className="space-y-4">
            <WorkflowBar
              label="Active + Settled Escrows"
              current={(metrics.active || 0) + (metrics.released || 0) + (metrics.refunded || 0)}
              total={total}
            />
            <WorkflowBar label="Released → Seller Paid" current={metrics.released || 0} total={total} tone="bg-emerald-500" />
            <WorkflowBar label="Refunded To Buyer" current={metrics.refunded || 0} total={total} tone="bg-slate-400" />
          </div>
        </div>

        <div className={chartCard}>
          <h3 className={`${sectionTitle} mb-4`}>Fund Distribution</h3>
          <div className="space-y-3 text-sm">
            <FundRow label="Funds In Escrow" value={metrics.totalEscrowFunds} tone="text-amber-700" />
            <FundRow label="Funds Released" value={metrics.totalReleasedFunds} tone="text-emerald-700" />
            <FundRow label="Funds Refunded" value={metrics.totalRefundedFunds} tone="text-slate-600" />
          </div>
          <div className="mt-5 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[13px] text-[#64748B] leading-relaxed">
            <strong className="text-[#0F172A]">Successful flow:</strong> Order Created → Payment Verified → Escrow Active → Order Delivered → Buyer Confirmation → Escrow Released → Seller Paid Automatically.
          </div>
        </div>
      </div>
    </div>
  );
}

function FundRow({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0">
      <span className="text-[#64748B]">{label}</span>
      <span className={`font-bold tabular-nums ${tone}`}>PKR {(value || 0).toLocaleString()}</span>
    </div>
  );
}
