'use client';

import Link from 'next/link';
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

  // Mocking Approval Queue since it wasn't in original metrics
  const approvalQueue = [
    { id: 1, type: 'Verification', name: 'Apex Sports Mfg', date: '10 min ago', status: 'Pending Review' },
    { id: 2, type: 'Payment', name: 'Global Gear Dist.', date: '1 hr ago', status: 'Awaiting Match' },
    { id: 3, type: 'Payout', name: 'Elite Athletics', date: '3 hrs ago', status: 'Processing' },
    { id: 4, type: 'Advertisement', name: 'Summer Promo 2026', date: '1 day ago', status: 'Pending Approval' },
  ];

  const approvalQueueCount = approvalQueue.length;
  const awaitingMatchCount = approvalQueue.filter((item) => item.status === 'Awaiting Match').length;
  const updatedLabel = actionCenterSummary.updatedLabel || 'Now';

  return (
    <div className="max-w-[1600px] mx-auto space-y-16 animate-in fade-in duration-500 pb-20 px-6 md:px-10 text-[#0F172A]">
      
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

      {/* SECTION 2: FINANCIAL HEALTH */}
      <section className="w-full">
        <div className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] p-6 sm:p-8">
          <SectionHeader
            title="Financial Health"
            subtitle="Revenue, commissions, escrow balances, and payouts at a glance."
            className="mb-8"
            align="stacked"
            chips={[
              { key: 'revenue', label: 'Revenue tracking', className: 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]' },
              { key: 'live', label: 'Live metrics', className: 'bg-[#F0FDFA] text-[#14B8A6] border border-[#14B8A6]/20' },
            ]}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
            <FinanceKpiTile
              label="Today's Revenue"
              value={formatDashboardMoney(todayRevenue)}
              trend={financialTrends.todayRevenue}
              icon={Banknote}
            />
            <FinanceKpiTile
              label="Monthly Revenue"
              value={formatDashboardMoney(monthlyRevenue)}
              trend={financialTrends.monthlyRevenue}
              icon={TrendingUp}
            />
            <FinanceKpiTile
              label="Commission Earned"
              value={formatDashboardMoney(commissionEarned)}
              trend={financialTrends.commissionEarned}
              icon={Receipt}
            />
            <FinanceKpiTile
              label="Ad Revenue"
              value={formatDashboardMoney(advertisementRevenue)}
              trend={0}
              icon={Megaphone}
            />
            <FinanceKpiTile
              label="Escrow Balance"
              value={formatDashboardMoney(escrowBalance)}
              trend={financialTrends.escrowBalance}
              icon={Landmark}
              isPrimary={true}
            />
            <FinanceKpiTile
              label="Seller Payouts"
              value={formatDashboardMoney(pendingPayoutAmount)}
              trend={financialTrends.pendingPayoutAmount}
              icon={CreditCard}
            />
          </div>
        </div>
      </section>

      {/* 2-COLUMN DASHBOARD GRID: Marketplace Health (Left) + Monitoring Panels (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-32 lg:-ml-8">
        
        {/* LEFT COLUMN: Marketplace Health (Primary KPI Section) — 2/3 Width */}
        <div className="lg:col-span-2 space-y-20">
          
          {/* SECTION 3: MARKETPLACE HEALTH — Premium SaaS Analytics Hero */}
          <section className="relative overflow-hidden rounded-[32px] bg-[#07101f] px-6 py-10 shadow-[0_30px_80px_rgba(5,15,44,0.18)] sm:px-8 sm:py-12 lg:px-10 lg:py-14">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_24%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/10 to-transparent" />
            <div className="relative grid gap-10 justify-center">
              <div className="mx-auto max-w-4xl text-center space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.25em] text-sky-200 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
                  MARKETPLACE HEALTH
                </div>
                <div className="space-y-4">
                  <h2 className="text-[38px] md:text-[44px] lg:text-[48px] font-extrabold text-white tracking-[-0.04em] leading-tight">
                    Marketplace Health
                  </h2>
                  <p className="mx-auto max-w-xl text-[16px] leading-8 text-slate-300">
                    Real-time marketplace performance, growth trends, and platform activity.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    href="/admin/analytics/marketplace"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-[#0F172A] shadow-[0_12px_35px_rgba(255,255,255,0.18)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(255,255,255,0.22)]"
                  >
                    View Analytics
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Snapshot panel removed to reclaim space and center hero content */}
            </div>

            <div className="relative z-10 -mt-1 mx-auto grid gap-4 sm:grid-cols-2 xl:grid-cols-5 max-w-6xl">
              <HealthKpiCard
                label="Manufacturers"
                value={manufacturers}
                icon={Building2}
                iconBg="bg-[#F0FDFC]"
                iconColor="text-[#0F766E]"
                trend={12}
                trendLabel="+12%"
                positive
                sparklineColor="#0F766E"
              />
              <HealthKpiCard
                label="Wholesalers"
                value={wholesalers}
                icon={Store}
                iconBg="bg-[#ECFDF5]"
                iconColor="text-[#059669]"
                trend={8}
                trendLabel="+8%"
                positive
                sparklineColor="#059669"
              />
              <HealthKpiCard
                label="Products"
                value={products}
                icon={Package}
                iconBg="bg-[#EEF2FF]"
                iconColor="text-[#6366F1]"
                trend={15}
                trendLabel="+15%"
                positive
                sparklineColor="#6366F1"
              />
              <HealthKpiCard
                label="Orders"
                value={totalOrders}
                icon={ShoppingCart}
                iconBg="bg-[#FFFBEB]"
                iconColor="text-[#D97706]"
                trend={18}
                trendLabel="+18%"
                positive
                sparklineColor="#D97706"
              />
              <HealthKpiCard
                label="Sponsored Ads"
                value={advertisements}
                icon={Megaphone}
                iconBg="bg-[#FFE4E6]"
                iconColor="text-[#BE185D]"
                trend={-5}
                trendLabel="-5%"
                positive={false}
                sparklineColor="#BE185D"
              />
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Monitoring Panels (Secondary) — 1/3 Width */}
        <div className="lg:col-span-1 space-y-20">
          
          {/* SECTION 5: ALERT CENTER */}
          <section className="rounded-[28px] border border-[#EAEFF5] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
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

        </div>

        <section className="lg:col-span-3 rounded-[28px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="mx-auto max-w-4xl text-center pb-8">
            <h2 className="text-[26px] font-semibold text-[#0F172A] tracking-tight">Approval Queue</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-[#475569]">
              Review and manage pending marketplace requests with clarity, speed, and precision.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <span className="rounded-full bg-[#ECFDF5] px-4 py-2 text-[12px] font-semibold text-[#065F46] shadow-[inset_0_0_0_1px_rgba(4,120,87,0.08)]">
                {approvalQueueCount} Pending Reviews
              </span>
              <span className="rounded-full bg-[#FFFBEB] px-4 py-2 text-[12px] font-semibold text-[#B45309] shadow-[inset_0_0_0_1px_rgba(245,158,11,0.12)]">
                {awaitingMatchCount} Awaiting Match
              </span>
              <span className="rounded-full bg-[#F8FAFC] px-4 py-2 text-[12px] font-semibold text-[#475569] shadow-[inset_0_0_0_1px_rgba(71,113,133,0.08)]">
                Updated {updatedLabel}
              </span>
            </div>
          </div>
          <div className="border-t border-[#E5E7EB] pt-6">

          <div
            className="overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 #F8FAFC' }}
          >
            <table className="w-full min-w-[760px] border-separate border-spacing-0">
              <thead className="border-b border-[#E5E7EB] bg-[#F8FAFC] shadow-sm">
                <tr>
                  <th className="w-[18%] px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748B]">Type</th>
                  <th className="w-[30%] px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748B]">Business</th>
                  <th className="w-[18%] px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748B]">Submitted</th>
                  <th className="w-[18%] px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748B]">Status</th>
                  <th className="w-[16%] px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748B]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {approvalQueue.map((item) => {
                  const TypeIcon = getTypeIcon(item.type);
                  const subtitle = getTypeSubtitle(item.type);
                  return (
                    <tr
                      key={item.id}
                      className="group cursor-pointer transition duration-300 hover:-translate-y-0.5 hover:bg-[#F9FAFB] hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
                    >
                      <td className="px-6 py-6 align-top">
                        <div className="flex items-center gap-3">
                          <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#EEF2FF] text-[#3730A3] shadow-[inset_0_0_0_1px_rgba(99,102,241,0.12)]">
                            <TypeIcon size={18} strokeWidth={2} />
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-[#0F172A]">{item.type}</p>
                            <span className="inline-flex rounded-full bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#475569] shadow-[inset_0_0_0_1px_rgba(71,113,133,0.08)]">
                              {item.type}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 align-top">
                        <p className="text-[15px] font-semibold text-[#0F172A] leading-tight">{item.name}</p>
                        <p className="text-[13px] text-[#64748B] mt-2 truncate max-w-[380px]">{subtitle}</p>
                      </td>
                      <td className="px-6 py-6 align-top">
                        <p className="text-[13px] font-semibold text-[#0F172A]">{item.date}</p>
                        <p className="mt-1 text-[12px] text-[#64748B]">Submitted</p>
                      </td>
                      <td className="px-6 py-6 align-top">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-6 text-right align-top">
                        <Link
                          href={getTypeRoute(item.type)}
                          className="inline-flex items-center justify-center rounded-full bg-[#0F172A] px-5 py-2.5 text-sm font-semibold text-white transition duration-300 hover:bg-[#111827]"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {approvalQueue.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-full bg-[#ECFDF5] text-[#047857]">
                          <ShieldCheck size={22} />
                        </div>
                        <p className="text-[15px] font-semibold text-[#0F172A]">All caught up</p>
                        <p className="text-[13px] text-[#64748B]">No pending items in the queue.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </section>
      </div>

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
