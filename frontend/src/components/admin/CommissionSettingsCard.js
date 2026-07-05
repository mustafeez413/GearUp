"use client";

import React, { useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import { Percent, Building2, Store, Save, ToggleLeft, ToggleRight, Banknote, CheckCircle2 } from 'lucide-react';

const CommissionSettingsCard = ({ totalEarned = 0, onSaved }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commissionEnabled, setCommissionEnabled] = useState(true);
  const [platformFeePercentage, setPlatformFeePercentage] = useState('3');
  const [commissionChargedTo, setCommissionChargedTo] = useState('manufacturer');

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/admin/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && json.data) {
          setCommissionEnabled(json.data.commissionEnabled ?? true);
          setPlatformFeePercentage(String(json.data.platformFeePercentage ?? 3));
          setCommissionChargedTo(json.data.commissionChargedTo || 'manufacturer');
        } else {
          toast.error(json.error || 'Could not load commission settings');
        }
      } catch {
        toast.error('Could not load commission settings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    const rate = Number(platformFeePercentage);
    if (commissionEnabled && (Number.isNaN(rate) || rate < 0.1)) {
      toast.error('Commission rate must be at least 0.1%');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${getApiBaseUrl()}/api/transactions/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          commissionEnabled,
          platformFeePercentage: commissionEnabled ? rate : 0,
          commissionChargedTo
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Commission settings saved');
        onSaved?.(json.data);
      } else {
        toast.error(json.error || 'Failed to save settings');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto rounded-[18px] border border-[#E2E8F0] bg-white p-12 flex items-center justify-center min-h-[320px]">
        <div className="w-8 h-8 border-2 border-[#E2E8F0] border-b-[#10B981] rounded-full animate-spin" />
      </div>
    );
  }

  const payerLabel = commissionChargedTo === 'manufacturer' ? 'Manufacturer' : 'Wholesaler';

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 rounded-[18px] border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <h3 className="text-[15px] font-semibold text-[#0F172A]">Commission settings</h3>
          <p className="text-[13px] text-[#64748B] mt-1">Configure platform fee rate and payer assignment.</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-4">
            <div>
              <p className="text-[14px] font-semibold text-[#0F172A]">Charge commission</p>
              <p className="text-[13px] text-[#64748B] mt-1">
                {commissionEnabled ? 'Commission applies to new orders' : 'No commission on new orders'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCommissionEnabled((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 text-[12px] font-semibold transition-colors ${
                commissionEnabled
                  ? 'border-[#A7F3D0] bg-[rgba(16,185,129,0.12)] text-[#047857]'
                  : 'border-[#E2E8F0] bg-white text-[#64748B]'
              }`}
            >
              {commissionEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {commissionEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className={commissionEnabled ? '' : 'opacity-50 pointer-events-none'}>
            <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#64748B] mb-2">
              Commission rate (%)
            </label>
            <div className="relative max-w-xs">
              <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={platformFeePercentage}
                onChange={(e) => setPlatformFeePercentage(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-[12px] border border-[#E2E8F0] text-[14px] font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
                placeholder="e.g. 3"
              />
            </div>
            <p className="text-[12px] text-[#94A3B8] mt-2">Minimum 0.1% when commission is enabled</p>
          </div>

          <div className={commissionEnabled ? '' : 'opacity-50 pointer-events-none'}>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#64748B] mb-3">
              Charge commission from
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCommissionChargedTo('manufacturer')}
                className={`flex items-center gap-3 rounded-[14px] border p-4 text-left transition-all ${
                  commissionChargedTo === 'manufacturer'
                    ? 'border-[#10B981] bg-[rgba(16,185,129,0.06)] shadow-[0_0_0_1px_rgba(16,185,129,0.15)]'
                    : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                }`}
              >
                <div className={`grid h-10 w-10 place-items-center rounded-[10px] ${
                  commissionChargedTo === 'manufacturer' ? 'bg-[#10B981] text-white' : 'bg-[#F8FAFC] text-[#64748B]'
                }`}>
                  <Building2 size={18} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#0F172A]">Manufacturer</p>
                  <p className="text-[12px] text-[#64748B] mt-0.5">Deducted from seller payout</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setCommissionChargedTo('wholesaler')}
                className={`flex items-center gap-3 rounded-[14px] border p-4 text-left transition-all ${
                  commissionChargedTo === 'wholesaler'
                    ? 'border-[#10B981] bg-[rgba(16,185,129,0.06)] shadow-[0_0_0_1px_rgba(16,185,129,0.15)]'
                    : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                }`}
              >
                <div className={`grid h-10 w-10 place-items-center rounded-[10px] ${
                  commissionChargedTo === 'wholesaler' ? 'bg-[#10B981] text-white' : 'bg-[#F8FAFC] text-[#64748B]'
                }`}>
                  <Store size={18} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#0F172A]">Wholesaler</p>
                  <p className="text-[12px] text-[#64748B] mt-0.5">Added to buyer order total</p>
                </div>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#0F172A] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1E293B] disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 rounded-[18px] border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden lg:sticky lg:top-6">
        <div className="px-6 py-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <h3 className="text-[15px] font-semibold text-[#0F172A]">Commission summary</h3>
          <p className="text-[13px] text-[#64748B] mt-1">Live impact of your current configuration.</p>
        </div>
        <div className="p-6 space-y-5">
          <div className="rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#64748B]">Total earned</p>
            <p className="mt-2 flex items-center gap-2 text-[28px] font-bold text-[#0F172A] tabular-nums">
              <Banknote size={22} className="text-[#10B981]" />
              PKR {totalEarned.toLocaleString()}
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[#F1F5F9]">
              <span className="text-[14px] text-[#64748B]">Active rate</span>
              <span className="text-[14px] font-semibold text-[#0F172A] tabular-nums">
                {commissionEnabled ? `${platformFeePercentage}%` : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#F1F5F9]">
              <span className="text-[14px] text-[#64748B]">Commission payer</span>
              <span className="text-[14px] font-semibold text-[#0F172A]">{payerLabel}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[14px] text-[#64748B]">Status</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                commissionEnabled
                  ? 'bg-[rgba(16,185,129,0.12)] text-[#047857]'
                  : 'bg-[#F1F5F9] text-[#64748B]'
              }`}>
                <CheckCircle2 size={12} />
                {commissionEnabled ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <p className="text-[13px] text-[#64748B] leading-relaxed">
            Changes apply to new orders only. Existing transactions retain their original commission terms.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommissionSettingsCard;
