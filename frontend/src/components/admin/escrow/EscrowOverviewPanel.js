'use client';

import { useMemo } from 'react';
import { chartCard, sectionTitle, innerStatCard } from './escrowTheme';
import {
  ShieldCheck,
  Unlock,
  Scale,
  Lock,
  Activity,
} from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function WorkflowBar({ label, current, total, tone = 'bg-[#10B981]' }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-baseline gap-2 mb-2">
        <span className="text-sm text-[#64748B]">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-[#0F172A]">
          {current} / {total}
          <span className="text-[#94A3B8] font-medium ml-1.5">({pct}%)</span>
        </span>
      </div>
      <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
        <div className={`${tone} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ActivityItem({ icon: Icon, label, time, tone }) {
  return (
    <div className="flex gap-3 items-start py-3 border-b border-[#F1F5F9] last:border-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>
        <Icon size={14} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[#0F172A] leading-snug">{label}</p>
        <p className="text-[11px] text-[#94A3B8] mt-0.5 tabular-nums">{time}</p>
      </div>
    </div>
  );
}

function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EscrowOverviewPanel({ orders, transactions, disputes, walletStats, escrowOrders }) {
  const totalEscrowOrders = escrowOrders.length || 1;

  const verifiedCount = escrowOrders.filter(
    (o) =>
      o.paymentStatus === 'verified' ||
      o.paymentStatus === 'Payment Verified' ||
      o.isPaymentVerified
  ).length;

  const pendingSettlementCount = transactions.filter((t) => t.status === 'Pending').length;
  const openDisputeStatuses = ['open', 'awaiting_seller', 'seller_responded', 'under_review', 'investigating'];
  const disputedCount = disputes.filter((d) => openDisputeStatuses.includes(d.status)).length;

  const monthlyRevenue = useMemo(() => {
    const buckets = Array(12).fill(0);
    transactions.forEach((t) => {
      const d = new Date(t.timestamp || t.createdAt);
      if (!Number.isNaN(d.getTime())) {
        buckets[d.getMonth()] += t.deductedCommission || 0;
      }
    });
    return buckets;
  }, [transactions]);

  const maxRev = Math.max(...monthlyRevenue, 1);
  const currentMonth = new Date().getMonth();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const growthPct =
    monthlyRevenue[lastMonth] > 0
      ? Math.round(((monthlyRevenue[currentMonth] - monthlyRevenue[lastMonth]) / monthlyRevenue[lastMonth]) * 100)
      : monthlyRevenue[currentMonth] > 0
        ? 100
        : 0;

  const recentActivity = useMemo(() => {
    const events = [];

    orders
      .filter((o) => o.paymentStatus === 'verified' || o.isPaymentVerified)
      .slice(0, 8)
      .forEach((o) => {
        events.push({
          id: `v-${o._id}`,
          icon: ShieldCheck,
          label: `Payment verified — Order #${o._id.slice(-6).toUpperCase()}`,
          time: o.updatedAt || o.createdAt,
          tone: 'bg-emerald-50 text-emerald-700',
        });
      });

    transactions
      .filter((t) => t.status === 'Completed')
      .slice(0, 8)
      .forEach((t) => {
        events.push({
          id: `s-${t._id}`,
          icon: Unlock,
          label: `Settlement released — PKR ${(t.sellerAmount || 0).toLocaleString()}`,
          time: t.updatedAt || t.timestamp,
          tone: 'bg-blue-50 text-blue-700',
        });
      });

    disputes.slice(0, 8).forEach((d) => {
      events.push({
        id: `d-${d._id}`,
        icon: Scale,
        label: `Dispute ${d.status?.replace(/_/g, ' ')} — Order #${String(d.order?._id || d.order || '').slice(-6).toUpperCase()}`,
        time: d.createdAt,
        tone: 'bg-amber-50 text-amber-700',
      });
    });

    transactions
      .filter((t) => t.status === 'Pending' || t.status === 'Hold')
      .slice(0, 5)
      .forEach((t) => {
        events.push({
          id: `h-${t._id}`,
          icon: Lock,
          label: `Hold applied — settlement pending`,
          time: t.createdAt,
          tone: 'bg-purple-50 text-purple-700',
        });
      });

    return events.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);
  }, [orders, transactions, disputes]);

  return (
    <div className="space-y-5">
      {walletStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className={innerStatCard}>
            <p className="text-xs text-[#64748B]">Wallet ledger entries</p>
            <p className="text-lg font-semibold tabular-nums mt-1">{walletStats.totalTransactions || 0}</p>
          </div>
          <div className={innerStatCard}>
            <p className="text-xs text-[#64748B]">Refunded</p>
            <p className="text-lg font-semibold tabular-nums mt-1">PKR {(walletStats.totalRefundedFunds || 0).toLocaleString()}</p>
          </div>
          <div className={innerStatCard}>
            <p className="text-xs text-[#64748B]">Seller available</p>
            <p className="text-lg font-semibold tabular-nums mt-1">PKR {(walletStats.totalAvailableToSellers || 0).toLocaleString()}</p>
          </div>
          <div className={innerStatCard}>
            <p className="text-xs text-[#64748B]">Platform revenue (view)</p>
            <p className="text-lg font-semibold tabular-nums mt-1">
              PKR {transactions.reduce((s, t) => s + (t.deductedCommission || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${chartCard} lg:col-span-2`}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-5">
            <div>
              <h3 className={sectionTitle}>Revenue trend</h3>
              <p className="text-xs text-[#64748B] mt-1">Platform commission by month (from transaction data)</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold tabular-nums ${growthPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {growthPct >= 0 ? '+' : ''}
                {growthPct}% vs last month
              </p>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">
                {MONTHS[currentMonth]}: PKR {monthlyRevenue[currentMonth].toLocaleString()}
              </p>
            </div>
          </div>
          <div className="h-44 flex items-end gap-1.5">
            {monthlyRevenue.map((amount, i) => {
              const h = Math.max(4, (amount / maxRev) * 100);
              return (
                <div key={i} className="flex-1 min-w-0 flex flex-col items-center gap-1 group">
                  <div
                    className="w-full bg-[#10B981]/15 hover:bg-[#10B981]/30 rounded-t-md transition-colors duration-150 relative"
                    style={{ height: `${h}%` }}
                    title={`${MONTHS[i]}: PKR ${amount.toLocaleString()}`}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-[#64748B] opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                      PKR {amount.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[9px] text-[#94A3B8]">{MONTHS[i].slice(0, 1)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={chartCard}>
          <h3 className={`${sectionTitle} flex items-center gap-2 mb-4`}>
            <Activity size={16} className="text-[#64748B]" />
            Recent activity
          </h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-[#64748B] py-6 text-center">No recent escrow activity yet.</p>
          ) : (
            <div>{recentActivity.map((ev) => <ActivityItem key={ev.id} {...ev} time={formatTime(ev.time)} />)}</div>
          )}
        </div>
      </div>

      <div className={chartCard}>
        <h3 className={`${sectionTitle} mb-5`}>Escrow workflow status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <WorkflowBar label="Verified Payments" current={verifiedCount} total={totalEscrowOrders} tone="bg-emerald-500" />
          <WorkflowBar
            label="Pending Settlements"
            current={pendingSettlementCount}
            total={Math.max(transactions.length, 1)}
            tone="bg-amber-500"
          />
          <WorkflowBar label="Disputed Transactions" current={disputedCount} total={Math.max(disputes.length, 1)} tone="bg-red-500" />
        </div>
      </div>
    </div>
  );
}
