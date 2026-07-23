'use client';

import { useMemo, useState } from 'react';
import {
  tableWrap,
  tableHead,
  tableRow,
  sectionTitle,
  btnOutline,
  badge,
  inputField,
  selectField,
} from './escrowTheme';
import { Search, Download, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

function Th({ children, align = 'left', className = '' }) {
  return (
    <th className={`px-4 sm:px-5 py-3.5 ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}>{children}</th>
  );
}

function ledgerStatusMeta(status) {
  if (status === 'Completed') return { label: 'Completed', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  if (status === 'Pending') return { label: 'Pending', cls: 'bg-amber-50 text-amber-800 border-amber-200' };
  if (status === 'Paid') return { label: 'Processing', cls: 'bg-blue-50 text-blue-800 border-blue-200' };
  if (status === 'Hold') return { label: 'On Hold', cls: 'bg-purple-50 text-purple-800 border-purple-200' };
  if (status === 'Failed' || status === 'Refunded') return { label: 'Failed', cls: 'bg-red-50 text-red-800 border-red-200' };
  return { label: status, cls: 'bg-slate-50 text-slate-700 border-slate-200' };
}

function getOrderRef(tx) {
  const order = tx.order;
  if (!order) return '—';
  const id = typeof order === 'object' ? order._id : order;
  return id ? `#${String(id).slice(-6).toUpperCase()}` : '—';
}

function downloadLedgerCsv(rows) {
  const header = ['Date', 'Transaction ID', 'Order', 'Gross', 'Platform Fee', 'Net', 'Type', 'Status', 'Payment Method'];
  const data = rows.map((tx) => [
    new Date(tx.timestamp || tx.createdAt).toISOString(),
    tx._id,
    getOrderRef(tx),
    tx.totalAmount,
    tx.deductedCommission,
    tx.sellerAmount,
    tx.type,
    tx.status,
    tx.paymentMethod || '—',
  ]);
  const csv = [header, ...data].map((row) => row.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `escrow-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EscrowLedgerPanel({ transactions }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (!q) return true;
      return [tx._id, getOrderRef(tx), tx.type, tx.status, tx.paymentMethod, tx.seller?.name]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [transactions, search, statusFilter, typeFilter]);

  const handleExport = () => {
    downloadLedgerCsv(filtered);
    toast.success(`Exported ${filtered.length} records`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className={sectionTitle}>Transaction ledger</h2>
          <p className="text-sm text-[#64748B] mt-1">Full escrow transaction history with references and status.</p>
        </div>
        <button type="button" onClick={handleExport} className={btnOutline}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ref, order, type…"
            className={`${inputField} `}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${selectField} sm:max-w-[160px]`}>
          <option value="all">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Processing</option>
          <option value="Completed">Completed</option>
          <option value="Failed">Failed</option>
          <option value="Hold">On Hold</option>
          <option value="Refunded">Refunded</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`${selectField} sm:max-w-[140px]`}>
          <option value="all">All types</option>
          <option value="payout">Payout</option>
          <option value="refund">Refund</option>
          <option value="chargeback">Chargeback</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]/60 px-6 py-14 text-center">
          <FileText size={28} className="mx-auto text-[#94A3B8] mb-3" />
          <p className="text-sm font-semibold text-[#0F172A]">No ledger entries</p>
          <p className="text-sm text-[#64748B] mt-1">Adjust filters or wait for transactions to appear.</p>
        </div>
      ) : (
        <div className={tableWrap}>
          <table className="w-full text-left">
            <thead className={tableHead}>
              <tr>
                <Th>Date</Th>
                <Th className="hidden md:table-cell">Order</Th>
                <Th>Reference</Th>
                <Th>Gross</Th>
                <Th className="hidden sm:table-cell">Fee</Th>
                <Th className="hidden lg:table-cell">Type</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => {
                const st = ledgerStatusMeta(tx.status);
                return (
                  <tr key={tx._id} className={tableRow}>
                    <td className="px-4 sm:px-5 py-4 text-[11px] text-[#64748B] tabular-nums whitespace-nowrap">
                      {new Date(tx.timestamp || tx.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 sm:px-5 py-4 hidden md:table-cell font-mono text-xs text-[#64748B]">{getOrderRef(tx)}</td>
                    <td className="px-4 sm:px-5 py-4 font-mono text-[11px] font-semibold text-[#0F172A] max-w-[100px] truncate" title={tx._id}>
                      {String(tx._id).slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 sm:px-5 py-4 text-sm tabular-nums font-medium">PKR {tx.totalAmount?.toLocaleString()}</td>
                    <td className="px-4 sm:px-5 py-4 text-sm tabular-nums text-[#10B981] hidden sm:table-cell">
                      PKR {tx.deductedCommission?.toLocaleString()}
                    </td>
                    <td className="px-4 sm:px-5 py-4 hidden lg:table-cell">
                      <span className={`${badge} bg-slate-50 text-slate-600 border-slate-200 normal-case`}>{tx.type || '—'}</span>
                    </td>
                    <td className="px-4 sm:px-5 py-4">
                      <span className={`${badge} ${st.cls}`}>
                        {tx.status === 'Completed' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                        {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-[#94A3B8] tabular-nums">{filtered.length} of {transactions.length} entries</p>
    </div>
  );
}
