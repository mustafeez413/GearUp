'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { formatRelativeTime } from '@/hooks/useAdminDashboardData';
import {
  ShieldCheck,
  CreditCard,
  Wallet,
  Megaphone,
  Scale,
  Clock,
  ChevronRight,
  AlertTriangle,
  Building2,
  Store,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  Landmark,
  Banknote,
  Receipt,
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

/* ─── Primitives ─────────────────────────────────────────── */

function formatDashboardMoney(amount) {
  if (amount === undefined || amount === null || Number.isNaN(amount)) return 'PKR 0';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    return `PKR ${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 10_000) {
    return `PKR ${(abs / 1_000).toFixed(1)}K`;
  }
  return `PKR ${abs.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function SectionHeader({ title, subtitle, chips = [], className = 'mb-8', align = 'left' }) {
  const isCenter = align === 'center';
  const isStacked = align === 'stacked';
  return (
    <div className={`w-full ${className}`}>
      <div className={`flex flex-col ${isCenter ? 'items-center text-center' : isStacked ? 'gap-4' : 'gap-4 lg:flex-row lg:items-end lg:justify-between'}`}>
        <div className={`min-w-0 ${isCenter ? 'flex flex-col items-center' : ''}`}>
          <h2 className="text-[22px] font-bold text-[#0F172A] tracking-tight">{title}</h2>
          {subtitle ? (
            <p className={`text-[14px] text-[#64748B] max-w-3xl leading-relaxed ${isCenter ? 'mt-3' : 'mt-1.5'}`}>{subtitle}</p>
          ) : null}
        </div>
        {chips.length > 0 ? (
          <div className={`flex flex-wrap items-center gap-2 ${isCenter ? 'mt-5 justify-center' : isStacked ? 'mt-1' : 'lg:shrink-0'}`}>
            {chips.map((chip) => (
              <span
                key={chip.key || chip.label}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${chip.className || 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'}`}
              >
                {chip.value !== undefined && chip.value !== null && chip.value !== '' ? (
                  <span className="font-semibold text-inherit">{chip.value}</span>
                ) : null}
                {chip.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ActionCenterRow({
  title,
  description,
  count,
  countLabel = 'Pending',
  href,
  icon: Icon,
  priority = 'low',
}) {
  const priorityStyles = {
    high: 'bg-[#FEF3C7] border border-[#FCD34D] text-[#B45309]',
    medium: 'bg-[#CCFBF1] border border-[#5EEAD4] text-[#0F766E]',
    low: 'bg-[#F1F5F9] border border-[#CBD5E1] text-[#64748B]',
  };
  
  const priorityLabel = priority.charAt(0).toUpperCase() + priority.slice(1);

  return (
    <Link
      href={href}
      className="group flex flex-row items-center justify-between gap-4 border border-transparent border-b-[#E2E8F0] px-5 py-3.5 last:border-b-transparent transition-all duration-200 hover:bg-[#F8FAFC] hover:shadow-[0_4px_12px_rgba(14,165,164,0.06)] hover:border-[#0EA5A4]/30 hover:rounded-xl hover:z-10 relative bg-[#FFFFFF]"
    >
      <div className="flex flex-1 items-center gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#F8FAFC] text-[#475569] transition-colors group-hover:bg-[#FFFFFF] border border-[#E2E8F0] group-hover:border-[#0EA5A4]/30">
          <Icon size={18} strokeWidth={2} />
        </div>

        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-3">
            <p className="text-[18px] font-semibold text-[#0F172A] leading-snug">{title}</p>
            {priority && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${priorityStyles[priority]}`}>
                {priorityLabel}
              </span>
            )}
          </div>
          <p className="text-[14px] font-normal text-[#475569] mt-0.5 leading-relaxed truncate sm:whitespace-normal">{description}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 justify-end text-right">
        <span className="text-[16px] font-bold text-[#0F172A]">
          {count} {countLabel}
        </span>
        <ChevronRight
          size={18}
          strokeWidth={2.5}
          className="text-[#94A3B8] transition-all duration-200 group-hover:text-[#0EA5A4] group-hover:translate-x-1"
        />
      </div>
    </Link>
  );
}

function FinanceKpiTile({ label, value, trend, icon: Icon, isPrimary = false }) {
  const hasData = trend !== undefined && trend !== null && trend !== 0 && trend !== -100;
  const isPositive = trend >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  
  const emptyStates = ['New Metric', 'Awaiting Comparison', 'Insufficient History'];
  const emptyStateText = emptyStates[label.length % emptyStates.length];

  return (
    <div className={`group relative flex flex-col justify-between rounded-[20px] p-6 transition-all duration-300 bg-[#FFFFFF] hover:-translate-y-[2px] hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)] ${
      isPrimary 
        ? 'border border-[#14B8A6]/30 shadow-[0_4px_20px_rgba(20,184,166,0.04)] hover:border-[rgba(20,184,166,0.4)]' 
        : 'border border-[#E2E8F0] shadow-[0_2px_10px_rgba(15,23,42,0.02)] hover:border-[rgba(20,184,166,0.20)]'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-[14px] transition-colors duration-300 ${
          isPrimary ? 'bg-[rgba(20,184,166,0.12)] border border-[rgba(20,184,166,0.25)] text-[#0F766E]' : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] group-hover:bg-[#FFFFFF]'
        }`}>
          {Icon && <Icon size={18} strokeWidth={2} />}
        </div>
        <p className="text-[14px] font-medium text-[#475569]">{label}</p>
      </div>
      
      <div className="mt-1">
        <p className="font-bold tracking-tight leading-none break-words text-[28px] text-[#0F172A]">
          {value}
        </p>
        
        <div className="mt-4 flex items-center min-h-[24px]">
          {hasData ? (
            <div className="flex items-center gap-2">
              <div
                className={`inline-flex items-center gap-1 text-[12px] font-bold tabular-nums px-2 py-0.5 rounded-md ${
                  isPositive ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#FEF2F2] text-[#EF4444]'
                }`}
              >
                <TrendIcon size={14} strokeWidth={2.5} />
                <span>{Math.abs(trend)}%</span>
              </div>
              <span className="text-[12px] font-medium text-[#64748B]">vs last period</span>
            </div>
          ) : (
            <span className="text-[12px] font-medium text-[#64748B]">{emptyStateText}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function HealthKpiCard({ label, value, icon: Icon, iconBg, iconColor, trend, trendLabel, positive = true, sparklineColor = '#10B981' }) {
  const sparklineData = positive
    ? [
        { v: 20 },
        { v: 24 },
        { v: 22 },
        { v: 28 },
        { v: 26 },
        { v: 32 },
        { v: 35 },
        { v: 38 },
        { v: 40 },
        { v: 42 },
      ]
    : [
        { v: 42 },
        { v: 40 },
        { v: 38 },
        { v: 35 },
        { v: 32 },
        { v: 26 },
        { v: 28 },
        { v: 22 },
        { v: 24 },
        { v: 20 },
      ];

  return (
    <div className="group relative flex min-h-[190px] flex-col justify-between rounded-[28px] border border-[#F0F0F1] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-all duration-250 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)] overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className={`grid h-12 w-12 place-items-center rounded-[18px] ${iconBg} ${iconColor}`}>
          <Icon size={24} strokeWidth={1.5} />
        </div>
        <div className={`rounded-full px-3 py-1 text-[12px] font-semibold whitespace-nowrap ${positive ? 'bg-[#ECFDF5] text-[#047857]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}>
          {trendLabel}
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-[32px] font-extrabold text-[#0F172A] tracking-tight leading-none">{value}</p>
        <p className="text-[13px] text-[#64748B] mt-2 font-medium">{label}</p>
      </div>

      <div className="mt-4 h-12">
        <ResponsiveContainer width="100%" height={48}>
          <LineChart data={sparklineData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <Line type="monotone" dataKey="v" stroke={sparklineColor} dot={false} strokeWidth={2} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AlertRow({ message, time, type = 'warning' }) {
  let accentColor = 'border-l-[#3B82F6]';
  let iconClass = 'text-[#3B82F6] bg-[#EFF6FF]';
  let badgeText = 'Info';
  let badgeBg = 'bg-[#EFF6FF] text-[#2563EB]';

  if (type === 'critical') {
    accentColor = 'border-l-[#EF4444]';
    iconClass = 'text-[#EF4444] bg-[#FEE2E2]';
    badgeText = 'Critical';
    badgeBg = 'bg-[#FEF2F2] text-[#B91C1C]';
  } else if (type === 'warning') {
    accentColor = 'border-l-[#F59E0B]';
    iconClass = 'text-[#F59E0B] bg-[#FFFBEB]';
    badgeText = 'Warning';
    badgeBg = 'bg-[#FFFBEB] text-[#B45309]';
  }

  return (
    <div className={`group flex items-center gap-4 rounded-[24px] border border-[#EAEFF5] border-l-4 ${accentColor} bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.14)] cursor-pointer`}>
      <div className={`grid h-12 w-12 place-items-center rounded-[18px] ${iconClass}`}>
        <AlertTriangle size={18} strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[14px] font-semibold text-[#0F172A] leading-tight">{message}</p>
          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${badgeBg}`}>{badgeText}</span>
        </div>
        {time && <p className="text-[12px] text-[#64748B] mt-2">{time}</p>}
      </div>
      <ChevronRight size={18} className="text-[#CBD5E1] transition-transform duration-300 group-hover:translate-x-1" />
    </div>
  );
}

function ActivityRow({ title, time, isLast }) {
  return (
    <div className="group relative flex gap-4 pb-8">
      {!isLast && <div className="absolute left-[13px] top-6 bottom-0 w-[2px] bg-[#E2E8F0]" />}
      <div className="relative z-10">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-[#F8FAFC] text-[#2563EB] shadow-[0_8px_16px_rgba(59,130,246,0.08)]">
          <Clock size={18} strokeWidth={2} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="group-hover:bg-[#F8FAFC] group-hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] rounded-[20px] p-4 transition-all duration-300">
          <p className="text-[14px] font-semibold text-[#0F172A] leading-snug">{title}</p>
          <div className="mt-2 flex items-center gap-2 text-[12px] text-[#64748B] font-medium">
            <Clock size={12} />
            <span>{time}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = status.toLowerCase();
  let dotColor = 'bg-[#94A3B8]';
  let pillColors = 'bg-[#F8FAFC] text-[#64748B]';

  if (s.includes('pending review')) {
    dotColor = 'bg-[#F59E0B]';
    pillColors = 'bg-[#FFFBEB] text-[#B45309] shadow-[inset_0_0_0_1px_rgba(245,158,11,0.14)]';
  } else if (s.includes('awaiting match')) {
    dotColor = 'bg-[#FBBF24]';
    pillColors = 'bg-[#FEF3C7] text-[#92400E] shadow-[inset_0_0_0_1px_rgba(245,158,11,0.12)]';
  } else if (s.includes('processing')) {
    dotColor = 'bg-[#10B981]';
    pillColors = 'bg-[#ECFDF5] text-[#166534] shadow-[inset_0_0_0_1px_rgba(16,185,129,0.12)]';
  } else if (s.includes('pending approval')) {
    dotColor = 'bg-[#F97316]';
    pillColors = 'bg-[#FFF7ED] text-[#C2410C] shadow-[inset_0_0_0_1px_rgba(249,115,22,0.14)]';
  } else if (s.includes('approve') || s.includes('complete')) {
    dotColor = 'bg-[#059669]';
    pillColors = 'bg-[#D1FAE5] text-[#065F46] shadow-[inset_0_0_0_1px_rgba(5,150,105,0.12)]';
  } else if (s.includes('reject')) {
    dotColor = 'bg-[#EF4444]';
    pillColors = 'bg-[#FEF2F2] text-[#B91C1C] shadow-[inset_0_0_0_1px_rgba(239,68,68,0.12)]';
  }

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-semibold ${pillColors}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
}

function getTypeIcon(type) {
  const t = type.toLowerCase();
  if (t.includes('verif')) return ShieldCheck;
  if (t.includes('pay') && !t.includes('payout')) return CreditCard;
  if (t.includes('payout')) return Wallet;
  if (t.includes('advert')) return Megaphone;
  return Scale;
}

function getTypeSubtitle(type) {
  const t = type.toLowerCase();
  if (t.includes('verif')) return 'Manufacturer Verification';
  if (t.includes('pay') && !t.includes('payout')) return 'Payment Proof Review';
  if (t.includes('payout')) return 'Seller Withdrawal';
  if (t.includes('advert')) return 'Sponsored Campaign';
  return 'Dispute Resolution';
}

function getTypeRoute(type) {
  const t = type.toLowerCase();
  if (t.includes('verif')) return '/admin/verifications';
  if (t.includes('pay') && !t.includes('payout')) return '/admin/payment-reviews';
  if (t.includes('payout')) return '/admin/payouts';
  if (t.includes('advert')) return '/admin/advertisements';
  return '/admin/disputes';
}

/* ─── Main Component ─────────────────────────────────────── */

export default function AdminOverviewCommandCenter({ metrics = {} }) {
  const {
    pendingBusinessVerifications = 0,
    pendingPaymentReviews = 0,
    pendingPayouts = 0,
    openDisputes = 0,
    pendingAdvertisements = 0,
    advertisementRevenue = 0,
    todayRevenue = 0,
    monthlyRevenue = 0,
    commissionEarned = 0,
    escrowBalance = 0,
    pendingPayoutAmount = 0,
    manufacturers = 0,
    wholesalers = 0,
    products = 0,
    advertisements = 0,
    activityFeed = [],
    priorityAlerts = [],
    actionCenterSummary = { totalPending: 0, highPriority: 0, updatedLabel: 'Now' },
    financialTrends = {
      todayRevenue: 0,
      monthlyRevenue: 0,
      commissionEarned: 0,
      escrowBalance: 0,
      pendingPayoutAmount: 0,
    },
  } = metrics;

  const totalOrders = metrics.platformGlance?.totalOrders || 0;

  // Dynamically build Approval Queue from real pending items across the platform
  const approvalQueue = useMemo(() => {
    const queue = [];

    // 1. Pending Verifications
    const pendingVerifs = (metrics.verificationOverview?.pendingUsers || (metrics.usersList || []).filter(u => u.verificationStatus === 'pending' || u.verificationStatus === 'submitted' || (u.businessDetails?.documentsUploaded && u.verificationStatus !== 'approved')));
    (pendingVerifs || []).slice(0, 5).forEach((u, i) => {
      queue.push({
        id: `verif-${u._id || i}`,
        type: 'Verification',
        name: u.businessDetails?.businessName || u.name || u.email || 'Business Verification',
        date: formatRelativeTime(u.verificationSubmittedAt || u.createdAt),
        rawDate: new Date(u.verificationSubmittedAt || u.createdAt).getTime(),
        status: 'Pending Review',
        subtitle: 'Manufacturer Verification'
      });
    });

    // 2. Pending Payment Reviews
    const pendingPayments = (metrics.orders || []).filter(o => {
      const status = (o.paymentStatus || '').toLowerCase();
      return status === 'pending_approval' || status === 'pending approval' || status === 'submitted';
    });
    pendingPayments.slice(0, 5).forEach((o, i) => {
      queue.push({
        id: `pay-${o._id || i}`,
        type: 'Payment',
        name: o.buyer?.name || o.buyer?.email || `Order #${(o._id || '').slice(-6).toUpperCase()}`,
        date: formatRelativeTime(o.updatedAt || o.createdAt),
        rawDate: new Date(o.updatedAt || o.createdAt).getTime(),
        status: 'Awaiting Match',
        subtitle: `Payment Proof Review (#${(o._id || '').slice(-6).toUpperCase()})`
      });
    });

    // 3. Pending Payout Requests
    const pendingPayouts = (metrics.transactions || []).filter(t => (t.type === 'payout' || t.type === 'Withdrawal') && t.status === 'Pending');
    pendingPayouts.slice(0, 5).forEach((t, i) => {
      queue.push({
        id: `payout-${t._id || i}`,
        type: 'Payout',
        name: t.seller?.name || t.user?.name || 'Seller Withdrawal',
        date: formatRelativeTime(t.createdAt || t.timestamp),
        rawDate: new Date(t.createdAt || t.timestamp).getTime(),
        status: 'Processing',
        subtitle: `Seller Withdrawal (${t.sellerAmount || t.amount ? 'PKR ' + Number(t.sellerAmount || t.amount).toLocaleString() : 'Payout'})`
      });
    });

    // 4. Pending Advertisements
    const pendingAds = (metrics.adOverview?.pendingList || []);
    pendingAds.slice(0, 5).forEach((ad, i) => {
      queue.push({
        id: `ad-${ad._id || i}`,
        type: 'Advertisement',
        name: ad.campaignName || ad.title || 'Sponsored Campaign',
        date: formatRelativeTime(ad.createdAt),
        rawDate: new Date(ad.createdAt).getTime(),
        status: 'Pending Approval',
        subtitle: 'Sponsored Campaign'
      });
    });

    // 5. Open Disputes
    const openDisputes = (metrics.disputes || []).filter(d => ['open', 'awaiting_seller', 'seller_responded', 'under_review', 'investigating'].includes(d.status));
    openDisputes.slice(0, 5).forEach((d, i) => {
      queue.push({
        id: `dispute-${d._id || i}`,
        type: 'Dispute',
        name: d.reason || d.title || `Order Issue #${(d._id || '').slice(-6).toUpperCase()}`,
        date: formatRelativeTime(d.createdAt),
        rawDate: new Date(d.createdAt).getTime(),
        status: 'Pending Review',
        subtitle: 'Dispute Resolution'
      });
    });

    return queue.sort((a, b) => (b.rawDate || 0) - (a.rawDate || 0));
  }, [metrics]);

  const approvalQueueCount = approvalQueue.length;
  const awaitingMatchCount = approvalQueue.filter((item) => item.status === 'Awaiting Match' || item.status === 'Pending Review').length;
  const updatedLabel = actionCenterSummary.updatedLabel || 'Now';

  return (
    <div className="max-w-[1600px] mx-auto space-y-16 animate-in fade-in duration-500 pb-20 px-6 md:px-10 text-[#0F172A]">
      
      {/* SECTION 0: ADMIN OVERVIEW KPI CARDS */}
      <section className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-[24px] font-extrabold text-[#0F172A] tracking-tight">Admin Overview</h2>
            <p className="text-[14px] text-slate-500 font-medium mt-1">
              Real-time marketplace performance, growth trends, and platform activity.
            </p>
          </div>
          <Link
            href="/admin/analytics/marketplace"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-[#0F172A] px-4 py-2.5 text-[13px] font-bold shadow-sm transition-all outline-none w-fit"
          >
            View Analytics
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {[
            { label: 'Manufacturers', value: manufacturers, icon: Building2, color: 'text-[#0F766E]', bg: 'bg-[#F0FDFC]', trend: '+12%' },
            { label: 'Wholesalers', value: wholesalers, icon: Store, color: 'text-[#059669]', bg: 'bg-[#ECFDF5]', trend: '+8%' },
            { label: 'Products', value: products, icon: Package, color: 'text-[#6366F1]', bg: 'bg-[#EEF2FF]', trend: '+15%' },
            { label: 'Orders', value: totalOrders, icon: ShoppingCart, color: 'text-[#D97706]', bg: 'bg-[#FFFBEB]', trend: '+18%' },
            { label: 'Sponsored Ads', value: advertisements, icon: Megaphone, color: 'text-[#BE185D]', bg: 'bg-[#FFE4E6]', trend: 'Active' },
          ].map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[#64748B] font-bold text-[11px] uppercase tracking-wider truncate">{kpi.label}</span>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${kpi.bg}`}>
                    <Icon size={18} className={kpi.color} />
                  </div>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <p className="font-heading text-3xl font-black text-slate-900 tracking-tight">
                    {kpi.value}
                  </p>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                    {kpi.trend}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 1: ACTION CENTER */}
      <section className="w-full">
        <div className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] p-6 sm:p-8">
          <SectionHeader
            title="Action Center"
            subtitle="Manage pending reviews, approvals, disputes, and platform actions."
            className="mb-8"
            align="center"
            chips={[
              {
                key: 'pending',
                label: 'Pending',
                value: actionCenterSummary.totalPending,
                className: 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 text-blue-700 shadow-sm',
              },
              {
                key: 'priority',
                label: 'High priority',
                value: actionCenterSummary.highPriority,
                className: 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 text-amber-700 shadow-sm',
              },
              {
                key: 'updated',
                label: 'Updated',
                value: updatedLabel,
                className: 'bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/60 text-teal-700 shadow-sm',
              },
            ]}
          />
          <div className="flex flex-col rounded-[20px] overflow-hidden border border-slate-100">
            <ActionCenterRow
              title="Pending Verifications"
              description="Business verification requests awaiting admin review."
              count={pendingBusinessVerifications}
              countLabel="Pending"
              href="/admin/verifications"
              icon={ShieldCheck}
              priority={pendingBusinessVerifications > 0 ? 'high' : 'low'}
            />
            <ActionCenterRow
              title="Payment Reviews"
              description="Buyer payment proofs submitted for escrow verification."
              count={pendingPaymentReviews}
              countLabel={pendingPaymentReviews === 1 ? 'Review' : 'Reviews'}
              href="/admin/payment-reviews"
              icon={CreditCard}
              priority={pendingPaymentReviews > 0 ? 'high' : 'low'}
            />
            <ActionCenterRow
              title="Payout Requests"
              description="Seller withdrawal requests ready for processing."
              count={pendingPayouts}
              countLabel={pendingPayouts === 1 ? 'Request' : 'Requests'}
              href="/admin/payouts"
              icon={Wallet}
              priority={pendingPayouts > 0 ? 'medium' : 'low'}
            />
            <ActionCenterRow
              title="Advertisements"
              description="Sponsored campaigns waiting for approval."
              count={pendingAdvertisements}
              countLabel="Pending"
              href="/admin/advertisements"
              icon={Megaphone}
              priority={pendingAdvertisements > 0 ? 'medium' : 'low'}
            />
            <ActionCenterRow
              title="Open Disputes"
              description="Buyer-seller order issues requiring resolution."
              count={openDisputes}
              countLabel="Active"
              href="/admin/disputes"
              icon={Scale}
              priority={openDisputes > 0 ? 'high' : 'low'}
            />
          </div>
        </div>
      </section>



      {/* ALERT CENTER */}
      <section className="w-full rounded-[28px] border border-[#EAEFF5] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <SectionHeader title="Alert Center" subtitle="Priority notifications requiring attention." />
        <div className="space-y-3">
          {(priorityAlerts || []).length > 0 ? (
            (priorityAlerts || []).map((alert, idx) => (
              <AlertRow 
                key={idx} 
                message={alert.message} 
                type={alert.tone === 'rose' ? 'critical' : alert.tone === 'amber' ? 'warning' : 'info'} 
                time="Now" 
              />
            ))
          ) : (
            <div className="p-6 rounded-[24px] border border-[#EAEFF5] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)] text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#F0FDF4] text-[#10B981] mx-auto mb-3">
                <ShieldCheck size={18} />
              </div>
              <p className="text-[14px] font-semibold text-[#0F172A]">All clear</p>
              <p className="text-[13px] text-[#64748B] mt-1">No urgent system alerts.</p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-20 rounded-[28px] border border-[#EAEFF5] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="mx-auto max-w-4xl text-center pb-6">
          <h2 className="text-[24px] font-semibold text-[#0F172A] tracking-tight">Recent Activity</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-[#475569]">
            Latest platform events and administrative actions.
          </p>
        </div>
        <div className="border-t border-[#E5E7EB] pt-6">
          {(activityFeed || []).length > 0 ? (
            (activityFeed || []).slice(0, 8).map((item, idx, arr) => (
              <ActivityRow
                key={item.id || idx}
                title={item.title}
                time={item.time}
                isLast={idx === arr.length - 1}
              />
            ))
          ) : (
            <div className="text-center py-10">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#F8FAFC] text-[#CBD5E1] mx-auto mb-4">
                <Clock size={18} />
              </div>
              <p className="text-[14px] font-semibold text-[#0F172A]">No activity yet</p>
              <p className="text-[13px] text-[#64748B] mt-2">Recent events will appear here.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
