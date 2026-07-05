'use client';

import { Suspense, useState, useEffect } from 'react';
import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminOverviewCommandCenter from '@/components/admin/AdminOverviewCommandCenter';
import QuickActionsCard from '@/components/dashboard/QuickActionsCard';
import Link from 'next/link';
import useAdminDashboardData from '@/hooks/useAdminDashboardData';

function AnimatedBadge({ badge, idx }) {
  const [displayValue, setDisplayValue] = useState(badge.count);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (badge.count !== displayValue) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 300);
      setDisplayValue(badge.count);
      return () => clearTimeout(timer);
    }
  }, [badge.count, displayValue]);

  const isDanger = badge.type === 'danger';
  const baseColors = isDanger 
    ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 hover:shadow-[0_8px_30px_rgba(239,68,68,0.25)]'
    : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/30 hover:shadow-[0_8px_30px_rgba(245,158,11,0.25)]';

  const dotColor = isDanger ? 'bg-red-500' : 'bg-amber-500';

  return (
    <div
      className={`group relative inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-[13px] font-semibold border backdrop-blur-md cursor-default transition-all duration-300 hover:-translate-y-[2px] hover:scale-[1.02] hover:brightness-110 animate-in fade-in slide-in-from-bottom-3 ${baseColors}`}
      style={{ animationFillMode: 'both', animationDelay: `${idx * 100}ms` }}
    >
      <div className="relative flex items-center justify-center">
        <span className={`absolute w-2 h-2 rounded-full animate-ping opacity-40 ${dotColor}`} style={{ animationDuration: '3s' }} />
        <span className={`relative w-2 h-2 rounded-full ${dotColor} shadow-[0_0_8px_currentColor] group-hover:shadow-[0_0_12px_currentColor] transition-shadow duration-300`} />
      </div>
      
      <span className="flex items-center gap-1.5 tracking-wide">
        <span className={`inline-block tabular-nums transition-all duration-300 ${pulse ? 'scale-125 text-white drop-shadow-md' : 'scale-100 drop-shadow-none'}`}>
          {displayValue}
        </span>
        <span className="opacity-90">{badge.label}</span>
      </span>
    </div>
  );
}

function AdminDashboardContent() {
  const { loading, overviewMetrics } = useAdminDashboardData();

  if (loading) {
    return (
      <div className="space-y-6 w-full animate-pulse">
        <div className="h-24 bg-slate-100 rounded-2xl w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = overviewMetrics || {};

  const dynamicAlerts = [];
  if (metrics.pendingBusinessVerifications > 0) {
    dynamicAlerts.push({ message: `${metrics.pendingBusinessVerifications} verification request${metrics.pendingBusinessVerifications > 1 ? 's' : ''} waiting 48+ hours`, tone: 'amber' });
  }
  if (metrics.pendingPayouts > 0) {
    dynamicAlerts.push({ message: `${metrics.pendingPayouts} payout${metrics.pendingPayouts > 1 ? 's' : ''} pending 3+ days`, tone: 'amber' });
  }
  if (metrics.pendingPaymentReviews > 0) {
    dynamicAlerts.push({ message: `${metrics.pendingPaymentReviews} escrow payment review${metrics.pendingPaymentReviews > 1 ? 's' : ''} pending`, tone: 'rose' });
  }

  const finalMetrics = {
    ...metrics,
    priorityAlerts: metrics.priorityAlerts?.length > 0 ? metrics.priorityAlerts : dynamicAlerts
  };

  return (
    <div className="w-full min-w-0 animate-in fade-in duration-300 slide-in-from-bottom-2">
      <div className="max-w-[1280px] mx-auto space-y-16">
        <section className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-8 min-w-0">
              <div
                className="relative flex flex-col justify-center rounded-[24px] p-[28px] sm:p-[36px] min-h-[220px] md:min-h-[240px] lg:min-h-[280px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-visible group transition-all duration-500 hover:shadow-[0_24px_60px_rgba(0,0,0,0.2)]"
                style={{ background: 'linear-gradient(135deg, #07141A 0%, #062B20 100%)' }}
              >
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[24px]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_25%,rgba(0,168,150,0.18),transparent_42%),radial-gradient(circle_at_8%_85%,rgba(0,168,150,0.06),transparent_38%)] mix-blend-overlay"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#031A1F] via-[#031A1F]/80 to-transparent z-[5]"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#031A1F]/40 via-transparent to-transparent z-[5]"></div>
                </div>
                <img 
                  src="/dashboard/fakhar-zaman-banner.png" 
                  alt="Fakhar Zaman" 
                  className="absolute bottom-0 right-4 h-[95%] w-auto object-contain hidden lg:block transition-all duration-500 scale-100 group-hover:scale-105 z-[8] pointer-events-none" 
                  style={{
                    maskImage: 'linear-gradient(to right, transparent 45%, black 85%)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent 45%, black 85%)'
                  }}
                />

                <div className="relative z-[10] flex flex-col w-full lg:w-[65%] animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-[12px] font-semibold text-[#a7f3d0] shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300 hover:bg-white/10 hover:border-[#00A878]/40 hover:shadow-[0_4px_16px_rgba(0,168,120,0.15)] cursor-default">
                      GEARUP ADMIN
                    </span>
                  </div>

                  <h1 className="text-[32px] sm:text-[36px] lg:text-[44px] font-[800] text-white tracking-tight leading-tight mb-3">
                    Platform Operations Command Center
                  </h1>

                  <p className="text-[15px] sm:text-[16px] leading-relaxed mb-8 font-medium" style={{ color: 'rgba(255,255,255,0.85)', maxWidth: '720px' }}>
                    Manage approvals, payments, payouts, disputes, advertisements, escrow operations, and marketplace health from one centralized command center.
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    {[
                      { label: 'Pending Actions', count: (metrics.pendingBusinessVerifications || 0) + (metrics.pendingPaymentReviews || 0) + (metrics.pendingPayouts || 0) + (metrics.activeDisputes || 0) + (metrics.pendingAdvertisements || 0), type: 'danger' },
                      { label: 'Payment Reviews', count: metrics.pendingPaymentReviews || 0, type: 'warning' },
                      { label: 'Verifications', count: metrics.pendingBusinessVerifications || 0, type: 'warning' },
                      { label: 'Payout Requests', count: metrics.pendingPayouts || 0, type: 'warning' },
                      { label: 'Ad Approvals', count: metrics.pendingAdvertisements || 0, type: 'warning' }
                    ].map((badge, idx) => (
                      <AnimatedBadge key={idx} badge={badge} idx={idx} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 min-w-0">
              <QuickActionsCard
                actions={[
                  { label: 'Manage Users', route: '/admin/users' },
                  { label: 'Manage Products', route: '/admin/products' },
                  { label: 'Manage Advertisements', route: '/admin/advertisements' },
                  { label: 'Commission Settings', route: '/admin/commission' },
                ]}
              />
            </div>
          </div>
        </section>

        <AdminOverviewCommandCenter metrics={finalMetrics} />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Loading dashboard…</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
