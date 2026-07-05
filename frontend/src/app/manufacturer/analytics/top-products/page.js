"use client";
import React from 'react';
import EmptyState from '@/components/common/EmptyState';
import { TrendingUp } from 'lucide-react';

export default function TopProductsPage() {
    return (
            <div className="p-6 max-w-7xl mx-auto w-full">
                <div className="mb-8">
                    <h1 className="font-heading text-2xl font-bold text-[#0F172A]">Top Products Analytics</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Discover your best-selling items and product performance metrics.</p>
                </div>
                <div className="bg-white rounded-[20px] border border-slate-200 p-10 min-h-[500px] flex items-center justify-center shadow-sm">
                    <EmptyState 
                        icon={TrendingUp} 
                        title="Insufficient Sales Data" 
                        message="Not enough sales history to determine top products yet. Drive more sales to unlock these insights." 
                    />
                </div>
            </div>
    );
}
