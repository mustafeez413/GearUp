'use client';

import { premiumKpiCard } from './escrowTheme';
import { Lock, CheckCircle, Clock, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

function SmartKpi({ label, value, sublabel, icon: Icon, iconTone, trend, trendUp }) {
  return (
    <div className={premiumKpiCard}>
      <div className="flex items-start justify-between gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconTone}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-lg ${
              trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-[#F8FAFC] text-[#64748B]'
            }`}
          >
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-[#64748B]">{label}</p>
        <p className="text-2xl font-semibold tabular-nums text-[#0F172A] mt-1">{value}</p>
        {sublabel && <p className="text-[11px] text-[#94A3B8] mt-1.5">{sublabel}</p>}
      </div>
    </div>
  );
}

export default function EscrowSmartKpis({ walletStats, pendingSettlements, activeDisputes, escrowOrderCount }) {
  const escrowFunds = walletStats?.totalEscrowFunds || 0;
  const released = walletStats?.totalReleasedFunds || 0;

  return (
    <section aria-label="Escrow KPIs" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <SmartKpi
        label="Total Escrow Funds"
        value={`PKR ${escrowFunds.toLocaleString()}`}
        sublabel="Funds currently held in escrow"
        icon={Lock}
        iconTone="bg-emerald-50 text-emerald-700"
        trend={escrowOrderCount ? `${escrowOrderCount} orders` : 'Live balance'}
        trendUp={escrowFunds > 0}
      />
      <SmartKpi
        label="Released Funds"
        value={`PKR ${released.toLocaleString()}`}
        sublabel="Successfully released to sellers"
        icon={CheckCircle}
        iconTone="bg-blue-50 text-blue-700"
        trend="All time"
        trendUp={released > 0}
      />
      <SmartKpi
        label="Pending Settlements"
        value={pendingSettlements}
        sublabel="Awaiting admin release"
        icon={Clock}
        iconTone="bg-amber-50 text-amber-700"
        trend={pendingSettlements > 0 ? 'Action required' : 'Up to date'}
        trendUp={false}
      />
      <SmartKpi
        label="Active Disputes"
        value={activeDisputes}
        sublabel="Open or under investigation"
        icon={AlertTriangle}
        iconTone="bg-red-50 text-red-700"
        trend={activeDisputes > 0 ? 'Review needed' : 'No risks'}
        trendUp={false}
      />
    </section>
  );
}
