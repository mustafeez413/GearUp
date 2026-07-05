'use client';

import { useMemo } from 'react';
import {
  Building2,
  Store,
  Package,
  Megaphone,
  ShoppingCart,
  CheckCircle2,
  Banknote,
} from 'lucide-react';
import { formatPKR } from '@/lib/financeUtils';
import { EnterpriseKpiGrid, EnterpriseKpiTile } from '@/components/admin/ui/EnterpriseKpi';

function percentChange(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function countInRange(items, start, end, dateKey = 'createdAt') {
  return items.filter((item) => {
    const when = new Date(item[dateKey]);
    return !Number.isNaN(when.getTime()) && when >= start && when < end;
  }).length;
}

export default function AdminMarketplaceAnalytics({
  manufacturers,
  wholesalers,
  products,
  orders,
  sponsoredAds,
}) {
  const stats = useMemo(() => {
    const totalOrderValue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const completedOrders = orders.filter((o) => ['delivered', 'completed'].includes(o.status)).length;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const ordersThisMonth = countInRange(orders, startOfMonth, now);
    const ordersLastMonth = countInRange(orders, startOfLastMonth, startOfMonth);
    const completedThisMonth = countInRange(
      orders.filter((o) => ['delivered', 'completed'].includes(o.status)),
      startOfMonth,
      now
    );
    const completedLastMonth = countInRange(
      orders.filter((o) => ['delivered', 'completed'].includes(o.status)),
      startOfLastMonth,
      startOfMonth
    );

    const volumeThisMonth = orders
      .filter((o) => {
        const when = new Date(o.createdAt);
        return !Number.isNaN(when.getTime()) && when >= startOfMonth;
      })
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const volumeLastMonth = orders
      .filter((o) => {
        const when = new Date(o.createdAt);
        return !Number.isNaN(when.getTime()) && when >= startOfLastMonth && when < startOfMonth;
      })
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return {
      totalOrderValue,
      completedOrders,
      trends: {
        orders: percentChange(ordersThisMonth, ordersLastMonth),
        completed: percentChange(completedThisMonth, completedLastMonth),
        volume: percentChange(volumeThisMonth, volumeLastMonth),
      },
    };
  }, [orders]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto w-full">
      <EnterpriseKpiGrid cols="grid-cols-1">
        <EnterpriseKpiTile
          featured
          label="Order Volume"
          value={formatPKR(stats.totalOrderValue)}
          icon={Banknote}
          trend={stats.trends.volume}
          context="Total marketplace order value across all transactions"
        />
      </EnterpriseKpiGrid>

      <EnterpriseKpiGrid cols="grid-cols-2 lg:grid-cols-4">
        <EnterpriseKpiTile
          label="Manufacturers"
          value={manufacturers}
          icon={Building2}
          context="Verified manufacturer accounts"
        />
        <EnterpriseKpiTile
          label="Wholesalers"
          value={wholesalers}
          icon={Store}
          context="Active wholesaler accounts"
        />
        <EnterpriseKpiTile
          label="Listed Products"
          value={products}
          icon={Package}
          context="Products available on marketplace"
        />
        <EnterpriseKpiTile
          label="Sponsored Listings"
          value={sponsoredAds}
          icon={Megaphone}
          context="Active sponsored product placements"
        />
      </EnterpriseKpiGrid>

      <EnterpriseKpiGrid cols="grid-cols-1 sm:grid-cols-2">
        <EnterpriseKpiTile
          label="Total Orders"
          value={orders.length}
          icon={ShoppingCart}
          trend={stats.trends.orders}
          context="All marketplace orders recorded"
        />
        <EnterpriseKpiTile
          variant="success"
          label="Completed Orders"
          value={stats.completedOrders}
          icon={CheckCircle2}
          trend={stats.trends.completed}
          context="Successfully fulfilled orders"
        />
      </EnterpriseKpiGrid>
    </div>
  );
}
