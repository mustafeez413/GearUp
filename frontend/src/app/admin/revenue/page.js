'use client';

import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminRevenueOverview from '@/components/admin/AdminRevenueOverview';
import useAdminDashboardData from '@/hooks/useAdminDashboardData';

export default function AdminRevenuePage() {
  const { loading, revenueMetrics } = useAdminDashboardData();

  if (loading) {
    return <div className="h-96 rounded-2xl bg-slate-100 animate-pulse" />;
  }

  return (
    <AdminPageShell
      title="Revenue"
      description="Platform revenue overview including commission earnings, advertisement income, and pending obligations."
    >
      <AdminRevenueOverview metrics={revenueMetrics} />
    </AdminPageShell>
  );
}
