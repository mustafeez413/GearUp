"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Megaphone, Eye, MousePointerClick, Banknote, CheckCircle2, XCircle, Pause, Play, Clock, CalendarPlus
} from 'lucide-react';
import PageShell from '@/components/dashboard/PageShell';
import PageHeader from '@/components/dashboard/PageHeader';
import Card from '@/components/common/Card';
import { formatPKR } from '@/lib/financeUtils';
import { CAMPAIGN_STATUSES } from '@/lib/advertisingConfig';
import { formatAdDateRange } from '@/lib/adDateUtils';
import {
  fetchAdminAdOverview,
  fetchAdminCampaigns,
  approveCampaign,
  rejectCampaign,
  expireCampaign,
  extendCampaign,
  pauseCampaign,
  resumeCampaign,
} from '@/lib/advertisingApi';
import CampaignActionButton from '@/components/advertising/CampaignActionButton';

function StatusBadge({ status }) {
  const meta = CAMPAIGN_STATUSES[status] || { label: status };
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
      {meta.label}
    </span>
  );
}

export default function AdminAdvertisementsPage() {
  const [overview, setOverview] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewRes, campaignsRes] = await Promise.all([
        fetchAdminAdOverview(),
        fetchAdminCampaigns(filter === 'all' ? 'all' : filter),
      ]);
      setOverview(overviewRes.data);
      setCampaigns(campaignsRes.data || []);
    } catch {
      setOverview(null);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const pendingCampaigns = useMemo(
    () => campaigns.filter((c) => c.status === 'pending_approval'),
    [campaigns]
  );

  const runAction = async (id, action) => {
    try {
      setActionId(id);
      if (action === 'approve') await approveCampaign(id);
      if (action === 'reject') {
        await rejectCampaign(id, rejectReason || 'Does not meet guidelines');
        setRejectId(null);
        setRejectReason('');
      }
      if (action === 'expire') await expireCampaign(id);
      if (action === 'extend') {
        const daysRaw = window.prompt('Extend campaign by how many days?', '7');
        if (daysRaw == null) return;
        const days = Number(daysRaw);
        if (!Number.isFinite(days) || days <= 0) {
          alert('Enter a positive number of days.');
          return;
        }
        await extendCampaign(id, { days });
      }
      if (action === 'pause') await pauseCampaign(id);
      if (action === 'resume') await resumeCampaign(id);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionId(null);
    }
  };

  const kpis = [
    { label: 'Total Campaigns', value: overview?.totalCampaigns ?? '—', icon: Megaphone },
    { label: 'Pending Approval', value: overview?.pendingApproval ?? '—', icon: Clock },
    { label: 'Active', value: overview?.activeCampaigns ?? '—', icon: CheckCircle2 },
    { label: 'Revenue', value: overview ? formatPKR(overview.revenueGenerated) : '—', icon: Banknote },
    { label: 'Impressions', value: overview?.totalImpressions?.toLocaleString?.() ?? '—', icon: Eye },
    { label: 'Clicks', value: overview?.totalClicks?.toLocaleString?.() ?? '—', icon: MousePointerClick },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Advertisement Management"
        subtitle="Approve, monitor, and manage manufacturer sponsored product campaigns"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/advertisements/revenue" className="px-4 py-2 border border-[#E5E7EB] text-sm font-bold rounded-xl hover:border-[#00A878] hover:text-[#00A878]">
              Revenue Analytics
            </Link>
            <Link href="/admin/advertisements/pricing" className="px-4 py-2 border border-[#E5E7EB] text-sm font-bold rounded-xl hover:border-[#00A878] hover:text-[#00A878]">
              Pricing Center
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {kpis.map(({ label, value, icon: Icon }) => (
          <div key={label} className="dashboard-card p-4">
            <div className="flex items-center gap-2 text-[#64748B] mb-2">
              <Icon size={14} className="text-[#00A878]" />
              <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-lg font-black text-[#0F172A]">{loading ? '…' : value}</p>
          </div>
        ))}
      </div>

      {pendingCampaigns.length > 0 && (
        <Card title="Pending Approval" subtitle={`${pendingCampaigns.length} paid campaigns awaiting review`} className="mb-6">
          <div className="space-y-3">
            {pendingCampaigns.map((c) => (
              <div key={c._id} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-amber-100 bg-amber-50/50">
                <div>
                  <p className="font-bold text-[#0F172A]">{c.productId?.name}</p>
                  <p className="text-xs text-[#64748B]">
                    {c.manufacturerId?.name} · {c.plan} · {formatPKR(c.amountPaid || c.budget)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CampaignActionButton
                    onClick={() => runAction(c._id, 'approve')}
                    disabled={actionId === c._id}
                    label="Approve Advertisement"
                    icon={CheckCircle2}
                    variant="primary"
                    title="Approve Campaign"
                  />
                  <CampaignActionButton
                    onClick={() => setRejectId(c._id)}
                    label="Reject Advertisement"
                    icon={XCircle}
                    variant="danger"
                    title="Reject Campaign"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card
        title="All Campaigns"
        headerAction={
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 px-3 border border-[#E5E7EB] rounded-lg text-xs font-bold"
          >
            <option value="all">All statuses</option>
            {Object.keys(CAMPAIGN_STATUSES).map((s) => (
              <option key={s} value={s}>{CAMPAIGN_STATUSES[s].label}</option>
            ))}
          </select>
        }
        loading={loading}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase text-[#94A3B8] border-b">
                <th className="pb-3 pr-3">ID & Date</th>
                <th className="pb-3 pr-3">Product & Mfg</th>
                <th className="pb-3 pr-3">Type & Pkg</th>
                <th className="pb-3 pr-3">Dates</th>
                <th className="pb-3 pr-3">Cost</th>
                <th className="pb-3 pr-3">Payment</th>
                <th className="pb-3 pr-3">Approval</th>
                <th className="pb-3 pr-3">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map((c) => (
                <tr key={c._id} className="hover:bg-[#FAFBFC]">
                  <td className="py-3 pr-3">
                    <p className="font-mono text-xs">#{c._id.slice(-6).toUpperCase()}</p>
                    <p className="text-[10px] text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="py-3 pr-3">
                    <p className="font-semibold text-xs">{c.productId?.name || 'Unknown'}</p>
                    <p className="text-[10px] text-slate-500">{c.manufacturerId?.name || 'Unknown'}</p>
                  </td>
                  <td className="py-3 pr-3">
                    <p className="capitalize text-xs font-semibold">{c.plan}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{c.campaignType?.replace('_', ' ')}</p>
                  </td>
                  <td className="py-3 pr-3 text-[10px] text-[#64748B]">
                    {formatAdDateRange(c.startDate, c.endDate)}
                  </td>
                  <td className="py-3 pr-3 font-bold text-xs text-[#00A878]">{formatPKR(c.amountPaid || c.budget)}</td>
                  <td className="py-3 pr-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${c.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : c.paymentStatus === 'failed' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {c.paymentStatus?.replace('_', ' ') || 'pending'}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${c.approvalStatus === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : c.approvalStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {c.approvalStatus?.replace('_', ' ') || 'pending review'}
                    </span>
                  </td>
                  <td className="py-3 pr-3"><StatusBadge status={c.status} /></td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2 min-w-[200px]">
                      <Link href={`/admin/advertisements/${c._id}`}>
                        <CampaignActionButton
                          label="View Details"
                          icon={Eye}
                          variant="default"
                          title="View Details"
                        />
                      </Link>

                      {c.paymentStatus === 'paid' && c.approvalStatus === 'pending_review' && (
                        <>
                          <CampaignActionButton
                            onClick={() => runAction(c._id, 'approve')}
                            disabled={actionId === c._id}
                            label="Approve"
                            icon={CheckCircle2}
                            variant="primary"
                          />
                          <CampaignActionButton
                            onClick={() => setRejectId(c._id)}
                            disabled={actionId === c._id}
                            label="Reject"
                            icon={XCircle}
                            variant="danger"
                          />
                        </>
                      )}

                      {c.approvalStatus === 'approved' && ['active', 'scheduled'].includes(c.status) && (
                        <CampaignActionButton
                          onClick={() => runAction(c._id, 'expire')}
                          disabled={actionId === c._id}
                          label="Deactivate"
                          icon={XCircle}
                          variant="warning"
                        />
                      )}

                      {c.approvalStatus === 'rejected' && (
                        <CampaignActionButton
                          onClick={() => alert(`Rejection Reason: ${c.rejectionReason}`)}
                          label="View Reason"
                          icon={Eye}
                          variant="default"
                        />
                      )}

                      {(c.paymentStatus === 'pending' || !c.paymentStatus) && (
                        <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Awaiting Payment</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && campaigns.length === 0 && (
            <p className="text-center py-8 text-sm text-[#64748B]">No campaigns found.</p>
          )}
        </div>
      </Card>

      {rejectId && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-lg mb-2">Reject Campaign</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (sent to manufacturer)"
              className="w-full h-24 p-3 border rounded-xl text-sm mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setRejectId(null)} className="px-4 py-2 text-sm font-bold text-[#64748B]">Cancel</button>
              <button type="button" onClick={() => runAction(rejectId, 'reject')} className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl">Reject</button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
