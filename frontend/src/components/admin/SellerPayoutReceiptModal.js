'use client';

import React, { useEffect, useState } from 'react';
import UserAvatar from '@/components/ui/UserAvatar';
import { createPortal } from 'react-dom';
import { X, Banknote, Wallet, TrendingUp, Percent, Receipt, Clock, CheckCircle } from 'lucide-react';
import { PAYOUT_STATUS, normalizePayoutStatus, getPayoutStatusLabel, getPayoutDisplayAmounts, formatPKR } from '@/lib/adminOperationsUtils';

const fmt = (n) => (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getPayoutStatusMeta(status) {
  const normalized = normalizePayoutStatus(status);
  const map = {
    Holding: { label: 'Holding', tone: 'bg-amber-50 text-amber-900 border-amber-200', dot: 'bg-[#F59E0B]' },
    Approved: { label: 'Approved', tone: 'bg-emerald-50 text-emerald-900 border-emerald-200', dot: 'bg-[#10B981]' },
    Refunded: { label: 'Refunded', tone: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-[#64748B]' },
  };
  return map[normalized] || map.Holding;
}

function SectionCard({ title, icon: Icon, children }) {
  return (
    <section className="bg-white rounded-[16px] border border-[#E2E8F0] p-4 sm:p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
        {Icon && <Icon size={16} className="text-[#64748B]" />}
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function SellerPayoutReceiptModal({ payout, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!payout || !mounted) return null;

  const resolvedStatus = normalizePayoutStatus(payout.status, payout);
  const statusMeta = getPayoutStatusMeta(resolvedStatus);
  statusMeta.label = getPayoutStatusLabel(payout);
  const seller = payout.seller || {};
  const order = payout.order || {};
  const amounts = getPayoutDisplayAmounts(payout);
  const sellerName = seller.businessDetails?.businessName || seller.name || 'Unknown Seller';
  const sellerTxnId = payout.sellerTransactionId || 'N/A';
  const buyerTxnId = payout.buyerTransactionId || order.transactionReference || 'N/A';

  const modal = (
    <div className="fixed inset-0 z-[9999] grid place-items-center p-3 sm:p-6" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-[#0F172A]/55 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div
        className="relative bg-[#F8FAFC] rounded-[20px] w-full max-w-[900px] max-h-[94vh] flex flex-col border border-[#E2E8F0] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white border-b border-[#E2E8F0] px-5 sm:px-8 py-5 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <UserAvatar user={seller} name={sellerName} size="lg" rounded="md" variant="gradient" bordered={false} />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Payout Details</p>
                <h2 className="text-xl font-bold text-[#111827] mt-1">{sellerName}</h2>
                <p className="text-[12px] text-[#64748B] mt-1">
                  Payout #{String(payout._id).slice(-8).toUpperCase()} · {formatDate(payout.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border ${statusMeta.tone}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                {statusMeta.label}
              </span>
              <button type="button" onClick={onClose} className="p-2 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]" aria-label="Close">
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard icon={TrendingUp} label="Gross Amount" value={formatPKR(amounts.gross)} />
            <SummaryCard icon={Percent} label="Commission" value={formatPKR(amounts.commission)} tone="text-rose-600" />
            <SummaryCard icon={Wallet} label="Net Payable" value={formatPKR(amounts.net)} tone="text-[#10B981]" highlight />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SectionCard title="Order Information" icon={Receipt}>
              <dl className="space-y-3 text-sm">
                <InfoRow label="Order ID" value={`#${order._id ? String(order._id).slice(-8).toUpperCase() : '—'}`} mono />
                <InfoRow label="Order Status" value={order.status || '—'} />
                <InfoRow label="Payment Status" value={order.paymentStatus || '—'} />
                <InfoRow label="Order Date" value={formatDate(order.createdAt)} />
              </dl>
            </SectionCard>

            <SectionCard title="Transaction Information" icon={Banknote}>
              <dl className="space-y-3 text-sm">
                <InfoRow label="Seller Transaction ID" value={sellerTxnId} mono />
                <InfoRow label="Buyer Transaction ID" value={buyerTxnId} mono />
              </dl>
              <p className="text-[12px] text-[#64748B] mt-4 leading-relaxed">
                Settlement is processed automatically when delivery is confirmed and escrow conditions are met.
              </p>
            </SectionCard>
          </div>

          <SectionCard title="Payment Timeline" icon={Clock}>
            <ol className="space-y-3">
              <TimelineStep done label="Payout Created" at={payout.createdAt} />
              <TimelineStep
                done={resolvedStatus === PAYOUT_STATUS.APPROVED}
                pending={resolvedStatus === PAYOUT_STATUS.HOLDING}
                label="Instant Payouts"
                at={payout.paymentDate}
              />
              <TimelineStep
                done={resolvedStatus === PAYOUT_STATUS.REFUNDED}
                label="Refunded"
                at={resolvedStatus === PAYOUT_STATUS.REFUNDED ? payout.updatedAt : null}
              />
            </ol>
          </SectionCard>
        </div>

        <div className="bg-white border-t border-[#E2E8F0] px-5 sm:px-8 py-4 shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl border border-[#E2E8F0] bg-white text-sm font-semibold text-[#64748B] hover:bg-[#F8FAFC]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function SummaryCard({ icon: Icon, label, value, tone = 'text-[#111827]', highlight }) {
  return (
    <div className={`rounded-[16px] border border-[#E2E8F0] bg-white p-4 ${highlight ? 'ring-1 ring-emerald-200' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className={highlight ? 'text-[#10B981]' : 'text-[#64748B]'} />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">{label}</p>
      </div>
      <p className={`text-xl font-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[#64748B]">{label}</dt>
      <dd className={`font-semibold text-[#111827] text-right ${mono ? 'font-mono text-[12px]' : ''}`}>{value}</dd>
    </div>
  );
}

function TimelineStep({ label, at, done, pending }) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2">
        {done ? (
          <CheckCircle size={16} className="text-[#10B981]" />
        ) : pending ? (
          <Clock size={16} className="text-[#F59E0B]" />
        ) : (
          <span className="w-4 h-4 rounded-full border-2 border-[#E2E8F0]" />
        )}
        <span className={done ? 'font-semibold text-[#111827]' : 'text-[#64748B]'}>{label}</span>
      </div>
      <span className="text-[12px] text-[#94A3B8] tabular-nums">{at ? formatDate(at) : '—'}</span>
    </li>
  );
}
