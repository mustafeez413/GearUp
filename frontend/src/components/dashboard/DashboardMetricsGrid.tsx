import React from 'react';
import {
    ShoppingCart,
    Banknote,
    Clock,
    AlertCircle,
    CheckCircle2,
    Calendar,
    TrendingUp,
    Wallet
} from 'lucide-react';
import StatCard from './StatCard';
import DashboardSectionHeader from './DashboardSectionHeader';
import { formatPKR } from '@/lib/financeUtils';

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
    pendingPayment: number;
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

        // Card 1: PURCHASE ORDERS (Primary for Wholesaler) / SALES ORDERS (Primary for Mfg)
        {
            label: isManufacturer ? "Sales Orders" : "Purchase Orders",
            value: isManufacturer ? (data.salesOrdersCount || 0) : (data.purchaseOrdersCount || 0),
            change: `${growthRates.orders || '+0%'} ${timeLabel}`,
            trend: 'up',
            icon: ShoppingCart,
            color: 'text-indigo-600 bg-indigo-50 border-indigo-100/60',
            href: isManufacturer ? '/manufacturer/orders' : '/wholesaler/orders'
        },
        // Card 2: SECONDARY (Purchase for Mfg, Sales for Wholesaler)
        {
            label: isManufacturer ? 'Purchase Orders' : 'Sales Orders',
            value: isManufacturer ? (data.purchaseOrdersCount || 0) : (data.salesOrdersCount || 0),
            change: isManufacturer ? `Procurement` : `${growthRates.orders || '+0%'} ${timeLabel}`,
            trend: isManufacturer ? 'neutral' : 'up',
            icon: ShoppingCart,
            color: 'text-blue-600 bg-blue-50 border-blue-100/60',
            href: isManufacturer ? '/manufacturer/purchases' : '/wholesaler/orders'
        },
        // Card 4: ACTIVE ORDERS
        {
            label: 'Active Orders',
            value: data.activeOrders,
            change: 'Live pipeline',
            trend: 'up',
            icon: Clock,
            color: 'text-amber-600 bg-amber-50 border-amber-100/60',
            href: isManufacturer ? '/manufacturer/orders' : '/wholesaler/orders'
        },
        /* Card 5: WALLET BALANCE (Disconnected)
        {
            label: 'Wallet Balance',
            value: data.walletBalance != null ? formatPKR(data.walletBalance) : '…',
            change: 'Platform wallet',
            trend: 'up',
            icon: Wallet,
            color: 'text-teal-600 bg-teal-50 border-teal-100/60',
            href: isManufacturer ? '/manufacturer/transactions' : '/wholesaler/transactions'
        },
        */
        // Card 6: DELIVERED
        {
            label: 'Delivered',
            value: data.deliveredOrders,
            change: timeLabel,
            trend: 'up',
            icon: CheckCircle2,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-100/60',
            href: isManufacturer ? '/manufacturer/orders' : '/wholesaler/orders'
        },
        // Card 6b: RECEIVED PRODUCT
        {
            label: 'Received Product',
            value: data.receivedProducts || 0,
            change: timeLabel,
            trend: 'up',
            icon: CheckCircle2,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-100/60',
            href: isManufacturer ? '/manufacturer/purchases' : '/wholesaler/orders'
        },
        // Card 7: TODAY'S ORDERS
        {
            label: "Today's Orders",
            value: data.todaysOrders,
            change: 'vs yesterday',
            trend: 'neutral',
            icon: Calendar,
            color: 'text-purple-600 bg-purple-50 border-purple-100/60',
            href: isManufacturer ? '/manufacturer/orders' : '/wholesaler/orders'
        },
        // Card 8: PENDING PAYMENT
        {
            label: 'Pending Payment',
            value: data.pendingPayment,
            change: 'Awaiting verification',
            trend: 'down',
            icon: AlertCircle,
            color: 'text-rose-600 bg-rose-50 border-rose-100/60',
            href: isManufacturer ? '/manufacturer/orders' : '/wholesaler/orders'
        }
    ];

    return (
        <section className="flex flex-col space-y-5">
            <DashboardSectionHeader
                title={sectionTitle}
                subtitle={sectionSubtitle}
            />
            {/* Clean 6-card responsive grid: 1 col on mobile, 2 on sm, 3 on lg */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
