'use client';

import AdminPageShell from '@/components/admin/AdminPageShell';
import CommissionSettingsCard from '@/components/admin/CommissionSettingsCard';
import useAdminDashboardData from '@/hooks/useAdminDashboardData';

export default function AdminCommissionPage() {
  const { loading, commissionEarned } = useAdminDashboardData();

  if (loading) {
    return <div className="h-96 rounded-2xl bg-slate-100 animate-pulse max-w-6xl mx-auto" />;
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-6">
      <AdminPageShell
        title="Commission Settings"
        description="Configure product commission rates, advertisement commission rules, and platform fee policies."
        align="center"
      >
        <div id="commission-settings">
          <CommissionSettingsCard totalEarned={commissionEarned} />
        </div>
      </AdminPageShell>
    </div>
  );
}
