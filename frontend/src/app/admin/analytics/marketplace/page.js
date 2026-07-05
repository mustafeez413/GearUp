'use client';

import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminMarketplaceAnalytics from '@/components/admin/analytics/AdminMarketplaceAnalytics';
import useAdminDashboardData from '@/hooks/useAdminDashboardData';

export default function AdminAnalyticsMarketplacePage() {
  const { loading, orders, overviewMetrics } = useAdminDashboardData();

  if (loading) {
    return <div className="h-96 rounded-2xl bg-slate-100 animate-pulse max-w-6xl mx-auto" />;
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-6">
      <AdminPageShell
        title="Marketplace Analytics"
        description="Marketplace health metrics including sellers, products, orders, and listing performance."
        align="center"
      >
        <AdminMarketplaceAnalytics
          manufacturers={overviewMetrics.manufacturers}
          wholesalers={overviewMetrics.wholesalers}
          products={overviewMetrics.products}
          orders={orders}
          sponsoredAds={overviewMetrics.sponsoredAds}
        />
      </AdminPageShell>
    </div>
  );
}
