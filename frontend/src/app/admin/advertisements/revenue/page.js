"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Banknote,
  Megaphone,
  TrendingUp,
  TrendingDown,
  PlayCircle,
  PauseCircle,
  Clock,
  CalendarPlus,
  Tag,
  Receipt,
  Sparkles,
} from 'lucide-react';
import PageShell from '@/components/dashboard/PageShell';
import PageHeader from '@/components/dashboard/PageHeader';
import Card from '@/components/common/Card';
import { formatPKR } from '@/lib/financeUtils';
import { CAMPAIGN_STATUSES } from '@/lib/advertisingConfig';
import { formatAdDate } from '@/lib/adDateUtils';
import {
  fetchAdminRevenueAnalytics,
  fetchAdminAdTransactions,
  pauseCampaign,
  resumeCampaign,
  extendCampaign,
  expireCampaign,
} from '@/lib/advertisingApi';
import CampaignActionButton from '@/components/advertising/CampaignActionButton';

function StatusBadge({ status }) {
  const meta = CAMPAIGN_STATUSES[status] || { label: status };
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
      {meta.label}
    </span>
  );
}

function PaymentStatusBadge({ status }) {
  const styles = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    refunded: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}

const PLAN_LABELS = {
  starter: 'Starter Plan',
  growth: 'Growth Plan',
  premium: 'Premium Plan',
};

export default function AdminAdvertisementRevenuePage() {
  const [data, setData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [analyticsRes, txRes] = await Promise.all([
        fetchAdminRevenueAnalytics(),
        fetchAdminAdTransactions(paymentFilter),
      ]);
      setData(analyticsRes.data);
      setTransactions(txRes.data || []);
    } catch {
      setData(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [paymentFilter]);

  useEffect(() => { load(); }, [load]);

  const runCampaignAction = async (advertisementId, action) => {
    if (!advertisementId) return;
    try {
      setActionId(advertisementId);
      if (action === 'pause') await pauseCampaign(advertisementId);
      if (action === 'resume') await resumeCampaign(advertisementId);
      if (action === 'expire') await expireCampaign(advertisementId);
      if (action === 'extend') {
        const daysRaw = window.prompt('Extend campaign by how many days?', '7');
        if (daysRaw == null) return;
        const days = Number(daysRaw);
        if (!Number.isFinite(days) || days <= 0) {
          alert('Enter a positive number of days.');
          return;
        }
        await extendCampaign(advertisementId, { days });
      }
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionId(null);
    }
  };

  const dashboard = data?.dashboard;
  const analytics = data?.analytics;
  const planRevenue = data?.planRevenue;
  const pricingPlans = data?.pricingPlans || [];

  const dashboardCards = [
    { label: 'Total Ad Revenue', value: dashboard?.totalAdRevenue, icon: Banknote },
    { label: 'Active Campaigns', value: dashboard?.activeCampaigns, icon: Megaphone },
    { label: 'Expired Campaigns', value: dashboard?.expiredCampaigns, icon: Clock },
    { label: 'Running Campaigns', value: dashboard?.runningCampaigns, icon: PlayCircle },
    { label: 'This Month Revenue', value: dashboard?.thisMonthRevenue, icon: Receipt },
    { label: "Today's Revenue", value: dashboard?.todayRevenue, icon: Sparkles },
  ];

  const growth = analytics?.revenueGrowthPercent ?? 0;
  const growthUp = growth >= 0;

  return (
    <PageShell>
      <PageHeader
        title="Advertisement Revenue Analytics"
        subtitle="Track every rupee earned from sponsored product advertisements"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/advertisements"
              className="px-4 py-2 border border-[#E5E7EB] text-sm font-bold rounded-xl hover:border-[#00A878] hover:text-[#00A878]"
            >
              Campaign Management
            </Link>
            <Link
              href="/admin/advertisements/pricing"
              className="px-4 py-2 bg-[#00A878] text-white text-sm font-bold rounded-xl hover:bg-[#009E66]"
            >
              Pricing Controls
            </Link>
          </div>
        }
      />

      {/* Dashboard KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {dashboardCards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="dashboard-card p-4">
            <div className="flex items-center gap-2 text-[#64748B] mb-2">
              <Icon size={14} className="text-[#00A878]" />
              <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-lg font-black text-[#0F172A]">
              {loading ? '…' : label.includes('Revenue') ? formatPKR(value ?? 0) : (value ?? '—')}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue analytics + plan breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
        <Card title="Revenue Analytics" className="xl:col-span-5" loading={loading}>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#FAFBFC] border border-[#E5E7EB]">
              <p className="text-[9px] font-black uppercase tracking-wider text-[#94A3B8]">Total Revenue</p>
              <p className="text-xl font-black text-[#0F172A] mt-1">{formatPKR(analytics?.totalRevenue ?? 0)}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAFBFC] border border-[#E5E7EB]">
              <p className="text-[9px] font-black uppercase tracking-wider text-[#94A3B8]">Monthly Revenue</p>
              <p className="text-xl font-black text-[#0F172A] mt-1">{formatPKR(analytics?.monthlyRevenue ?? 0)}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAFBFC] border border-[#E5E7EB]">
              <p className="text-[9px] font-black uppercase tracking-wider text-[#94A3B8]">Weekly Revenue</p>
              <p className="text-xl font-black text-[#0F172A] mt-1">{formatPKR(analytics?.weeklyRevenue ?? 0)}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAFBFC] border border-[#E5E7EB]">
              <p className="text-[9px] font-black uppercase tracking-wider text-[#94A3B8]">Revenue Growth</p>
              <p className={`text-xl font-black mt-1 flex items-center gap-1 ${growthUp ? 'text-[#00A878]' : 'text-red-600'}`}>
                {growthUp ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                {growthUp ? '+' : ''}{growth}%
              </p>
              <p className="text-[10px] text-[#94A3B8] mt-1">vs last month</p>
            </div>
          </div>
        </Card>

        <Card title="Plan Revenue Breakdown" className="xl:col-span-4" loading={loading}>
          <div className="space-y-3">
            {['starter', 'growth', 'premium'].map((slug) => (
              <div key={slug} className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] bg-white">
                <div>
                  <p className="text-sm font-bold text-[#0F172A]">{PLAN_LABELS[slug]}</p>
                  <p className="text-[10px] text-[#64748B] font-semibold">
                    {planRevenue?.[slug]?.transactions ?? 0} transactions
                  </p>
                </div>
                <p className="text-sm font-black text-[#00A878]">{formatPKR(planRevenue?.[slug]?.revenue ?? 0)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Admin Pricing Controls" className="xl:col-span-3" loading={loading}>
          <p className="text-xs text-[#64748B] mb-4">
            Manage plan prices, discounts, and plan availability from the Pricing Center.
          </p>
          <div className="space-y-2 mb-4">
            {pricingPlans.map((plan) => (
              <div key={plan.slug} className="flex items-center justify-between text-xs py-2 border-b border-[#F1F5F9] last:border-0">
                <span className="font-bold text-[#0F172A] capitalize">{plan.planName || plan.slug}</span>
                <span className="text-[#64748B]">{formatPKR(plan.price)} · {plan.duration}d</span>
                <span className={`text-[9px] font-black uppercase ${plan.isActive ? 'text-[#00A878]' : 'text-[#94A3B8]'}`}>
                  {plan.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/admin/advertisements/pricing"
            className="inline-flex items-center gap-2 px-4 py-2.5 w-full justify-center border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#0F172A] hover:border-[#00A878] hover:text-[#00A878] transition-all"
          >
            <Tag size={14} /> Open Pricing Center
          </Link>
        </Card>
      </div>

      {/* Transactions table */}
      <Card
        title="Advertisement Transactions"
        subtitle="Complete purchase and campaign accounting ledger"
        headerAction={
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="h-9 px-3 border border-[#E5E7EB] rounded-lg text-xs font-bold"
          >
            <option value="all">All payments</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        }
        loading={loading}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase text-[#94A3B8] border-b">
                <th className="pb-3 pr-3">Transaction ID</th>
                <th className="pb-3 pr-3">Manufacturer</th>
                <th className="pb-3 pr-3">Product</th>
                <th className="pb-3 pr-3">Package</th>
                <th className="pb-3 pr-3">Amount Paid</th>
                <th className="pb-3 pr-3">Payment</th>
                <th className="pb-3 pr-3">Purchase Date</th>
                <th className="pb-3 pr-3">Start</th>
                <th className="pb-3 pr-3">End</th>
                <th className="pb-3 pr-3">Campaign</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((tx) => (
                <tr key={tx._id} className="hover:bg-[#FAFBFC]">
                  <td className="py-3 pr-3 font-mono text-xs">{tx.transactionId}</td>
                  <td className="py-3 pr-3 font-semibold max-w-[140px] truncate" title={tx.manufacturerName}>{tx.manufacturerName}</td>
                  <td className="py-3 pr-3 max-w-[140px] truncate" title={tx.productName}>{tx.productName}</td>
                  <td className="py-3 pr-3 capitalize">{tx.plan}</td>
                  <td className="py-3 pr-3 font-bold text-[#00A878]">{formatPKR(tx.amountPaid)}</td>
                  <td className="py-3 pr-3"><PaymentStatusBadge status={tx.paymentStatus} /></td>
                  <td className="py-3 pr-3 text-xs text-[#64748B]">{formatAdDate(tx.purchaseDate)}</td>
                  <td className="py-3 pr-3 text-xs text-[#64748B]">{formatAdDate(tx.startDate)}</td>
                  <td className="py-3 pr-3 text-xs text-[#64748B]">{formatAdDate(tx.endDate)}</td>
                  <td className="py-3 pr-3"><StatusBadge status={tx.campaignStatus} /></td>
                  <td className="py-3">
                    {tx.advertisementId && (
                      <div className="flex flex-wrap gap-1.5">
                        {tx.campaignStatus === 'active' && (
                          <CampaignActionButton
                            onClick={() => runCampaignAction(tx.advertisementId, 'pause')}
                            disabled={actionId === tx.advertisementId}
                            label="Pause"
                            icon={PauseCircle}
                            variant="warning"
                            title="Pause Campaign"
                          />
                        )}
                        {tx.campaignStatus === 'paused' && (
                          <CampaignActionButton
                            onClick={() => runCampaignAction(tx.advertisementId, 'resume')}
                            disabled={actionId === tx.advertisementId}
                            label="Resume"
                            icon={PlayCircle}
                            variant="default"
                            title="Resume Campaign"
                          />
                        )}
                        {['active', 'paused', 'expired'].includes(tx.campaignStatus) && (
                          <CampaignActionButton
                            onClick={() => runCampaignAction(tx.advertisementId, 'extend')}
                            disabled={actionId === tx.advertisementId}
                            label="Extend"
                            icon={CalendarPlus}
                            variant="default"
                            title="Extend Campaign"
                          />
                        )}
                        {['active', 'paused'].includes(tx.campaignStatus) && (
                          <CampaignActionButton
                            onClick={() => runCampaignAction(tx.advertisementId, 'expire')}
                            disabled={actionId === tx.advertisementId}
                            label="End"
                            icon={Clock}
                            variant="navy"
                            title="End Campaign"
                          />
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && transactions.length === 0 && (
            <p className="text-center py-10 text-sm text-[#64748B]">No advertisement transactions recorded yet.</p>
          )}
        </div>
      </Card>

      <p className="mt-4 text-[10px] text-[#94A3B8] text-center">
        Campaigns auto-expire at end date. Expired campaigns leave sponsored placements but revenue remains in this ledger.
      </p>
    </PageShell>
  );
}
