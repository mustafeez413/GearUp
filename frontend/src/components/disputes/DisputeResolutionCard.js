"use client";

import React, { useState } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import { dispatchFinancialSync } from '@/lib/financialSync';
import {
  AlertTriangle,
  Clock,
  MessageSquare,
  Shield,
  RotateCcw,
  XCircle,
  CheckCircle2,
  User,
  Store,
  BadgeCheck,
  Gavel,
} from 'lucide-react';

const STATUS_STYLES = {
  open: 'bg-amber-50 text-amber-800 border-amber-200',
  awaiting_seller: 'bg-amber-50 text-amber-800 border-amber-200',
  seller_responded: 'bg-amber-50 text-amber-800 border-amber-200',
  under_review: 'bg-blue-50 text-blue-800 border-blue-200',
  investigating: 'bg-blue-50 text-blue-800 border-blue-200',
  refunded: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-50 text-red-800 border-red-200',
  resolved: 'bg-slate-50 text-slate-600 border-slate-200',
};

const STATUS_LABELS = {
  open: 'Issue Reported',
  awaiting_seller: 'Awaiting Seller Response',
  seller_responded: 'Seller Responded',
  under_review: 'Under Admin Review',
  investigating: 'Investigating',
  refunded: 'Refunded to Buyer',
  rejected: 'Claim Denied',
  resolved: 'Closed',
};

function formatStatus(s) {
  return STATUS_LABELS[s] || s?.replace(/_/g, ' ');
}

function getTimelineMeta(action) {
  const act = String(action || '').toLowerCase();
  if (act.includes('refund')) {
    return { icon: RotateCcw, label: 'Refund Event', tone: 'bg-emerald-50 text-emerald-800 border-emerald-200', line: 'bg-emerald-400', dot: 'border-emerald-400 bg-emerald-50' };
  }
  if (act.includes('reject') || act.includes('deny')) {
    return { icon: XCircle, label: 'Resolution', tone: 'bg-red-50 text-red-800 border-red-200', line: 'bg-red-400', dot: 'border-red-400 bg-red-50' };
  }
  if (act.includes('seller') || act.includes('respond')) {
    return { icon: Store, label: 'Seller Response', tone: 'bg-violet-50 text-violet-800 border-violet-200', line: 'bg-violet-400', dot: 'border-violet-400 bg-violet-50' };
  }
  if (act.includes('buyer')) {
    return { icon: User, label: 'Buyer Response', tone: 'bg-sky-50 text-sky-800 border-sky-200', line: 'bg-sky-400', dot: 'border-sky-400 bg-sky-50' };
  }
  if (act.includes('admin') || act.includes('investigat') || act.includes('message')) {
    return { icon: Shield, label: 'Admin Message', tone: 'bg-blue-50 text-blue-800 border-blue-200', line: 'bg-blue-400', dot: 'border-blue-400 bg-blue-50' };
  }
  if (act.includes('open') || act.includes('report')) {
    return { icon: AlertTriangle, label: 'Issue Opened', tone: 'bg-amber-50 text-amber-800 border-amber-200', line: 'bg-amber-400', dot: 'border-amber-400 bg-amber-50' };
  }
  if (act.includes('resolve') || act.includes('close')) {
    return { icon: CheckCircle2, label: 'Resolution', tone: 'bg-slate-50 text-slate-700 border-slate-200', line: 'bg-slate-400', dot: 'border-slate-400 bg-slate-50' };
  }
  return { icon: Gavel, label: 'Activity', tone: 'bg-slate-50 text-slate-700 border-slate-200', line: 'bg-slate-300', dot: 'border-slate-300 bg-white' };
}

export default function DisputeResolutionCard({ dispute, role, onRefresh }) {
  const [sellerMessage, setSellerMessage] = useState('');
  const [buyerMessage, setBuyerMessage] = useState('');
  const [adminSellerMsg, setAdminSellerMsg] = useState('');
  const [adminBuyerMsg, setAdminBuyerMsg] = useState('');
  const [adminRejectBuyer, setAdminRejectBuyer] = useState('');
  const [adminRejectSeller, setAdminRejectSeller] = useState('');
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  const closed = ['refunded', 'rejected', 'resolved'].includes(dispute.status);
  const orderId = String(dispute.order?._id || dispute.order || '');
  const shortId = orderId.slice(-6).toUpperCase();

  const api = async (url, method, body) => {
    setLoading(url);
    setError('');
    const token = localStorage.getItem('token');
    const res = await fetch(`${getApiBaseUrl()}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Request failed');
    onRefresh?.();
    if (/\/refund/i.test(url)) {
      dispatchFinancialSync({ source: 'dispute-refund', disputeId: dispute._id });
    }
    return data;
  };

  const evidence = dispute.evidenceImages?.length
    ? dispute.evidenceImages
    : dispute.evidence
      ? [dispute.evidence]
      : [];

  return (
    <article className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-[0_4px_20px_rgba(15,23,42,0.04)] overflow-hidden hover:shadow-[0_8px_28px_rgba(15,23,42,0.07)] transition-shadow duration-300">
      {/* Order header */}
      <div className="px-5 sm:px-6 py-4 border-b border-[#F1F5F9] bg-[#FAFBFC]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="text-[#EF4444]" size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Dispute Order</p>
              <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight font-mono">#{shortId}</h2>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${
              STATUS_STYLES[dispute.status] || STATUS_STYLES.open
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            {formatStatus(dispute.status)}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6 flex flex-col gap-6">
        {/* Buyer / Seller / Refund / Status grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <InfoCell label="Buyer" value={dispute.buyer?.name || '—'} />
          <InfoCell label="Seller" value={dispute.seller?.name || dispute.seller?.businessDetails?.companyName || '—'} />
          <InfoCell label="Refund Amount" value={`PKR ${(dispute.refundAmount || 0).toLocaleString()}`} valueClass="text-[#10B981] font-bold" />
          <InfoCell label="Status" value={formatStatus(dispute.status)} />
        </div>

        {/* Dispute reason */}
        <div className="rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] mb-2">Reason for Dispute</p>
          <p className="text-sm font-semibold text-[#0F172A] leading-relaxed">{dispute.reason}</p>
          {dispute.notes && <p className="text-sm text-[#475569] mt-3 leading-relaxed border-t border-[#E2E8F0] pt-3">{dispute.notes}</p>}

          {dispute.sellerRespondDeadline && dispute.status === 'awaiting_seller' && (
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
              <Clock size={14} />
              Deadline for seller response: {new Date(dispute.sellerRespondDeadline).toLocaleString()}
            </div>
          )}
        </div>

        {dispute.sellerResponse?.message && (
          <div className="rounded-[14px] border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 mb-2 flex items-center gap-1.5">
              <Store size={12} /> Manufacturer Response
            </p>
            <p className="text-sm font-medium text-[#0F172A] leading-relaxed">{dispute.sellerResponse.message}</p>
            {dispute.sellerResponse.evidenceImages?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-100">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 mb-2">Manufacturer Evidence</p>
                <div className="flex flex-wrap gap-2">
                  {dispute.sellerResponse.evidenceImages.filter(Boolean).map((src, i) => (
                    <a key={i} href={`${getApiBaseUrl()}${src}`} target="_blank" rel="noopener noreferrer"
                      className="block relative group rounded-xl overflow-hidden border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                      <img src={`${getApiBaseUrl()}${src}`} alt={`Manufacturer evidence ${i + 1}`} className="w-20 h-20 object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {dispute.resolution && closed && (
          <div className="rounded-[14px] border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
              <BadgeCheck size={12} /> Resolution
            </p>
            <p className="text-sm font-medium text-[#0F172A] leading-relaxed">{dispute.resolution}</p>
          </div>
        )}

        {evidence.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] mb-3">Evidence</p>
            <div className="flex flex-wrap gap-3">
              {evidence.filter(Boolean).map((src, i) => {
                const url = `${getApiBaseUrl()}${src}`;
                const isPdf = /\.pdf$/i.test(src);
                const isDoc = /\.(doc|docx)$/i.test(src);

                if (isPdf || isDoc) {
                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#CBD5E1] text-sm font-semibold text-[#0F172A] transition-colors"
                    >
                      {isPdf ? '📄' : '📝'} {isPdf ? 'PDF Document' : 'Document'} — View
                    </a>
                  );
                }

                return (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative group rounded-xl overflow-hidden border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow"
                  >
                    <img src={url} alt="Evidence" className="w-24 h-24 object-cover" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Activity timeline */}
        {dispute.timeline?.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] mb-4">Activity Timeline</p>
            <div className="relative max-h-72 overflow-y-auto pr-1">
              <ol className="relative space-y-0 pl-1">
                {[...dispute.timeline].reverse().map((t, i, arr) => {
                  const meta = getTimelineMeta(t.action);
                  const Icon = meta.icon;
                  const isLast = i === arr.length - 1;

                  return (
                    <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                      {!isLast && (
                        <span className={`absolute left-[15px] top-8 bottom-0 w-px ${meta.line} opacity-40`} aria-hidden />
                      )}
                      <div className={`relative z-[1] w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${meta.dot}`}>
                        <Icon size={14} className="text-current opacity-80" />
                      </div>
                      <div className="flex-1 min-w-0 rounded-[14px] border border-[#E2E8F0] bg-white p-3.5 sm:p-4 shadow-[0_2px_8px_rgba(15,23,42,0.03)] hover:shadow-[0_4px_14px_rgba(15,23,42,0.06)] transition-shadow">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border ${meta.tone}`}>
                            {meta.label}
                          </span>
                          <time className="text-[11px] font-medium text-[#94A3B8] tabular-nums shrink-0">
                            {t.createdAt ? new Date(t.createdAt).toLocaleString() : ''}
                          </time>
                        </div>
                        <p className="font-semibold text-[#0F172A] text-sm capitalize">{t.action?.replace(/_/g, ' ')}</p>
                        {t.message && <p className="text-sm text-[#475569] mt-1.5 leading-relaxed">{t.message}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm font-semibold">{error}</div>
        )}

        {/* Actions: Seller — evidence submission only, no financial authority */}
        {role === 'seller' && !closed && (
          <div className="flex flex-col gap-3 pt-4 border-t border-[#E2E8F0]">
            <p className="text-sm text-[#64748B] font-medium">Provide your explanation and supporting evidence. The GearUp admin team will review all submissions and decide the outcome.</p>
            <textarea
              value={sellerMessage}
              onChange={(e) => setSellerMessage(e.target.value)}
              rows={3}
              placeholder="Your explanation or response to the buyer's complaint…"
              className="w-full text-sm rounded-xl border border-[#E2E8F0] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#10B981]/15 focus:border-[#10B981]"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!!loading || !sellerMessage.trim()}
                onClick={async () => {
                  try {
                    await api(`/api/disputes/${dispute._id}/seller/respond`, 'PUT', { message: sellerMessage });
                    setSellerMessage('');
                  } catch (e) {
                    setError(e.message);
                  } finally {
                    setLoading('');
                  }
                }}
                className="btn-secondary"
              >
                <MessageSquare size={16} className="inline mr-1" /> Submit Response & Evidence
              </button>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-1">Only the GearUp Admin can approve refunds or release payments. Your role is to provide evidence and context.</p>
          </div>
        )}

        {/* Actions: Admin */}
        {role === 'admin' && !closed && (
          <div className="flex flex-col gap-4 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              disabled={!!loading}
              onClick={async () => {
                try {
                  await api(`/api/disputes/${dispute._id}/admin/request-seller`, 'PUT', {
                    message: adminSellerMsg || 'Please respond with your side of the story and any proof within 48 hours.',
                  });
                  setAdminSellerMsg('');
                } catch (e) {
                  setError(e.message);
                } finally {
                  setLoading('');
                }
              }}
              className="btn-secondary w-fit"
            >
              <Shield size={16} className="inline mr-1" /> Ask seller to respond (48h)
            </button>

            <div className="grid sm:grid-cols-2 gap-4">
              <AdminMessageBlock
                label="Message to buyer"
                value={adminBuyerMsg}
                onChange={setAdminBuyerMsg}
                placeholder="Update buyer on investigation…"
                disabled={!!loading}
                onSend={async () => {
                  try {
                    await api(`/api/disputes/${dispute._id}/admin/message`, 'POST', {
                      target: 'buyer',
                      message: adminBuyerMsg,
                    });
                    setAdminBuyerMsg('');
                  } catch (e) {
                    setError(e.message);
                  } finally {
                    setLoading('');
                  }
                }}
              />
              <AdminMessageBlock
                label="Message to seller"
                value={adminSellerMsg}
                onChange={setAdminSellerMsg}
                placeholder="Ask seller for proof or explanation…"
                disabled={!!loading}
                onSend={async () => {
                  try {
                    await api(`/api/disputes/${dispute._id}/admin/message`, 'POST', {
                      target: 'seller',
                      message: adminSellerMsg,
                    });
                    setAdminSellerMsg('');
                  } catch (e) {
                    setError(e.message);
                  } finally {
                    setLoading('');
                  }
                }}
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                disabled={!!loading}
                onClick={async () => {
                  if (!confirm('Approve Stripe Refund to buyer? This will trigger the Stripe Refund API and cannot be undone.')) return;
                  try {
                    await api(`/api/disputes/${dispute._id}/refund`, 'PUT', {
                      resolution: 'Admin approved refund after reviewing evidence.',
                    });
                  } catch (e) {
                    setError(e.message);
                  } finally {
                    setLoading('');
                  }
                }}
                className="btn-primary"
              >
                <RotateCcw size={16} className="inline mr-1" /> Approve Stripe Refund
              </button>
              <button
                type="button"
                disabled={!!loading}
                onClick={async () => {
                  if (!confirm('Close dispute without refund (e.g. invalid/false claim)?')) return;
                  try {
                    await api(`/api/disputes/${dispute._id}/admin/reject`, 'PUT', {
                      resolution: 'Claim reviewed — insufficient evidence for refund.',
                      messageToBuyer:
                        adminRejectBuyer ||
                        'We reviewed your claim and could not approve a refund. Contact support if you have more evidence.',
                      messageToSeller: adminRejectSeller || 'Dispute closed in your favor after review.',
                    });
                    setAdminRejectBuyer('');
                    setAdminRejectSeller('');
                  } catch (e) {
                    setError(e.message);
                  } finally {
                    setLoading('');
                  }
                }}
                className="btn-danger"
              >
                <XCircle size={16} className="inline mr-1" /> Deny claim
              </button>
            </div>
          </div>
        )}

        {/* Actions: Buyer */}
        {role === 'buyer' && !closed && (
          <div className="flex flex-col gap-3 pt-4 border-t border-[#E2E8F0]">
            <p className="text-sm font-medium text-[#64748B]">
              {dispute.status === 'seller_responded'
                ? 'The seller has replied. Add your follow-up below — GearUp support and the seller will be notified.'
                : 'Add a message or more details about your issue. The seller and our team will be notified.'}
            </p>
            <textarea
              value={buyerMessage}
              onChange={(e) => setBuyerMessage(e.target.value)}
              rows={3}
              placeholder="Your reply or additional details…"
              className="w-full text-sm rounded-xl border border-[#E2E8F0] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#10B981]/15 focus:border-[#10B981]"
            />
            <button
              type="button"
              disabled={!!loading || !buyerMessage.trim()}
              onClick={async () => {
                try {
                  await api(`/api/disputes/${dispute._id}/buyer/respond`, 'PUT', {
                    message: buyerMessage,
                  });
                  setBuyerMessage('');
                } catch (e) {
                  setError(e.message);
                } finally {
                  setLoading('');
                }
              }}
              className="btn-primary w-fit"
            >
              <MessageSquare size={16} className="inline mr-1" /> Send reply
            </button>
          </div>
        )}

        {closed && (
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3.5 flex items-center justify-center mt-1">
            <span className="text-sm font-semibold text-[#64748B] text-center">
              This dispute is closed. Check notifications for updates from GearUp support.
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

function InfoCell({ label, value, valueClass = 'text-[#0F172A] font-semibold' }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] px-4 py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] mb-1">{label}</p>
      <p className={`text-sm ${valueClass}`}>{value}</p>
    </div>
  );
}

function AdminMessageBlock({ label, value, onChange, placeholder, disabled, onSend }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] p-4">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full text-sm rounded-lg border border-[#E2E8F0] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#10B981]/15"
        placeholder={placeholder}
      />
      <button type="button" disabled={disabled || !value.trim()} onClick={onSend} className="btn-secondary text-[11px] self-start">
        Send to {label.replace('Message to ', '')}
      </button>
    </div>
  );
}
