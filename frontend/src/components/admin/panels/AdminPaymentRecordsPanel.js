'use client';

import { useState } from 'react';
import {
  X,
  ArrowRight,
  CheckCircle,
  Receipt,
  Clock,
  Percent,
  Banknote,
  User,
  Building2,
  Smartphone,
  Minus,
  Equal,
} from 'lucide-react';
import { EnterpriseKpiGrid, EnterpriseKpiTile } from '@/components/admin/ui/EnterpriseKpi';

function PayoutStatusBadge({ status, size = 'default' }) {
  const normalized = status || 'Pending';
  const compact = size === 'compact';

  if (normalized === 'Pending' || normalized === 'Holding' || normalized === 'Held') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border bg-[rgba(245,158,11,0.12)] border-[rgba(245,158,11,0.25)] text-[#B45309] font-semibold uppercase tracking-wide ${
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
      }`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
        {normalized}
      </span>
    );
  }

  if (normalized === 'Failed' || normalized === 'Refunded') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.25)] text-[#DC2626] font-semibold uppercase tracking-wide ${
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
      }`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
        {normalized}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border bg-[rgba(16,185,129,0.12)] border-[rgba(16,185,129,0.25)] text-[#047857] font-semibold uppercase tracking-wide ${
      compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
    }`}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
      {normalized}
    </span>
  );
}

function hasBankDetails(details) {
  if (!details) return false;
  return Boolean(
    details.bankName ||
      details.accountTitle ||
      details.accountNumber ||
      details.iban
  );
}

function hasMobileWallet(details) {
  if (!details) return false;
  return Boolean(details.jazzCashNumber || details.easypaisaNumber);
}

function getPayoutAmounts(tx) {
  const commission = tx?.deductedCommission || 0;
  const netPayable = tx?.sellerAmount ?? tx?.amount ?? 0;
  const grossAmount = netPayable + commission;
  return { grossAmount, commission, netPayable };
}

function ModalSection({ title, icon: Icon, children }) {
  return (
    <section className="rounded-[16px] border border-[#E2E8F0] bg-white overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="grid h-8 w-8 place-items-center rounded-[10px] bg-white border border-[#E2E8F0] text-[#10B981]">
          <Icon size={15} strokeWidth={1.75} />
        </div>
        <h4 className="text-[13px] font-semibold text-[#0F172A]">{title}</h4>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function DetailField({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">{label}</p>
      <p
        className={`mt-1.5 text-[14px] font-semibold break-words ${
          mono ? 'font-mono text-[#475569]' : 'text-[#0F172A]'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SellerPaymentDetailsModal({ payout, onClose }) {
  if (!payout) return null;

  const seller = payout.seller || {};
  const details = seller.paymentDetails || {};
  const { grossAmount, commission, netPayable } = getPayoutAmounts(payout);
  const bankProvided = hasBankDetails(details);
  const walletConfigured = hasMobileWallet(details);

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#0F172A]/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[20px] overflow-hidden shadow-[0_24px_64px_rgba(15,23,42,0.18)] w-[95%] max-w-[700px] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[#E2E8F0] bg-[#0F172A] text-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Seller Payment Details
              </p>
              <h3 className="mt-2 text-[22px] font-bold tracking-tight truncate">
                {seller.name || 'Unknown Seller'}
              </h3>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <PayoutStatusBadge status={payout.status} />
                <span className="text-[12px] text-slate-400 font-mono">
                  #{payout._id?.slice(-8).toUpperCase()}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-white/10 bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3 space-y-4">
              <ModalSection title="Seller Information" icon={User}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailField label="Seller Name" value={seller.name || 'Unknown'} />
                  <DetailField label="Payout ID" value={`#${payout._id?.slice(-8).toUpperCase()}`} mono />
                </div>
              </ModalSection>

              <ModalSection title="Bank Details" icon={Building2}>
                {bankProvided ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailField label="Bank Name" value={details.bankName || '—'} mono />
                    <DetailField label="Account Title" value={details.accountTitle || '—'} mono />
                    <DetailField label="Account Number" value={details.accountNumber || '—'} mono />
                    <DetailField label="IBAN" value={details.iban || '—'} mono />
                  </div>
                ) : (
                  <p className="text-[14px] font-medium text-[#64748B] italic">
                    No bank details provided
                  </p>
                )}
              </ModalSection>

              <ModalSection title="Mobile Payment Details" icon={Smartphone}>
                {walletConfigured ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailField label="JazzCash" value={details.jazzCashNumber || '—'} mono />
                    <DetailField label="Easypaisa" value={details.easypaisaNumber || '—'} mono />
                  </div>
                ) : (
                  <p className="text-[14px] font-medium text-[#64748B] italic">
                    No mobile payment details configured
                  </p>
                )}
              </ModalSection>
            </div>

            <div className="lg:col-span-2">
              <div className="rounded-[16px] border border-[#0F172A] bg-[#0F172A] text-white overflow-hidden shadow-[0_8px_24px_rgba(15,23,42,0.12)] lg:sticky lg:top-0">
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10 bg-white/5">
                  <div className="grid h-8 w-8 place-items-center rounded-[10px] bg-white/10 text-[#10B981]">
                    <Banknote size={15} strokeWidth={1.75} />
                  </div>
                  <h4 className="text-[13px] font-semibold">Payout Summary</h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-[12px] border border-white/10 bg-white/5 px-4 py-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Gross Amount</p>
                      <p className="mt-1 text-[20px] font-bold tabular-nums">PKR {grossAmount.toLocaleString()}</p>
                    </div>
                    <Receipt size={18} className="text-slate-500 shrink-0" />
                  </div>

                  <div className="flex items-center justify-center text-slate-500">
                    <Minus size={14} />
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.12)] px-4 py-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-200/80">Commission</p>
                      <p className="mt-1 text-[18px] font-bold tabular-nums text-rose-200">
                        − PKR {commission.toLocaleString()}
                      </p>
                    </div>
                    <Percent size={18} className="text-rose-300/70 shrink-0" />
                  </div>

                  <div className="flex items-center justify-center text-slate-500">
                    <Equal size={14} />
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[rgba(16,185,129,0.35)] bg-[rgba(16,185,129,0.15)] px-4 py-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-100/80">Net Payable</p>
                      <p className="mt-1 text-[22px] font-bold tabular-nums text-[#6EE7B7]">
                        PKR {netPayable.toLocaleString()}
                      </p>
                    </div>
                    <Banknote size={18} className="text-emerald-300/80 shrink-0" />
                  </div>

                  <p className="pt-1 text-[12px] leading-relaxed text-slate-400">
                    Transfer the net payable amount to the seller&apos;s configured payment method, then mark the record as paid.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPaymentRecordsPanel({
  payoutsList,
  onMarkPaid,
}) {
  const [selectedPayout, setSelectedPayout] = useState(null);

  const totalPayouts = payoutsList.length;
  const pendingPayouts = payoutsList.filter((t) => t.status === 'Pending' || t.status === 'Holding' || t.status === 'Held').length;
  const totalCommission = payoutsList.reduce((acc, t) => acc + (t.deductedCommission || 0), 0);
  const totalNetPayable = payoutsList.reduce((acc, t) => acc + (t.sellerAmount || t.amount || 0), 0);

  const formatMetric = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toLocaleString();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-6xl mx-auto w-full">
      <EnterpriseKpiGrid cols="grid-cols-2 lg:grid-cols-4">
        <EnterpriseKpiTile
          label="Total Payouts"
          value={totalPayouts}
          icon={Receipt}
          context="Settlement records on file"
        />
        <EnterpriseKpiTile
          variant="warning"
          label="Pending Payouts"
          value={pendingPayouts}
          icon={Clock}
          context="Awaiting manual transfer"
        />
        <EnterpriseKpiTile
          label="Commission Earned"
          value={`PKR ${formatMetric(totalCommission)}`}
          icon={Percent}
          context="Platform fees deducted from payouts"
        />
        <EnterpriseKpiTile
          variant="success"
          label="Net Payable"
          value={`PKR ${formatMetric(totalNetPayable)}`}
          icon={Wallet}
          context="Total seller payout obligation"
        />
      </EnterpriseKpiGrid>

      <div className="rounded-[18px] border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <h3 className="text-[15px] font-semibold text-[#0F172A]">Payment records</h3>
          <p className="text-[13px] text-[#64748B] mt-1">Transfer funds manually, then mark transactions as paid.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-left border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Payout ID</th>
                <th className="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Seller</th>
                <th className="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Bank Information</th>
                <th className="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Commission</th>
                <th className="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Net Payable</th>
                <th className="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Status</th>
                <th className="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white text-[13px] text-[#0F172A]">
              {payoutsList.map((tx) => (
                <tr key={tx._id} className="group hover:bg-[#F8FAFC] border-b border-[#F1F5F9] last:border-b-0 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-[12px] font-semibold text-[#475569]">
                      #{tx._id.slice(-8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-[#0F172A]">{tx.seller?.name || 'Unknown'}</span>
                  </td>
                  <td className="px-6 py-4 max-w-[220px]">
                    <span className="text-[12px] text-[#64748B] font-mono truncate block">
                      {tx.seller?.paymentDetails?.bankName
                        ? `${tx.seller.paymentDetails.bankName} · ${tx.seller.paymentDetails.accountNumber}`
                        : 'No bank details'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-[8px] bg-[rgba(239,68,68,0.08)] text-[#DC2626] text-[12px] font-semibold border border-[rgba(239,68,68,0.15)] tabular-nums">
                      − PKR {tx.deductedCommission?.toLocaleString() || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-[15px] text-[#10B981] tabular-nums">
                      PKR {tx.sellerAmount?.toLocaleString() || tx.amount?.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <PayoutStatusBadge status={tx.status} />
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPayout(tx)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] rounded-[10px] font-medium text-[12px] transition-colors"
                      >
                        Details
                        <ArrowRight size={13} className="text-[#94A3B8]" />
                      </button>
                      {tx.status === 'Pending' && (
                        <button
                          type="button"
                          onClick={() => onMarkPaid(tx._id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-[10px] font-semibold text-[12px] transition-colors"
                        >
                          <CheckCircle size={14} />
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {payoutsList.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-[#64748B] text-[14px]">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SellerPaymentDetailsModal
        payout={selectedPayout}
        onClose={() => setSelectedPayout(null)}
      />
    </div>
  );
}
