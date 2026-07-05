"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BarChart3, Eye, MousePointerClick, MessageSquare, ShoppingBag, TrendingUp } from 'lucide-react';
import PageShell from '@/components/dashboard/PageShell';
import PageHeader from '@/components/dashboard/PageHeader';
import Card from '@/components/common/Card';
import { formatPKR } from '@/lib/financeUtils';
import { fetchMyCampaigns, fetchCampaignAnalytics } from '@/lib/advertisingApi';
import { formatAdDate } from '@/lib/adDateUtils';

export default function CampaignAnalyticsPage() {
  const searchParams = useSearchParams();
  const [campaigns, setCampaigns] = useState([]);
  const [selectedId, setSelectedId] = useState(searchParams.get('id') || '');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyCampaigns()
      .then((res) => {
        const list = res.data || [];
        setCampaigns(list);
        if (!selectedId && list[0]) setSelectedId(list[0]._id);
      })
      .catch(() => setCampaigns([]));
  }, [selectedId]);

  const loadAnalytics = useCallback(async () => {
    if (!selectedId) return;
    try {
      setLoading(true);
      const params = {};
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const res = await fetchCampaignAnalytics(selectedId, params);
      setAnalytics(res.data);
    } catch {
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [selectedId, dateFrom, dateTo]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const summary = analytics?.summary;
  const kpis = useMemo(() => [
    { label: 'Impressions', value: summary?.impressions?.toLocaleString() || '0', icon: Eye },
    { label: 'Views', value: summary?.views?.toLocaleString() || '0', icon: TrendingUp },
    { label: 'Clicks', value: summary?.clicks?.toLocaleString() || '0', icon: MousePointerClick },
    { label: 'CTR', value: `${summary?.ctr || 0}%`, icon: BarChart3 },
    { label: 'Inquiries', value: summary?.inquiries?.toLocaleString() || '0', icon: MessageSquare },
    { label: 'Orders', value: summary?.ordersGenerated?.toLocaleString() || '0', icon: ShoppingBag },
    { label: 'Revenue', value: formatPKR(summary?.revenueGenerated || 0), icon: TrendingUp },
  ], [summary]);

  return (
    <PageShell>
      <PageHeader title="Campaign Analytics" subtitle="Track performance across impressions, clicks, and conversions" />

      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm font-semibold min-w-[220px]"
        >
          {campaigns.map((c) => (
            <option key={c._id} value={c._id}>{c.productId?.name || c._id} — {c.status}</option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(({ label, value, icon: Icon }) => (
          <div key={label} className="dashboard-card p-4">
            <div className="flex items-center gap-2 text-[#64748B] mb-2">
              <Icon size={14} />
              <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-xl font-black text-[#0F172A]">{loading ? '…' : value}</p>
          </div>
        ))}
      </div>

      <Card title="Daily Breakdown" loading={loading}>
        {!analytics?.daily?.length ? (
          <p className="text-sm text-[#64748B] py-6 text-center">No daily data yet — metrics appear as wholesalers interact with your sponsored listing.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-black uppercase text-[#94A3B8] border-b">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Impressions</th>
                  <th className="pb-2 pr-4">Views</th>
                  <th className="pb-2 pr-4">Clicks</th>
                  <th className="pb-2 pr-4">Inquiries</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {analytics.daily.map((row) => (
                  <tr key={row._id}>
                    <td className="py-3 pr-4">{formatAdDate(row.date)}</td>
                    <td className="py-3 pr-4">{row.impressions}</td>
                    <td className="py-3 pr-4">{row.views}</td>
                    <td className="py-3 pr-4">{row.clicks}</td>
                    <td className="py-3 pr-4">{row.inquiries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageShell>
  );
}
