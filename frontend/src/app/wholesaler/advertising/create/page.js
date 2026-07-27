"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Megaphone, ChevronRight, CreditCard, Sparkles, Tag } from 'lucide-react';
import PageShell from '@/components/dashboard/PageShell';
import PageHeader from '@/components/dashboard/PageHeader';
import Card from '@/components/common/Card';
import { getApiBaseUrl } from '@/lib/api';
import { formatPKR } from '@/lib/financeUtils';
import { CAMPAIGN_TYPES } from '@/lib/advertisingConfig';
import {
  computeCampaignEndDate,
  formatAdDate,
  formatAdDateRange,
  getPlanDurationDays,
  getTodayDateInput,
} from '@/lib/adDateUtils';
import { createCampaign, fetchAdPlans, createCheckoutSession } from '@/lib/advertisingApi';

export default function CreateAdvertisementPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    productId: '',
    campaignType: 'sponsored_product',
    plan: 'starter',
    description: '',
    startDate: getTodayDateInput(),
    customMedia: '',
  });

  const [uploadingMedia, setUploadingMedia] = useState(false);

  const todayInput = getTodayDateInput();

  const loadData = useCallback(async (productCategory = null) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const base = getApiBaseUrl();
      const [productsRes, plansRes] = await Promise.all([
        fetch(`${base}/api/products?scope=inventory`, { headers }),
        fetchAdPlans(productCategory),
      ]);
      const productsData = await productsRes.json();
      if (productsData.success) setProducts(productsData.data || []);
      setPlans(plansRes.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const selectedProduct = useMemo(
    () => products.find((p) => p._id === form.productId),
    [products, form.productId]
  );

  useEffect(() => {
    if (selectedProduct?.category) {
      fetchAdPlans(selectedProduct.category)
        .then((res) => setPlans(res.data || []))
        .catch(() => {});
    }
  }, [selectedProduct?.category, form.productId]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.slug === form.plan),
    [plans, form.plan]
  );

  const displayPrice = selectedPlan?.finalPrice ?? selectedPlan?.price;
  const originalPrice = selectedPlan?.originalPrice ?? selectedPlan?.price;
  const hasDiscount = (selectedPlan?.discountPercent || 0) > 0;

  const endDate = useMemo(
    () => computeCampaignEndDate(form.startDate, selectedPlan || form.plan),
    [selectedPlan, form.plan, form.startDate]
  );

  const planDurationDays = getPlanDurationDays(selectedPlan || form.plan);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.productId) {
      setError('Please select a product');
      return;
    }
    if (!endDate) {
      setError('Please select a valid start date and plan');
      return;
    }
    try {
      setSubmitting(true);
      const created = await createCampaign({
        productId: form.productId,
        campaignType: form.campaignType,
        plan: form.plan,
        description: form.description,
        startDate: form.startDate,
        endDate,
        submitForPayment: true,
        customMedia: form.customMedia || null,
      });
      const campaignId = created.data?._id;
      
      const checkoutRes = await createCheckoutSession(campaignId);
      if (checkoutRes.success && checkoutRes.url) {
        window.location.href = checkoutRes.url;
      } else {
        throw new Error('Failed to initialize secure payment.');
      }
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Create Advertisement"
        subtitle="Promote your product to wholesalers across the GearUp marketplace"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Campaign Setup" subtitle="Select product, plan, and schedule">
            {loading ? (
              <p className="text-sm text-[#64748B]">Loading…</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
                )}

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Product to Promote</label>
                  <select
                    value={form.productId}
                    onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all shadow-sm appearance-none cursor-pointer"
                    required
                  >
                    <option value="" disabled>Select your product</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>{p.name} — {p.category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Campaign Type</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {CAMPAIGN_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, campaignType: type.value }))}
                        className={`p-4 rounded-xl border-2 text-left text-sm font-bold transition-all relative ${
                          form.campaignType === type.value
                            ? 'border-slate-900 bg-slate-50 text-slate-900 shadow-sm'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white hover:bg-slate-50'
                        }`}
                      >
                        {type.label}
                        {form.campaignType === type.value && (
                          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-slate-900"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {form.campaignType === 'homepage_featured' && (
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      Custom Homepage Media <span className="normal-case font-medium text-slate-400">(Optional)</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,video/mp4,video/webm"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          setUploadingMedia(true);
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            const token = localStorage.getItem('token');
                            const res = await fetch(`${getApiBaseUrl()}/api/upload?type=gearup`, {
                              method: 'POST',
                              headers: { Authorization: `Bearer ${token}` },
                              body: formData
                            });
                            const data = await res.json();
                            if (data.success) {
                              setForm(f => ({ ...f, customMedia: data.filePath }));
                            } else {
                              alert(data.error || 'Upload failed');
                            }
                          } catch (err) {
                            alert('Upload error');
                          } finally {
                            setUploadingMedia(false);
                          }
                        }}
                        className="text-sm file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 file:cursor-pointer cursor-pointer transition-colors"
                      />
                      {uploadingMedia && <span className="text-xs text-slate-500 font-bold flex items-center gap-2"><div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> Uploading...</span>}
                    </div>
                    {form.customMedia && (
                      <p className="text-xs text-emerald-600 mt-3 font-semibold flex items-center gap-1.5 bg-emerald-50 w-fit px-3 py-1.5 rounded-lg border border-emerald-100">
                        <Sparkles size={12} /> Media uploaded successfully
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      Stand out on the homepage with a custom banner image or video (Max 50MB). If not provided, your product image will be used.
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">Advertisement Package</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {plans.map((plan) => (
                      <button
                        key={plan.slug}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, plan: plan.slug }))}
                        className={`p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${
                          form.plan === plan.slug
                            ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-4 ring-emerald-500/10'
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                        }`}
                      >
                        {form.plan === plan.slug && (
                          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                            Selected
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={16} className={form.plan === plan.slug ? 'text-emerald-500' : 'text-slate-400'} />
                          <span className="font-heading font-black text-base text-slate-900">{plan.name}</span>
                        </div>
                        <p className="text-xs font-medium text-slate-500 mb-4">{plan.durationDays || plan.duration} days · {plan.visibilityTier} visibility</p>
                        
                        <div className="border-t border-slate-100 pt-3 mt-auto">
                          {plan.discountPercent > 0 ? (
                            <div className="space-y-1">
                              <p className="text-xs text-slate-400 line-through font-medium">{formatPKR(plan.originalPrice ?? plan.price)}</p>
                              <div className="flex items-baseline gap-2">
                                <p className="text-xl font-black text-slate-900">{formatPKR(plan.finalPrice ?? plan.price)}</p>
                              </div>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-black uppercase mt-1 border border-amber-100">
                                <Tag size={10} /> {plan.discountPercent}% OFF · Save {formatPKR(plan.savings || 0)}
                              </span>
                            </div>
                          ) : (
                            <p className="text-xl font-black text-slate-900">{formatPKR(plan.price)}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Campaign Start Date</label>
                    <input
                      type="date"
                      value={form.startDate}
                      min={todayInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value && value < todayInput) return;
                        setForm((f) => ({ ...f, startDate: value }));
                      }}
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all shadow-sm"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-2 font-medium">{formatAdDate(form.startDate)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      Campaign End Date <span className="normal-case font-medium text-slate-400 ml-1">(Auto-calculated)</span>
                    </label>
                    <div className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm bg-slate-100 flex items-center shadow-sm">
                      <span className="font-semibold text-slate-700">{endDate ? formatAdDate(endDate) : 'Select a plan'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Campaign Description <span className="normal-case font-medium text-slate-400 ml-1">(Optional)</span></label>
                  <textarea
                    placeholder="Write a custom note to display on your featured advertisement..."
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all shadow-sm resize-none"
                  />
                </div>

                <div className="pt-4 mt-6 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={submitting || !selectedPlan}
                    className="w-full h-14 bg-slate-900 hover:bg-slate-800 focus:ring-4 focus:ring-slate-900/10 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg text-base"
                  >
                    {submitting ? (
                      <><div className="w-5 h-5 border-[2.5px] border-slate-400 border-t-white rounded-full animate-spin"></div> Processing…</>
                    ) : (
                      <>Continue to Secure Payment <ChevronRight size={18} /></>
                    )}
                  </button>
                  <p className="text-center text-[11px] font-medium text-slate-500 mt-4">
                    You will be securely redirected to Stripe to complete your payment.
                  </p>
                </div>
              </form>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Payment Summary">
            <div className="space-y-4 text-sm mt-2">
              <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Plan selected</span><span className="font-bold text-slate-900">{selectedPlan?.name || '—'}</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Duration</span><span className="font-bold text-slate-900">{planDurationDays} days</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Dates</span><span className="font-bold text-slate-900 text-right">{formatAdDateRange(form.startDate, endDate)}</span></div>
              {hasDiscount && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Original Price</span><span className="line-through text-slate-400 font-medium">{formatPKR(originalPrice)}</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Discount</span><span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">{selectedPlan.discountPercent}% OFF</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">You Save</span><span className="font-bold text-emerald-600">{formatPKR(selectedPlan.savings || 0)}</span></div>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-slate-200 pt-4 mt-4">
                <span className="font-bold text-base text-slate-900">Total Due</span>
                <span className="font-black text-2xl tracking-tight text-slate-900">{selectedPlan ? formatPKR(displayPrice) : '—'}</span>
              </div>
            </div>
          </Card>
          
          <Card title="Payment Method">
            <div className="space-y-3 mt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <CreditCard size={18} className="text-slate-700 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-0.5">Stripe Checkout</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Secure payment powered by Stripe.</p>
                </div>
              </div>
            </div>
          </Card>
          
          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 text-sm text-blue-800 leading-relaxed font-medium flex gap-3">
            <Sparkles className="shrink-0 text-blue-500 mt-0.5" size={18} />
            <div>
              Secure payments are processed using Stripe.<br/><br/>
              After successful payment, your advertisement will be submitted for admin review.<br/><br/>
              Once approved, your campaign will automatically become active according to the selected schedule.
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
