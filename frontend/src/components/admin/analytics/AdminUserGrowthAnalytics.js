'use client';

import { useMemo } from 'react';

function StatBlock({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-2xl font-black text-slate-900 mt-2 tabular-nums">{value}</p>
    </div>
  );
}

export default function AdminUserGrowthAnalytics({ usersList }) {
  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonth = usersList.filter((u) => new Date(u.createdAt) >= startOfMonth).length;
    const lastMonth = usersList.filter((u) => {
      const d = new Date(u.createdAt);
      return d >= startOfLastMonth && d < startOfMonth;
    }).length;

    const manufacturers = usersList.filter((u) => u.role === 'manufacturer').length;
    const wholesalers = usersList.filter((u) => u.role === 'wholesaler').length;
    const verified = usersList.filter((u) => u.verificationStatus === 'approved').length;
    const suspended = usersList.filter((u) => u.isBlocked).length;

    return { thisMonth, lastMonth, manufacturers, wholesalers, verified, suspended, total: usersList.length };
  }, [usersList]);

  const growthPct =
    stats.lastMonth > 0
      ? Math.round(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100)
      : stats.thisMonth > 0
        ? 100
        : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock label="Total Users" value={stats.total} />
        <StatBlock label="New This Month" value={stats.thisMonth} />
        <StatBlock label="New Last Month" value={stats.lastMonth} />
        <StatBlock label="Month-over-Month" value={`${growthPct >= 0 ? '+' : ''}${growthPct}%`} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock label="Manufacturers" value={stats.manufacturers} />
        <StatBlock label="Wholesalers" value={stats.wholesalers} />
        <StatBlock label="Verified Businesses" value={stats.verified} />
        <StatBlock label="Suspended Accounts" value={stats.suspended} />
      </div>
    </div>
  );
}
