"use client";

import React, { useMemo } from 'react';
import { Banknote, ShoppingCart, Activity, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Skeleton from '@/components/common/Skeleton';
import { formatPKR, getUserFinancialMetrics } from '@/lib/financeUtils';
import { isOrderInTimeRange } from '@/lib/dashboardUtils';
import { resolveUserId } from '@/lib/dashboardAnalytics';

const FinancialInsights = ({ orders = [], user, timeRange, loading = false, refundRecords = [] }) => {
    const kpiData = useMemo(() => {
        const filtered = orders.filter((o) => isOrderInTimeRange(o.createdAt, timeRange));
        const userId = resolveUserId(user);
        const financials = getUserFinancialMetrics(filtered, userId, refundRecords, timeRange);
        const totalSalesVal = financials.totalRevenue;
        const totalPurchasesVal = financials.totalSpend;

        return [
            {
                label: 'Total sales',
                value: totalSalesVal,
                icon: Banknote,
                accent: 'border-t-[#00b96b]',
                iconBg: 'bg-[#ecfdf5] text-[#00b96b]',
                href: '/manufacturer/analytics?tab=sales'
            },
            {
                label: 'Total purchases',
                value: totalPurchasesVal,
                icon: ShoppingCart,
                accent: 'border-t-[#2563eb]',
                iconBg: 'bg-[#eff6ff] text-[#2563eb]',
                href: '/manufacturer/analytics?tab=purchases'
            },
            {
                label: 'Gross profit',
                value: totalSalesVal - totalPurchasesVal,
                icon: Activity,
                accent: 'border-t-[#00A878]',
                iconBg: 'bg-[#E8FFF5] text-[#00A878]',
                href: '/manufacturer/analytics?tab=profit'
            }
        ];
    }, [orders, timeRange, user, refundRecords]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <Skeleton key={i} variant="stat" />)}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {kpiData.map((kpi, idx) => {
                const Icon = kpi.icon;
                return (
                    <Link href={kpi.href} key={idx} className="block group outline-none focus-visible:ring-2 focus-visible:ring-[#00A878]/40 rounded-[10px]">
                        <div className={`seller-kpi border-t-4 ${kpi.accent} p-5`}>
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">{kpi.label}</span>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.iconBg}`}>
                                    <Icon size={20} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-[#1a2332] mt-3">{formatPKR(kpi.value)}</p>
                            <span className="text-[11px] font-semibold text-[#00A878] mt-3 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                View report <ArrowRight size={12} />
                            </span>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

export default React.memo(FinancialInsights);
