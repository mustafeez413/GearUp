'use client';

import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminPaymentReviewsPanel from '@/components/admin/panels/AdminPaymentReviewsPanel';
import useAdminDashboardData from '@/hooks/useAdminDashboardData';

export default function AdminPaymentReviewsPage() {
  const { loading, orders, paymentStats, operationsSummary, handleVerify, handleReject } = useAdminDashboardData();

  if (loading) {
    return <div className="h-96 rounded-2xl bg-slate-100 animate-pulse max-w-[1400px] mx-auto w-full" />;
  }

  return (
    <div className="max-w-[1400px] mx-auto w-full px-6">
      <AdminPageShell
        title="Payment Reviews"
        description="Review buyer payment proofs, verify order amounts, and approve or reject submitted payments."
        align="center"
      >
        <AdminPaymentReviewsPanel
          orders={orders}
          paymentStats={paymentStats}
          operationsSummary={operationsSummary}
          onVerify={handleVerify}
          onReject={handleReject}
        />
      </AdminPageShell>
    </div>
  );
}
