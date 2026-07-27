"use client";

import React from 'react';
import StripeConnectPayoutCard from '@/components/payouts/StripeConnectPayoutCard';

const PayoutSettingsPage = () => {
    return (
        <div className="space-y-8 w-full animate-in fade-in duration-500 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b border-slate-100 pb-5">
                <div>
                    <h1 className="font-heading text-3xl font-black text-[#0F172A] tracking-tight">Payout Settings</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1 max-w-xl leading-relaxed">
                        Manage your Stripe Connect Express account and view payout history.
                    </p>
                </div>
            </div>

            {/* Stripe Connect Card & Earnings Section */}
            <StripeConnectPayoutCard />
        </div>
    );
};

export default PayoutSettingsPage;
