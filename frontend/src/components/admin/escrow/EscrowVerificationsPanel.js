'use client';

import { useMemo, useState } from 'react';
import {
  tableWrap,
  tableHead,
  tableRow,
  sectionTitle,
  btnAccent,
  btnDanger,
  btnOutline,
  badge,
  inputField,
} from './escrowTheme';
import { Search, Eye, CheckCircle, XCircle, AlertCircle, Inbox } from 'lucide-react';

function Th({ children, align = 'left', className = '' }) {
  return (
    <th className={`px-4 sm:px-5 py-3.5 ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}>{children}</th>
  );
}

function StatusBadge({ status }) {
  if (status === 'pending_approval') {
    return (
      <span className={`${badge} bg-amber-50 text-amber-800 border-amber-200`}>
        <AlertCircle size={10} /> Pending
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className={`${badge} bg-red-50 text-red-800 border-red-200`}>
        <XCircle size={10} /> Rejected
      </span>
    );
  }
  return (
    <span className={`${badge} bg-emerald-50 text-emerald-800 border-emerald-200`}>
      <CheckCircle size={10} /> Approved
    </span>
  );
}

function filterByVerificationTab(orders, tab) {
  if (tab === 'pending') {
    return orders.filter((o) => o.paymentStatus === 'pending_approval' || o.paymentStatus === 'Pending Approval');
  }
  if (tab === 'rejected') {
    return orders.filter((o) => o.paymentStatus === 'rejected');
  }
  if (tab === 'approved') {
    return orders.filter(
      (o) =>
        o.paymentStatus === 'verified' ||
        o.paymentStatus === 'Payment Verified' ||
        o.isPaymentVerified ||
        (o.paymentStatus !== 'pending_approval' &&
          o.paymentStatus !== 'Pending Approval' &&
          o.paymentStatus !== 'rejected' &&
          o.paymentStatus !== 'pending')
    );
  }
  return orders;
}

export default function EscrowVerificationsPanel({ escrowOrders, onViewProof, onApprove, onReject }) {
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('pending');

  const counts = useMemo(
    () => ({
      pending: escrowOrders.filter((o) => o.paymentStatus === 'pending_approval').length,
      approved: filterByVerificationTab(escrowOrders, 'approved').length,
      rejected: escrowOrders.filter((o) => o.paymentStatus === 'rejected').length,
    }),
    [escrowOrders]
  );

  const filtered = useMemo(() => {
    let rows = filterByVerificationTab(escrowOrders, filterTab);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((o) =>
        [o._id, o.buyer?.name, o.buyer?.email, o.transactionReference, o.paymentStatus]
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }
    return rows;
  }, [escrowOrders, filterTab, search]);

  const filterTabs = [
    { id: 'pending', label: 'Pending', count: counts.pending },
    { id: 'approved', label: 'Approved', count: counts.approved },
    { id: 'rejected', label: 'Rejected', count: counts.rejected },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className={sectionTitle}>Payment verification</h2>
          <p className="text-sm text-[#64748B] mt-1">Review uploaded proofs and approve or reject payments.</p>
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders, buyers, refs…"
            className={`${inputField} pl-10`}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterTab(tab.id)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              filterTab === tab.id
                ? 'bg-[#0F172A] text-white border-[#0F172A]'
                : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]'
            }`}
          >
            {tab.label}
            <span className={`tabular-nums ${filterTab === tab.id ? 'text-white/80' : 'text-[#94A3B8]'}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]/60 px-6 py-14 text-center">
          <Inbox size={28} className="mx-auto text-[#94A3B8] mb-3" />
          <p className="text-sm font-semibold text-[#0F172A]">No {filterTab} verifications</p>
          <p className="text-sm text-[#64748B] mt-1">Try another filter or search term.</p>
        </div>
      ) : (
        <div className={tableWrap}>
          <table className="w-full text-left">
            <thead className={tableHead}>
              <tr>
                <Th>Order</Th>
                <Th className="hidden sm:table-cell">Buyer</Th>
                <Th>Amount</Th>
                <Th className="hidden md:table-cell">Reference</Th>
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const isPending =
                  order.paymentStatus === 'pending_approval' || order.paymentStatus === 'Pending Approval';
                return (
                  <tr key={order._id} className={tableRow}>
                    <td className="px-4 sm:px-5 py-4">
                      <div className="font-mono text-sm font-bold text-[#0F172A]">#{order._id.slice(-6).toUpperCase()}</div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 sm:px-5 py-4 hidden sm:table-cell">
                      <div className="text-sm font-medium text-[#0F172A]">{order.buyer?.name || '—'}</div>
                      <div className="text-[11px] text-[#64748B] truncate max-w-[160px]">{order.buyer?.email}</div>
                    </td>
                    <td className="px-4 sm:px-5 py-4 text-sm font-semibold tabular-nums">PKR {order.totalAmount?.toLocaleString()}</td>
                    <td className="px-4 sm:px-5 py-4 hidden md:table-cell">
                      <span className="font-mono text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                        {order.transactionReference || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-5 py-4">
                      <StatusBadge status={isPending ? 'pending_approval' : order.paymentStatus === 'rejected' ? 'rejected' : 'verified'} />
                    </td>
                    <td className="px-4 sm:px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {order.paymentProof && (
                          <button type="button" onClick={() => onViewProof(order)} className={btnOutline} title="View proof">
                            <Eye size={13} /> Review
                          </button>
                        )}
                        {isPending && (
                          <>
                            <button type="button" onClick={() => onApprove(order._id)} className={btnAccent} title="Quick approve">
                              <CheckCircle size={13} />
                            </button>
                            <button type="button" onClick={() => onReject(order._id)} className={btnDanger} title="Quick reject">
                              <XCircle size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
