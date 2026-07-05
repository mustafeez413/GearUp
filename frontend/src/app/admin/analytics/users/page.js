'use client';

import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminUserGrowthAnalytics from '@/components/admin/analytics/AdminUserGrowthAnalytics';
import useAdminDashboardData from '@/hooks/useAdminDashboardData';

export default function AdminAnalyticsUsersPage() {
  const { loading, usersList } = useAdminDashboardData();

  if (loading) {
    return <div className="h-96 rounded-2xl bg-slate-100 animate-pulse" />;
  }

  return (
    <AdminPageShell
      title="User Growth Analytics"
      description="Registration trends, role distribution, and verification status across platform users."
    >
      <AdminUserGrowthAnalytics usersList={usersList} />
    </AdminPageShell>
  );
}
