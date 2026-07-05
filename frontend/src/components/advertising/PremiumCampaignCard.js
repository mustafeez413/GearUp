"use client";

import React from 'react';
import Link from 'next/link';
import {
  Package, Pause, Play, BarChart3, Trash2, Copy, Sparkles, Clock, TrendingUp, StopCircle,
} from 'lucide-react';
import { formatPKR } from '@/lib/financeUtils';
import { resolveProductImageUrl } from '@/lib/marketplaceData';
import { CAMPAIGN_STATUSES, CAMPAIGN_TYPES } from '@/lib/advertisingConfig';
import { formatAdDate, formatDaysRemaining } from '@/lib/adDateUtils';
import CampaignActionButton from '@/components/advertising/CampaignActionButton';

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100',
  paused: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-100',
  pending_payment: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-100',
  pending_approval: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-100',
  rejected: 'bg-red-50 text-red-700 border-red-200 ring-red-100',
  expired: 'bg-slate-100 text-slate-600 border-slate-200 ring-slate-100',
  completed: 'bg-slate-100 text-slate-600 border-slate-200 ring-slate-100',
  draft: 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-100',
};

function getImageUrl(product) {
  return resolveProductImageUrl(product?.images?.[0] || product?.image);
}

function getCampaignTypeLabel(type) {
  return CAMPAIGN_TYPES.find((t) => t.value === type)?.label || type?.replace(/_/g, ' ') || 'Sponsored';
}

function MetricPill({ label, value }) {
  return (
    <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 min-w-[88px]">
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-sm font-black text-slate-900 mt-0.5 tabular-nums">{value}</p>
    </div>
  );
}

export default function PremiumCampaignCard({ campaign, actionId, onAction, showManufacturer = true }) {
  const [imgFailed, setImgFailed] = React.useState(false);
  const product = campaign.productId;
  const manufacturer = campaign.manufacturerId;
  const imageUrl = getImageUrl(product);
  
  React.useEffect(() => {
    setImgFailed(false);
  }, [imageUrl]);
  const statusMeta = CAMPAIGN_STATUSES[campaign.status] || { label: campaign.status };
  const statusClass = STATUS_STYLES[campaign.status] || STATUS_STYLES.draft;
  const revenue = campaign.amountPaid || campaign.budget || 0;
  const isBusy = actionId === campaign._id;
  const daysLabel = formatDaysRemaining(campaign.endDate, campaign.status);
  const campaignId = `#${String(campaign._id).slice(-8).toUpperCase()}`;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      <div className="p-5 lg:p-6">
        <div className="flex flex-col xl:flex-row gap-6">
          {/* LEFT — Product identity */}
          <div className="flex gap-4 flex-1 min-w-0 xl:max-w-[34%]">
            <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center p-1.5 group-hover:border-slate-300 transition-colors">
              {imageUrl && !imgFailed ? (
                <img 
                  src={imageUrl} 
                  alt="" 
                  className="w-full h-full object-contain mix-blend-multiply" 
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 w-full h-full">
                  <Package size={24} strokeWidth={1.5} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{campaignId}</p>
              <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">{product?.name || 'Product'}</h3>
              {showManufacturer && (
                <p className="text-xs text-slate-500 mt-1 truncate">{manufacturer?.name || 'Your business'}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[9px] font-black uppercase tracking-wider border border-slate-200">
                  {getCampaignTypeLabel(campaign.campaignType)}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black uppercase tracking-wider capitalize">
                  {campaign.plan} Package
                </span>
              </div>
            </div>
          </div>

          {/* CENTER — Status & duration */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5 xl:border-x xl:border-slate-100 xl:px-6">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Status</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ring-1 ${statusClass}`}>
                  {campaign.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" />}
                  {statusMeta.label}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Campaign Duration</p>
                <div className="space-y-1 text-xs">
                  <p className="text-slate-600"><span className="font-bold text-slate-900">Start:</span> {formatAdDate(campaign.startDate)}</p>
                  <p className="text-slate-600"><span className="font-bold text-slate-900">End:</span> {formatAdDate(campaign.endDate)}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-4">
              <div className="p-3.5 rounded-xl bg-slate-900 text-white shadow-sm">
                <div className="flex items-center gap-2 text-slate-300 text-[10px] font-black uppercase tracking-widest">
                  <Clock size={12} /> Time Remaining
                </div>
                <p className="text-xl font-black mt-1 tracking-tight">{daysLabel}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <MetricPill label="Impressions" value={(campaign.impressions || 0).toLocaleString()} />
                <MetricPill label="Clicks" value={(campaign.clicks || 0).toLocaleString()} />
                <MetricPill label="CTR" value={`${campaign.ctr || 0}%`} />
                <MetricPill label="Views" value={(campaign.views || 0).toLocaleString()} />
              </div>
            </div>
          </div>

          {/* RIGHT — Revenue */}
          <div className="xl:w-[180px] shrink-0 flex xl:flex-col items-center xl:items-end justify-between gap-4">
            <div className="text-left xl:text-right w-full">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center xl:justify-end gap-1.5 mb-1">
                <TrendingUp size={14} className="text-emerald-500" /> Campaign Revenue
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tabular-nums tracking-tight">{formatPKR(revenue)}</p>
              {(campaign.revenueGenerated || 0) > 0 && (
                <p className="text-xs text-emerald-600 font-bold mt-1.5 bg-emerald-50 inline-block px-2 py-0.5 rounded-md border border-emerald-100 xl:ml-auto">
                  +{formatPKR(campaign.revenueGenerated)} generated
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions row */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap gap-3">
          <CampaignActionButton
            href={`/manufacturer/advertising/analytics?id=${campaign._id}`}
            label="View"
            icon={BarChart3}
            variant="primary"
            title="View campaign analytics and performance"
          />
          {campaign.status === 'active' && (
            <CampaignActionButton
              onClick={() => onAction(campaign._id, 'pause')}
              disabled={isBusy}
              label="Pause"
              icon={Pause}
              variant="warning"
              title="Pause Campaign"
            />
          )}
          {campaign.status === 'paused' && (
            <CampaignActionButton
              onClick={() => onAction(campaign._id, 'resume')}
              disabled={isBusy}
              label="Resume"
              icon={Play}
              variant="default"
              title="Resume Campaign"
            />
          )}
          {['draft', 'pending_payment', 'pending_approval', 'paused'].includes(campaign.status) && (
            <CampaignActionButton
              onClick={() => {
                if (window.confirm('End this campaign? It cannot be reactivated after ending.')) {
                  onAction(campaign._id, 'cancel');
                }
              }}
              disabled={isBusy}
              label="End Campaign"
              icon={StopCircle}
              variant="navy"
              title="End Campaign"
            />
          )}
          <CampaignActionButton
            onClick={() => onAction(campaign._id, 'duplicate')}
            disabled={isBusy}
            label="Duplicate"
            icon={Copy}
            title="Duplicate Campaign"
          />
          {['draft', 'pending_payment', 'pending_approval', 'paused'].includes(campaign.status) && (
            <CampaignActionButton
              onClick={() => {
                if (window.confirm('Delete this campaign permanently?')) {
                  onAction(campaign._id, 'delete');
                }
              }}
              disabled={isBusy}
              label="Delete"
              icon={Trash2}
              variant="danger"
              title="Delete Campaign"
            />
          )}
        </div>
      </div>
    </article>
  );
}

export function CampaignFiltersBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  planFilter,
  onPlanChange,
  sortBy,
  onSortChange,
  dateFilter,
  onDateChange,
}) {
  const inputClass = 'h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all shadow-sm cursor-pointer';

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Search Campaigns</label>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Product, ID, or type..."
            className={`${inputClass} w-full cursor-text`}
          />
        </div>
        <div className="lg:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Status</label>
          <select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)} className={`${inputClass} w-full`}>
            <option value="all">All statuses</option>
            {Object.entries(CAMPAIGN_STATUSES).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Package</label>
          <select value={planFilter} onChange={(e) => onPlanChange(e.target.value)} className={`${inputClass} w-full`}>
            <option value="all">All packages</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <div className="lg:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Date</label>
          <select value={dateFilter} onChange={(e) => onDateChange(e.target.value)} className={`${inputClass} w-full`}>
            <option value="all">Any time</option>
            <option value="active_now">Currently running</option>
            <option value="ending_soon">Ending in 7 days</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </div>
        <div className="lg:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Sort</label>
          <select value={sortBy} onChange={(e) => onSortChange(e.target.value)} className={`${inputClass} w-full`}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="revenue_high">Revenue: high to low</option>
            <option value="impressions">Most impressions</option>
            <option value="ending_soon">Ending soon</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export function CampaignEmptyState() {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 sm:p-16 text-center">
      <div className="w-24 h-24 mx-auto rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm mb-6">
        <Sparkles size={40} className="text-emerald-500" />
      </div>
      <h3 className="text-xl font-black text-slate-900 tracking-tight">No campaigns found</h3>
      <p className="text-sm font-medium text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
        Launch your first sponsored product campaign to reach wholesalers across the GearUp marketplace.
      </p>
      <Link
        href="/manufacturer/advertising/create"
        className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all hover:-translate-y-0.5"
      >
        <Package size={18} /> Create Advertisement
      </Link>
    </div>
  );
}
