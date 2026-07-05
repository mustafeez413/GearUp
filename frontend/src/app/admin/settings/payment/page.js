'use client';

import AdminPageShell from '@/components/admin/AdminPageShell';
import CommissionSettingsCard from '@/components/admin/CommissionSettingsCard';
import useAdminDashboardData from '@/hooks/useAdminDashboardData';

export default function AdminPaymentSettingsPage() {
  const { loading, commissionEarned } = useAdminDashboardData();

  if (loading) {
    return <div className="h-96 rounded-2xl bg-slate-100 animate-pulse" />;
  }

  return (
    <AdminPageShell
      title="Payment Settings"
      description="Configure payment verification policies, commission rates, and settlement preferences."
    >
      <CommissionSettingsCard totalEarned={commissionEarned} />
    </AdminPageShell>
  );
}
