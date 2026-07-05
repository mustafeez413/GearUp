"use client";

import React, { useCallback, useEffect, useState } from 'react';
import {
  Tag, Percent, Calendar, Banknote, Sparkles, Plus, ToggleLeft, ToggleRight, Save
} from 'lucide-react';
import PageShell from '@/components/dashboard/PageShell';
import PageHeader from '@/components/dashboard/PageHeader';
import Card from '@/components/common/Card';
import { formatPKR } from '@/lib/financeUtils';
import {
  fetchPricingCenter,
  updatePlanPrice,
  createAdDiscount,
  toggleAdDiscount,
} from '@/lib/advertisingApi';
import { formatAdDate, formatAdDateRange, formatAdDateTime } from '@/lib/adDateUtils';

const PLAN_SLUGS = ['starter', 'growth', 'premium'];
const APPLY_OPTIONS = [
  { value: 'all_plans', label: 'All Advertisement Plans' },
  { value: 'specific_plans', label: 'Specific Plans' },
  { value: 'specific_categories', label: 'Specific Categories' },
];

const emptyDiscountForm = {
  discountName: '',
  discountPercentage: 10,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  applyTo: 'all_plans',
  applicablePlans: [],
  applicableCategories: [],
  isPromotion: false,
  promotionTag: '',
};

export default function AdvertisementPricingPage() {
  const [center, setCenter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [planEdits, setPlanEdits] = useState({});
  const [savingPlan, setSavingPlan] = useState(null);
  const [discountForm, setDiscountForm] = useState(emptyDiscountForm);
  const [creatingDiscount, setCreatingDiscount] = useState(false);
  const [tab, setTab] = useState('plans');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchPricingCenter();
      setCenter(res.data);
      const edits = {};
      (res.data?.currentPrices || []).forEach((p) => {
        edits[p.slug] = { price: p.price, duration: p.durationDays || p.duration, status: p.status || 'active' };
      });
      setPlanEdits(edits);
    } catch {
      setCenter(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const savePlan = async (slug) => {
    try {
      setSavingPlan(slug);
      await updatePlanPrice(slug, planEdits[slug]);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingPlan(null);
    }
  };

  const submitDiscount = async (e) => {
    e.preventDefault();
    try {
      setCreatingDiscount(true);
      await createAdDiscount(discountForm);
      setDiscountForm(emptyDiscountForm);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingDiscount(false);
    }
  };

  const handleToggleDiscount = async (id) => {
    try {
      await toggleAdDiscount(id);
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  const tabs = [
    { id: 'plans', label: 'Plan Pricing' },
    { id: 'discounts', label: 'Discounts & Promotions' },
    { id: 'history', label: 'Pricing History' },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Advertisement Pricing Center"
        subtitle="Manage advertisement plans, discounts, promotions, and pricing audit trail"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Starter Price', value: center?.currentPrices?.find((p) => p.slug === 'starter')?.price },
          { label: 'Growth Price', value: center?.currentPrices?.find((p) => p.slug === 'growth')?.price },
          { label: 'Premium Price', value: center?.currentPrices?.find((p) => p.slug === 'premium')?.price },
          { label: 'Ad Revenue', value: center?.revenueImpact?.totalRevenue },
        ].map(({ label, value }) => (
          <div key={label} className="dashboard-card p-4">
            <p className="text-[10px] font-black uppercase text-[#64748B]">{label}</p>
            <p className="text-lg font-black text-[#0F172A] mt-1">
              {loading ? '…' : typeof value === 'number' ? formatPKR(value) : '—'}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-[#E5E7EB] pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-t-lg text-sm font-bold transition-all ${
              tab === t.id ? 'bg-[#00A878] text-white' : 'text-[#64748B] hover:bg-[#F8FAFC]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'plans' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {(center?.currentPrices || []).map((plan) => (
            <Card key={plan.slug} title={plan.name || plan.planName} subtitle={`${plan.durationDays || plan.duration} days · ${plan.visibilityTier} visibility`}>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-[#64748B]">Price (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    value={planEdits[plan.slug]?.price ?? plan.price}
                    onChange={(e) => setPlanEdits((prev) => ({
                      ...prev,
                      [plan.slug]: { ...prev[plan.slug], price: Number(e.target.value) },
                    }))}
                    className="w-full h-11 mt-1 px-3 border border-[#E5E7EB] rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-[#64748B]">Duration (days)</label>
                  <input
                    type="number"
                    min="1"
                    value={planEdits[plan.slug]?.duration ?? plan.durationDays}
                    onChange={(e) => setPlanEdits((prev) => ({
                      ...prev,
                      [plan.slug]: { ...prev[plan.slug], duration: Number(e.target.value) },
                    }))}
                    className="w-full h-11 mt-1 px-3 border border-[#E5E7EB] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-[#64748B]">Status</label>
                  <select
                    value={planEdits[plan.slug]?.status ?? plan.status ?? 'active'}
                    onChange={(e) => setPlanEdits((prev) => ({
                      ...prev,
                      [plan.slug]: { ...prev[plan.slug], status: e.target.value },
                    }))}
                    className="w-full h-11 mt-1 px-3 border border-[#E5E7EB] rounded-xl font-semibold"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <button
                  type="button"
                  disabled={savingPlan === plan.slug}
                  onClick={() => savePlan(plan.slug)}
                  className="w-full py-2.5 bg-[#0F172A] hover:bg-[#00A878] text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm"
                >
                  <Save size={14} /> {savingPlan === plan.slug ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'discounts' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-5">
            <Card title="Create Discount / Promotion" subtitle="Limited-time offers and seasonal campaigns">
              <form onSubmit={submitDiscount} className="space-y-4">
                <input
                  required
                  placeholder="Discount name (e.g. Eid Promotion)"
                  value={discountForm.discountName}
                  onChange={(e) => setDiscountForm((f) => ({ ...f, discountName: e.target.value }))}
                  className="w-full h-11 px-3 border rounded-xl text-sm font-semibold"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#64748B] uppercase">Discount %</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={discountForm.discountPercentage}
                      onChange={(e) => setDiscountForm((f) => ({ ...f, discountPercentage: Number(e.target.value) }))}
                      className="w-full h-11 mt-1 px-3 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#64748B] uppercase">Apply To</label>
                    <select
                      value={discountForm.applyTo}
                      onChange={(e) => setDiscountForm((f) => ({ ...f, applyTo: e.target.value }))}
                      className="w-full h-11 mt-1 px-3 border rounded-xl text-sm"
                    >
                      {APPLY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                {discountForm.applyTo === 'specific_plans' && (
                  <div className="flex flex-wrap gap-2">
                    {PLAN_SLUGS.map((slug) => (
                      <label key={slug} className="flex items-center gap-2 text-sm capitalize">
                        <input
                          type="checkbox"
                          checked={discountForm.applicablePlans.includes(slug)}
                          onChange={(e) => setDiscountForm((f) => ({
                            ...f,
                            applicablePlans: e.target.checked
                              ? [...f.applicablePlans, slug]
                              : f.applicablePlans.filter((s) => s !== slug),
                          }))}
                        />
                        {slug}
                      </label>
                    ))}
                  </div>
                )}
                {discountForm.applyTo === 'specific_categories' && (
                  <input
                    placeholder="Categories (comma separated: cricket, football)"
                    value={discountForm.applicableCategories.join(', ')}
                    onChange={(e) => setDiscountForm((f) => ({
                      ...f,
                      applicableCategories: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    }))}
                    className="w-full h-11 px-3 border rounded-xl text-sm"
                  />
                )}
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={discountForm.startDate} onChange={(e) => setDiscountForm((f) => ({ ...f, startDate: e.target.value }))} className="h-11 px-3 border rounded-xl text-sm" />
                  <input type="date" value={discountForm.endDate} onChange={(e) => setDiscountForm((f) => ({ ...f, endDate: e.target.value }))} className="h-11 px-3 border rounded-xl text-sm" />
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={discountForm.isPromotion}
                    onChange={(e) => setDiscountForm((f) => ({ ...f, isPromotion: e.target.checked }))}
                  />
                  Mark as promotional campaign
                </label>
                {discountForm.isPromotion && (
                  <input
                    placeholder="Promotion tag (e.g. Ramadan Offer)"
                    value={discountForm.promotionTag}
                    onChange={(e) => setDiscountForm((f) => ({ ...f, promotionTag: e.target.value }))}
                    className="w-full h-11 px-3 border rounded-xl text-sm"
                  />
                )}
                <button type="submit" disabled={creatingDiscount} className="w-full py-3 bg-[#00A878] text-white font-bold rounded-xl flex items-center justify-center gap-2">
                  <Plus size={16} /> Create Offer
                </button>
              </form>
            </Card>
          </div>

          <div className="xl:col-span-7 space-y-5">
            {[
              { key: 'activeDiscounts', title: 'Active Discounts', icon: Percent },
              { key: 'upcomingDiscounts', title: 'Upcoming Discounts', icon: Calendar },
              { key: 'expiredDiscounts', title: 'Expired Discounts', icon: Tag },
            ].map(({ key, title, icon: Icon }) => (
              <Card key={key} title={title}>
                {(center?.[key] || []).length === 0 ? (
                  <p className="text-sm text-[#64748B] py-4 text-center">None</p>
                ) : (
                  <div className="space-y-2">
                    {center[key].map((d) => (
                      <div key={d._id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#E5E7EB] bg-[#FAFBFC]">
                        <div>
                          <p className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
                            {d.isPromotion && <Sparkles size={14} className="text-[#00A878]" />}
                            {d.discountName}
                            <span className="text-[#00A878]">{d.discountPercentage}% OFF</span>
                          </p>
                          <p className="text-xs text-[#64748B]">
                            {formatAdDateRange(d.startDate, d.endDate)} · {d.applyTo.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <button type="button" onClick={() => handleToggleDiscount(d._id)} className="text-[#64748B] hover:text-[#00A878]" title="Enable / Disable">
                          {d.status === 'inactive' ? <ToggleLeft size={22} /> : <ToggleRight size={22} className="text-[#00A878]" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
            <Card title="Revenue Impact">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#E8FFF5] border border-[#00A878]/20">
                  <p className="text-xs font-bold uppercase text-[#64748B] flex items-center gap-1"><Banknote size={14} /> Total Revenue</p>
                  <p className="text-xl font-black text-[#0F172A] mt-1">{formatPKR(center?.revenueImpact?.totalRevenue || 0)}</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="text-xs font-bold uppercase text-[#64748B]">Discount Savings Given</p>
                  <p className="text-xl font-black text-amber-700 mt-1">{formatPKR(center?.revenueImpact?.totalDiscountSavings || 0)}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <Card title="Pricing Audit Log" subtitle="Who changed prices, old vs new, and when">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-black uppercase text-[#94A3B8] border-b">
                  <th className="pb-3 pr-4">Plan</th>
                  <th className="pb-3 pr-4">Admin</th>
                  <th className="pb-3 pr-4">Old Price</th>
                  <th className="pb-3 pr-4">New Price</th>
                  <th className="pb-3">Changed At</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(center?.pricingHistory || []).map((row) => (
                  <tr key={row._id}>
                    <td className="py-3 pr-4 font-bold">{row.planName}</td>
                    <td className="py-3 pr-4">{row.adminId?.name || 'Admin'}</td>
                    <td className="py-3 pr-4 line-through text-[#94A3B8]">{formatPKR(row.oldPrice)}</td>
                    <td className="py-3 pr-4 font-black text-[#00A878]">{formatPKR(row.newPrice)}</td>
                    <td className="py-3">{formatAdDateTime(row.changedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !(center?.pricingHistory?.length) && (
              <p className="text-center py-8 text-sm text-[#64748B]">No pricing changes recorded yet.</p>
            )}
          </div>
        </Card>
      )}
    </PageShell>
  );
}
