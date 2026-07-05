'use client';

import { useMemo, useState } from 'react';
import { CheckCircle, Eye, ArrowRight } from 'lucide-react';
import PaymentProofReviewModal from '@/components/admin/PaymentProofReviewModal';
import AdminFilterBar from '@/components/admin/ui/AdminFilterBar';
import AdminResponsiveTable, {
  AdminTableHead,
  AdminTableTh,
  AdminTableRow,
  AdminTableTd,
} from '@/components/admin/ui/AdminResponsiveTable';
import {
  PAYMENT_STATUS,
  resolvePaymentStatus,
  getPaymentStatusLabel,
  isPaymentReviewRecord,
  getPaymentDisplayAmount,
  formatPKR,
  matchesSearch,
  inDateRange,
  inAmountRange,
} from '@/lib/adminOperationsUtils';

const DEFAULT_FILTERS = {
  search: '',
  orderId: '',
  buyerName: '',
  transactionId: '',
  status: 'all',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
};

function KpiCard({ label, value, variant = 'default' }) {
  const tones = {
    default: 'border-[#E2E8F0]',
    warning: 'border-amber-200 bg-amber-50/40',
    success: 'border-emerald-200 bg-emerald-50/40',
    danger: 'border-red-200 bg-red-50/40',
    muted: 'border-slate-200 bg-slate-50/50',
  };
  return (
    <div className={`bg-white border rounded-[16px] p-5 shadow-[0_2px_10px_rgba(15,23,42,0.02)] ${tones[variant] || tones.default}`}>
      <p className="text-[13px] font-medium text-[#64748B] mb-1">{label}</p>
      <p className="text-[24px] font-bold text-[#0F172A] tracking-tight">{value}</p>
    </div>
  );
}

function PremiumStatusBadge({ order }) {
  const status = resolvePaymentStatus(order);
  const label = getPaymentStatusLabel(order);
  let bg, border, text, dot;

  if (status === PAYMENT_STATUS.VERIFIED) {
    bg = 'bg-[rgba(16,185,129,0.12)]';
    border = 'border-[rgba(16,185,129,0.25)]';
    text = 'text-[#047857]';
    dot = 'bg-[#10B981]';
  } else if (status === PAYMENT_STATUS.PENDING_VERIFICATION) {
    bg = 'bg-[rgba(245,158,11,0.12)]';
    border = 'border-[rgba(245,158,11,0.25)]';
    text = 'text-[#B45309]';
    dot = 'bg-[#F59E0B]';
  } else if (status === PAYMENT_STATUS.REJECTED) {
    bg = 'bg-[rgba(239,68,68,0.12)]';
    border = 'border-[rgba(239,68,68,0.25)]';
    text = 'text-[#B91C1C]';
    dot = 'bg-[#EF4444]';
  } else if (status === PAYMENT_STATUS.REFUNDED) {
    bg = 'bg-[rgba(100,116,139,0.12)]';
    border = 'border-[rgba(100,116,139,0.25)]';
    text = 'text-[#475569]';
    dot = 'bg-[#64748B]';
  } else {
    bg = 'bg-[#F1F5F9]';
    border = 'border-[#E2E8F0]';
    text = 'text-[#475569]';
    dot = 'bg-[#94A3B8]';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${bg} ${border} ${text} text-[12px] font-medium`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export default function AdminPaymentReviewsPanel({ orders, paymentStats, operationsSummary, onVerify, onReject }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const reviewOrders = useMemo(
    () => orders.filter(isPaymentReviewRecord),
    [orders]
  );

  const stats = useMemo(() => {
    const pending = reviewOrders.filter((o) => resolvePaymentStatus(o) === PAYMENT_STATUS.PENDING_VERIFICATION).length;
    const verified = reviewOrders.filter((o) => resolvePaymentStatus(o) === PAYMENT_STATUS.VERIFIED).length;
    const rejected = reviewOrders.filter((o) => resolvePaymentStatus(o) === PAYMENT_STATUS.REJECTED).length;
    const refunded = operationsSummary?.refundedOrders
      ?? paymentStats?.refunded
      ?? reviewOrders.filter((o) => resolvePaymentStatus(o) === PAYMENT_STATUS.REFUNDED).length;
    const volume = reviewOrders
      .filter((o) => resolvePaymentStatus(o) === PAYMENT_STATUS.VERIFIED)
      .reduce((acc, order) => acc + getPaymentDisplayAmount(order), 0);

    return {
      total: paymentStats?.reviews ?? reviewOrders.length,
      pending: paymentStats?.pending ?? pending,
      verified: paymentStats?.verified ?? verified,
      rejected: paymentStats?.rejected ?? rejected,
      refunded,
      volume,
    };
  }, [reviewOrders, paymentStats, operationsSummary]);

  const filteredOrders = useMemo(() => {
    return reviewOrders.filter((order) => {
      const status = resolvePaymentStatus(order);
      const amount = getPaymentDisplayAmount(order);
      const submittedAt = order.updatedAt || order.createdAt;

      if (filters.status !== 'all' && status !== filters.status) return false;
      if (filters.orderId && !String(order._id).toLowerCase().includes(filters.orderId.toLowerCase())) return false;
      if (filters.buyerName && !String(order.buyer?.name || '').toLowerCase().includes(filters.buyerName.toLowerCase())) return false;
      if (filters.transactionId && !String(order.transactionReference || '').toLowerCase().includes(filters.transactionId.toLowerCase())) return false;
      if (!inDateRange(submittedAt, filters.dateFrom, filters.dateTo)) return false;
      if (!inAmountRange(amount, filters.amountMin, filters.amountMax)) return false;

      return matchesSearch(filters.search, [
        order._id,
        order.buyer?.name,
        order.buyer?.email,
        order.transactionReference,
        getPaymentStatusLabel(order),
      ]);
    });
  }, [reviewOrders, filters]);

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const handleApprove = async (orderId) => {
    const ok = await onVerify(orderId);
    if (ok) setSelectedOrder(null);
  };

  const handleReject = async (orderId) => {
    const ok = await onReject(orderId);
    if (ok) setSelectedOrder(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Total Reviews" value={stats.total} />
        <KpiCard label="Pending Reviews" value={stats.pending} variant="warning" />
        <KpiCard label="Verified Reviews" value={stats.verified} variant="success" />
        <KpiCard label="Rejected Reviews" value={stats.rejected} variant="danger" />
        <KpiCard label="Refunded To Buyer" value={stats.refunded} variant="muted" />
        <KpiCard
          label="Verified Volume"
          value={stats.volume >= 1000000
            ? `PKR ${(stats.volume / 1000000).toFixed(1)}M`
            : stats.volume >= 1000
              ? `PKR ${(stats.volume / 1000).toFixed(1)}K`
              : formatPKR(stats.volume)}
        />
      </div>

      <AdminFilterBar
        search={filters.search}
        onSearchChange={(v) => setFilter('search', v)}
        searchPlaceholder="Search orders, buyers, transaction IDs…"
        onReset={() => setFilters(DEFAULT_FILTERS)}
        fields={[
          { id: 'orderId', label: 'Order ID', value: filters.orderId, onChange: (v) => setFilter('orderId', v), placeholder: 'e.g. A1B2C3' },
          { id: 'buyerName', label: 'Buyer Name', value: filters.buyerName, onChange: (v) => setFilter('buyerName', v), placeholder: 'Buyer name' },
          { id: 'transactionId', label: 'Transaction ID', value: filters.transactionId, onChange: (v) => setFilter('transactionId', v), placeholder: 'Txn reference' },
          {
            id: 'status',
            label: 'Status',
            type: 'select',
            value: filters.status,
            onChange: (v) => setFilter('status', v),
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: PAYMENT_STATUS.PENDING_VERIFICATION, label: 'Pending Verification' },
              { value: PAYMENT_STATUS.VERIFIED, label: 'Verified' },
              { value: PAYMENT_STATUS.REJECTED, label: 'Rejected' },
              { value: PAYMENT_STATUS.REFUNDED, label: 'Refunded To Buyer' },
            ],
          },
          { id: 'dateFrom', label: 'Date From', type: 'date', value: filters.dateFrom, onChange: (v) => setFilter('dateFrom', v) },
          { id: 'dateTo', label: 'Date To', type: 'date', value: filters.dateTo, onChange: (v) => setFilter('dateTo', v) },
          { id: 'amountMin', label: 'Min Amount', type: 'number', value: filters.amountMin, onChange: (v) => setFilter('amountMin', v), placeholder: '0' },
          { id: 'amountMax', label: 'Max Amount', type: 'number', value: filters.amountMax, onChange: (v) => setFilter('amountMax', v), placeholder: 'Any' },
        ]}
      />

      <AdminResponsiveTable
        isEmpty={filteredOrders.length === 0}
        emptyMessage="No payment reviews match your filters."
      >
        <AdminTableHead>
          <AdminTableTh>Order ID</AdminTableTh>
          <AdminTableTh>Buyer</AdminTableTh>
          <AdminTableTh>Amount</AdminTableTh>
          <AdminTableTh>Transaction ID</AdminTableTh>
          <AdminTableTh>Submitted</AdminTableTh>
          <AdminTableTh>Status</AdminTableTh>
          <AdminTableTh align="right">Actions</AdminTableTh>
        </AdminTableHead>
        <tbody className="bg-white">
          {filteredOrders.map((order) => {
            const status = resolvePaymentStatus(order);
            const displayAmount = getPaymentDisplayAmount(order);
            const isPending = status === PAYMENT_STATUS.PENDING_VERIFICATION;

            return (
              <AdminTableRow key={order._id}>
                <AdminTableTd mono>
                  <span className="font-semibold text-[#475569]">#{order._id.slice(-6).toUpperCase()}</span>
                </AdminTableTd>
                <AdminTableTd>
                  <div className="min-w-0 max-w-[180px]">
                    <p className="font-semibold truncate">{order.buyer?.name || 'Unknown'}</p>
                    <p className="text-[12px] text-[#64748B] truncate">{order.buyer?.email || ''}</p>
                  </div>
                </AdminTableTd>
                <AdminTableTd>
                  <span className="font-bold tabular-nums">{formatPKR(displayAmount)}</span>
                </AdminTableTd>
                <AdminTableTd>
                  <span className="text-[#475569] truncate block max-w-[140px]" title={order.transactionReference || 'N/A'}>
                    {order.transactionReference || 'N/A'}
                  </span>
                </AdminTableTd>
                <AdminTableTd className="whitespace-nowrap text-[#475569]">
                  {new Date(order.updatedAt || order.createdAt).toLocaleString('en-PK', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </AdminTableTd>
                <AdminTableTd>
                  <PremiumStatusBadge order={order} />
                </AdminTableTd>
                <AdminTableTd align="right">
                  <div className="flex flex-wrap justify-end gap-2">
                    {order.paymentProof && (
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] hover:border-[#14B8A6]/40 rounded-[10px] text-[12px] font-medium transition-all"
                      >
                        <Eye size={14} /> View
                        <ArrowRight size={12} className="text-[#94A3B8]" />
                      </button>
                    )}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleApprove(order._id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-[10px] text-[12px] font-medium transition-all"
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                    )}
                  </div>
                </AdminTableTd>
              </AdminTableRow>
            );
          })}
        </tbody>
      </AdminResponsiveTable>

      <PaymentProofReviewModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
