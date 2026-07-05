'use client';

import Badge from '@/components/common/Badge';
import { formatPKR } from '@/lib/financeUtils';

export default function AdminTransactionsPanel({ transactions }) {
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt)
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 table-auto text-left">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-widest text-slate-500">Date</th>
              <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-widest text-slate-500">Type</th>
              <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-widest text-slate-500">Seller / Party</th>
              <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-widest text-slate-500">Amount</th>
              <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-widest text-slate-500">Commission</th>
              <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-widest text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-50 font-sans text-[13px] font-medium text-slate-800">
            {sorted.map((tx) => (
              <tr key={tx._id} className="hover:bg-slate-50/80 transition-all">
                <td className="px-6 py-4 text-slate-500 text-[12px]">
                  {new Date(tx.timestamp || tx.createdAt).toLocaleString('en-PK', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-6 py-4 capitalize">{tx.type || '—'}</td>
                <td className="px-6 py-4">{tx.seller?.name || tx.buyer?.name || '—'}</td>
                <td className="px-6 py-4 font-bold">{formatPKR(tx.totalAmount || tx.amount || 0)}</td>
                <td className="px-6 py-4 text-emerald-700">{formatPKR(tx.deductedCommission || 0)}</td>
                <td className="px-6 py-4">
                  <Badge status={tx.status === 'Paid' || tx.status === 'completed' ? 'completed' : 'pending'}>
                    {tx.status || 'Unknown'}
                  </Badge>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-500 text-[13px]">
                  No transactions recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
