"use client";

import React from 'react';
import { X, CheckCircle2, XCircle } from 'lucide-react';
import PaymentProofViewer from './PaymentProofViewer';
import { PAYMENT_STATUS, resolvePaymentStatus, getPaymentDisplayAmount } from '@/lib/adminOperationsUtils';

const PaymentProofReviewModal = ({
  order,
  onClose,
  onApprove,
  onReject,
  onRequestReupload
}) => {
  if (!order) return null;

  const shortId = order._id?.slice(-8)?.toUpperCase() || '—';
  const canReview = resolvePaymentStatus(order) === PAYMENT_STATUS.PENDING_VERIFICATION;
  const displayAmount = getPaymentDisplayAmount(order);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="proof-review-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#0b141e]/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close dialog"
      />

      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#e8ecf1]">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 bg-[#0b141e] text-white shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#00a896] mb-0.5">
              Payment verification
            </p>
            <h2 id="proof-review-title" className="text-base font-bold tracking-tight truncate">
              Review payment proof
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Live proof preview — full width */}
        <div className="px-5 pt-4 pb-3 bg-[#f5f7fa] shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280] mb-2">
            Uploaded proof
          </p>
          <PaymentProofViewer paymentProof={order.paymentProof} />
        </div>

        {/* Order details — compact strip */}
        <div className="px-5 py-4 border-t border-[#e8ecf1] bg-white shrink-0">
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af]">Order ID</dt>
              <dd className="font-mono text-sm font-bold text-[#0b141e] mt-0.5">#{shortId}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af]">Transaction ID</dt>
              <dd className="font-mono text-sm font-bold text-[#0b141e] mt-0.5 truncate">
                {order.transactionReference || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af]">Amount</dt>
              <dd className="text-lg font-bold text-[#0b141e] mt-0.5">
                PKR {displayAmount.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af]">Buyer</dt>
              <dd className="text-sm font-semibold text-[#0b141e] mt-0.5 truncate">
                {order.buyer?.name || '—'}
              </dd>
            </div>
          </dl>
          {order.notes && (
            <p className="text-xs text-[#6b7280] mt-3 pt-3 border-t border-[#f3f4f6]">
              <span className="font-semibold text-[#9ca3af] uppercase tracking-wide text-[10px]">Notes · </span>
              {order.notes}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-[#e8ecf1] bg-[#fafbfc] shrink-0">
          {canReview ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => onApprove?.(order._id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00a896] hover:bg-[#008f7f] text-white text-sm font-bold transition-colors"
              >
                <CheckCircle2 size={17} />
                Approve
              </button>
              {onRequestReupload && (
                <button
                  type="button"
                  onClick={() => onRequestReupload(order._id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#fef3e2] border border-[#fde68a] text-[#b45309] hover:bg-[#fde68a] text-sm font-bold transition-colors"
                >
                  Request re-upload
                </button>
              )}
              <button
                type="button"
                onClick={() => onReject?.(order._id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-bold transition-colors"
              >
                <XCircle size={17} />
                Reject
              </button>
            </div>
          ) : (
            <p className="text-xs text-center text-[#6b7280]">
              This order is no longer pending verification.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentProofReviewModal;
