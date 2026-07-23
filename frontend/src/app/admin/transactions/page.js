'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { Download, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { formatPKR } from '@/lib/financeUtils';

function TxStatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  let cls = 'bg-[#F1F5F9] text-[#475569]';
  if (s === 'completed' || s === 'paid') cls = 'bg-[rgba(16,185,129,0.12)] text-[#047857]';
  else if (s === 'pending' || s === 'held' || s === 'holding') cls = 'bg-[rgba(245,158,11,0.12)] text-[#B45309]';
  else if (s === 'failed' || s === 'refunded') cls = 'bg-[rgba(239,68,68,0.12)] text-[#DC2626]';
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${cls}`}>
      {status || '—'}
    </span>
  );
}

function AdminTransactionsContent() {
  const searchParams = useSearchParams();
  const sellerId = searchParams.get('seller');
  const sellerName = searchParams.get('sellerName') || '';

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchTransactions = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ limit: '200' });
      if (sellerId) params.set('seller', sellerId);
      const res = await fetch(`${getApiBaseUrl()}/api/transactions/admin?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setTransactions(Array.isArray(json.data) ? json.data : []);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const filtered = transactions.filter(tx => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      tx._id?.toLowerCase().includes(q) ||
      (tx.seller?.name || '').toLowerCase().includes(q) ||
      (tx.buyer?.name || '').toLowerCase().includes(q) ||
      (tx.status || '').toLowerCase().includes(q) ||
      (tx.type || '').toLowerCase().includes(q) ||
      (tx.order?._id || '').toLowerCase().includes(q)
    );
  });

  const exportCSV = () => {
    const headers = [
      'Transaction ID', 'Type', 'Buyer', 'Seller', 'Order ID',
      'Total Amount (PKR)', 'Commission (PKR)', 'Seller Amount (PKR)',
      'Payment Method', 'Status', 'Date',
    ];
    const rows = filtered.map(tx => [
      tx._id,
      tx.type || '',
      `"${(tx.buyer?.name || '').replace(/"/g, '""')}"`,
      `"${(tx.seller?.name || sellerName || '').replace(/"/g, '""')}"`,
      tx.order?._id || '',
      tx.totalAmount || 0,
      tx.deductedCommission || 0,
      tx.sellerAmount || 0,
      tx.paymentMethod || '',
      tx.status || '',
      tx.timestamp || tx.createdAt
        ? new Date(tx.timestamp || tx.createdAt).toLocaleDateString()
        : '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-report${sellerName ? `-${sellerName}` : ''}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const title = sellerId && sellerName ? `Transactions — ${sellerName}` : 'Transaction History';
  const description = sellerId && sellerName
    ? `All payment transactions involving ${sellerName}.`
    : 'Complete ledger of platform transactions, commissions, and settlement records.';

  return (
    <AdminPageShell title={title} description={description} align="center">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {sellerId && (
          <Link
            href="/admin/manufacturers"
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-[12px] font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
          >
            <ArrowLeft size={14} /> Back to Manufacturers
          </Link>
        )}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={15} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-3 pr-10 py-2 text-[13px] font-medium border border-[#E5E7EB] rounded-[10px] bg-white outline-none focus:border-[#00B894] focus:ring-2 focus:ring-[#00B894]/15"
          />
        </div>
        <button
          type="button"
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-[12px] font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] animate-pulse" />
      ) : (
        <div className="rounded-[20px] border border-[#E2E8F0] bg-[#FFFFFF] shadow-[0_4px_20px_rgba(15,23,42,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-left border-collapse">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Date</th>
                  <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Transaction ID</th>
                  <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Type</th>
                  <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Buyer</th>
                  <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Order ID</th>
                  <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Total</th>
                  <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Commission</th>
                  <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Seller Net</th>
                  <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Status</th>
                </tr>
              </thead>
              <tbody className="bg-[#FFFFFF] divide-y divide-[#E2E8F0] font-sans text-[13px] font-medium text-[#0F172A]">
                {filtered.map(tx => (
                  <tr key={tx._id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4 text-[#64748B] text-[12px]">
                      {tx.timestamp || tx.createdAt
                        ? new Date(tx.timestamp || tx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-[#64748B]">#{tx._id.slice(-8).toUpperCase()}</td>
                    <td className="px-6 py-4 capitalize text-[#475569]">{tx.type || '—'}</td>
                    <td className="px-6 py-4">{tx.buyer?.name || '—'}</td>
                    <td className="px-6 py-4 font-mono text-[11px] text-[#64748B]">
                      {tx.order?._id ? `#${tx.order._id.slice(-8).toUpperCase()}` : '—'}
                    </td>
                    <td className="px-6 py-4 font-bold">{formatPKR(tx.totalAmount || 0)}</td>
                    <td className="px-6 py-4 text-rose-600">{formatPKR(tx.deductedCommission || 0)}</td>
                    <td className="px-6 py-4 font-bold text-[#10B981]">{formatPKR(tx.sellerAmount || 0)}</td>
                    <td className="px-6 py-4"><TxStatusBadge status={tx.status} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-[#64748B] text-[14px]">
                      {sellerId ? `No transactions found for ${sellerName || 'this seller'}.` : 'No transactions recorded yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}

export default function AdminTransactionsPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] animate-pulse" />}>
      <AdminTransactionsContent />
    </Suspense>
  );
}
