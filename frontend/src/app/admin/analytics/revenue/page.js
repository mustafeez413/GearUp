'use client';

import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminRevenueOverview from '@/components/admin/AdminRevenueOverview';
import useAdminDashboardData from '@/hooks/useAdminDashboardData';
import Link from 'next/link';
import { AD_SYSTEM_ENABLED } from '@/lib/advertisingConfig';

export default function AdminAnalyticsRevenuePage() {
  const { loading, revenueMetrics, overviewMetrics } = useAdminDashboardData();

  if (loading) {
    return <div className="h-96 rounded-2xl bg-slate-100 animate-pulse max-w-6xl mx-auto" />;
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-6">
      <AdminPageShell
        title="Revenue Analytics"
        description="Detailed revenue breakdowns and commission performance metrics."
        align="center"
        actions={
          AD_SYSTEM_ENABLED ? (
            <Link
              href="/admin/advertisements/revenue"
              className="text-[13px] font-semibold text-[#10B981] hover:text-[#059669] transition-colors"
            >
              Advertisement revenue details →
            </Link>
          ) : null
        }
      >
        <AdminRevenueOverview
          metrics={revenueMetrics}
          trends={overviewMetrics.financialTrends}
        />
      </AdminPageShell>
    </div>
  );
}
