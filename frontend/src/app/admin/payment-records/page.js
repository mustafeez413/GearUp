'use client';

import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminPaymentRecordsPanel from '@/components/admin/panels/AdminPaymentRecordsPanel';
import useAdminDashboardData from '@/hooks/useAdminDashboardData';

export default function AdminPaymentRecordsPage() {
  const { loading, payoutsList, handleMarkPaid } = useAdminDashboardData();

  if (loading) {
    return <div className="h-96 rounded-2xl bg-slate-100 animate-pulse max-w-[1400px] mx-auto w-full" />;
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-6">
      <AdminPageShell
        title="Payment Records"
        description="Settlement records for seller payouts. Transfer funds manually, then mark transactions as paid."
        align="center"
      >
        <AdminPaymentRecordsPanel payoutsList={payoutsList} onMarkPaid={handleMarkPaid} />
      </AdminPageShell>
    </div>
  );
}
