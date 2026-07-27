"use client";

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import StatCard from './StatCard';
import DashboardSectionHeader from './DashboardSectionHeader';

export interface MetricsData {
    totalSpend: number;
    totalRevenue: number;
    purchaseOrdersCount?: number;
    salesOrdersCount?: number;
    activeOrders: number;
    walletBalance: number | null;
    deliveredOrders: number;
    receivedProducts?: number;
    todaysOrders: number;
    pendingPayment?: number;
}

export interface DashboardMetricsGridProps {
    role: 'manufacturer' | 'wholesaler';
    data: MetricsData;
    loading?: boolean;
    timeLabel?: string;
    growthRates?: { spend?: string; revenue?: string; orders?: string };
}

export default function DashboardMetricsGrid({
    role,
    data,
    loading = false,
    timeLabel = 'vs last month',
    growthRates = { spend: '+0.0%', revenue: '+0.0%', orders: '+0.0%' }
}: DashboardMetricsGridProps) {
    const isManufacturer = role === 'manufacturer';

    // 1. Dynamic Titles & Context Config
    const sectionTitle = isManufacturer ? "Manufacturer Overview" : "Wholesaler Overview";
    const sectionSubtitle = isManufacturer
        ? "Live production, sales metrics, and buyer activity"
        : "Live purchasing metrics and supplier activity";

    const cards = [
        // Card 1: PURCHASE ORDERS / SALES ORDERS
        {
            label: isManufacturer ? "Sales Orders" : "Purchase Orders",
            value: isManufacturer ? (data.salesOrdersCount || 0) : (data.purchaseOrdersCount || 0),
            change: `${growthRates.orders || '+0%'} ${timeLabel}`,
            trend: 'up' as const,
            icon: ShoppingCart,
            color: 'text-indigo-600 bg-indigo-50 border-indigo-100/60',
            href: isManufacturer ? '/manufacturer/orders' : '/wholesaler/orders'
        },
        // Card 2: SECONDARY
        {
            label: isManufacturer ? 'Purchase Orders' : 'Sales Orders',
            value: isManufacturer ? (data.purchaseOrdersCount || 0) : (data.salesOrdersCount || 0),
            change: isManufacturer ? `Procurement` : `${growthRates.orders || '+0%'} ${timeLabel}`,
            trend: isManufacturer ? 'neutral' as const : 'up' as const,
            icon: ShoppingCart,
            color: 'text-blue-600 bg-blue-50 border-blue-100/60',
            href: isManufacturer ? '/manufacturer/purchases' : '/wholesaler/orders'
        }
    ];

    return (
        <section className="flex flex-col space-y-5">
            <DashboardSectionHeader
                title={sectionTitle}
                subtitle={sectionSubtitle}
            />
            {/* 2-card responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {cards.map((card, index) => (
                    <div key={index} className="flex justify-center sm:block">
                        <StatCard
                            label={card.label}
                            value={card.value}
                            change={card.change}
                            trend={card.trend}
                            icon={card.icon}
                            color={card.color}
                            href={card.href}
                            loading={loading}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}
