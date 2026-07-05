'use client';

import {
  Banknote,
  Percent,
  Megaphone,
  AlertTriangle,
  Calendar,
  CalendarRange,
  Lock,
} from 'lucide-react';
import { formatPKR } from '@/lib/financeUtils';
import { EnterpriseKpiGrid, EnterpriseKpiTile } from '@/components/admin/ui/EnterpriseKpi';

export default function AdminRevenueOverview({ metrics, trends = {} }) {
  const {
    totalRevenue,
    commissionRevenue,
    advertisementRevenue,
    pendingRevenue,
    todayRevenue,
    monthlyRevenue,
    escrowBalance,
  } = metrics;

  return (
    <div className="space-y-8 max-w-6xl mx-auto w-full">
      <EnterpriseKpiGrid cols="grid-cols-1 md:grid-cols-3">
        <EnterpriseKpiTile
          featured
          label="Total Revenue"
          value={formatPKR(totalRevenue)}
          icon={Banknote}
          trend={trends.monthlyRevenue}
          context="Combined platform revenue across all channels"
        />
        <EnterpriseKpiTile
          featured
          label="Commission Revenue"
          value={formatPKR(commissionRevenue)}
          icon={Percent}
          trend={trends.commissionEarned}
          context="Earned from marketplace order commissions"
        />
        <EnterpriseKpiTile
          featured
          label="Escrow Balance"
          value={formatPKR(escrowBalance)}
          icon={Lock}
          trend={trends.escrowBalance}
          context="Funds currently held in escrow"
        />
      </EnterpriseKpiGrid>

      <EnterpriseKpiGrid>
        <EnterpriseKpiTile
          variant="warning"
          label="Pending Revenue"
          value={formatPKR(pendingRevenue)}
          icon={AlertTriangle}
          context="Outstanding payout obligations"
        />
        <EnterpriseKpiTile
          label="Advertisement Revenue"
          value={formatPKR(advertisementRevenue)}
          icon={Megaphone}
          context="Revenue from sponsored campaigns"
        />
        <EnterpriseKpiTile
          label="Today's Revenue"
          value={formatPKR(todayRevenue)}
          icon={Calendar}
          trend={trends.todayRevenue}
          context="Commission collected today"
        />
        <EnterpriseKpiTile
          label="Monthly Revenue"
          value={formatPKR(monthlyRevenue)}
          icon={CalendarRange}
          trend={trends.monthlyRevenue}
          context="Commission collected this month"
        />
      </EnterpriseKpiGrid>
    </div>
  );
}
