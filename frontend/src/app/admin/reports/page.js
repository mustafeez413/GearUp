'use client';

import AdminPageShell from '@/components/admin/AdminPageShell';
import useAdminDashboardData from '@/hooks/useAdminDashboardData';

export default function AdminReportsPage() {
  const { loading, transactions, disputes, overviewMetrics } = useAdminDashboardData();

  if (loading) {
    return <div className="h-96 rounded-2xl bg-slate-100 animate-pulse" />;
  }

  const logs = [
    { label: 'Pending verifications', value: overviewMetrics.pendingBusinessVerifications },
    { label: 'Payment reviews queued', value: overviewMetrics.pendingPaymentReviews },
    { label: 'Open disputes', value: overviewMetrics.openDisputes },
    { label: 'Total transactions logged', value: transactions.length },
    { label: 'Platform products', value: overviewMetrics.products },
  ];

  return (
    <AdminPageShell
      title="Reports & Logs"
      description="Operational summary and platform activity indicators for audit and monitoring."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {logs.map((log) => (
          <div key={log.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{log.label}</p>
            <p className="text-2xl font-black text-slate-900 mt-2 tabular-nums">{log.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Dispute activity</h3>
        <p className="text-sm text-slate-600">
          {disputes.length} total dispute record{disputes.length !== 1 ? 's' : ''} on file.
          {' '}
          <a href="/admin/disputes" className="text-[#00A878] font-bold hover:underline">
            View disputes center →
          </a>
        </p>
      </div>
    </AdminPageShell>
  );
}
