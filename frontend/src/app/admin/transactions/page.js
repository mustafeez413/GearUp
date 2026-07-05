'use client';

import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminTransactionsPanel from '@/components/admin/panels/AdminTransactionsPanel';
import useAdminDashboardData from '@/hooks/useAdminDashboardData';

export default function AdminTransactionsPage() {
  const { loading, transactions } = useAdminDashboardData();

  if (loading) {
    return <div className="h-96 rounded-2xl bg-slate-100 animate-pulse" />;
  }

  return (
    <AdminPageShell
      title="Transaction History"
      description="Complete ledger of platform transactions, commissions, and settlement records."
    >
      <AdminTransactionsPanel transactions={transactions} />
    </AdminPageShell>
  );
}
