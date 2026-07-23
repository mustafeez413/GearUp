'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { Download, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { formatPKR } from '@/lib/financeUtils';

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  let cls = 'bg-[#F1F5F9] text-[#475569]';
  if (s === 'completed') cls = 'bg-[rgba(16,185,129,0.12)] text-[#047857]';
  else if (s === 'pending' || s === 'pending_approval') cls = 'bg-[rgba(245,158,11,0.12)] text-[#B45309]';
  else if (s === 'processing') cls = 'bg-[rgba(59,130,246,0.12)] text-[#1D4ED8]';
  else if (s === 'shipped') cls = 'bg-[rgba(139,92,246,0.12)] text-[#6D28D9]';
  else if (s === 'cancelled') cls = 'bg-[rgba(239,68,68,0.12)] text-[#DC2626]';
  else if (s === 'delivered') cls = 'bg-[rgba(0,168,120,0.12)] text-[#065F46]';
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${cls}`}>
      {status || '—'}
    </span>
  );
}

function AdminOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sellerId = searchParams.get('seller');
  const sellerName = searchParams.get('sellerName') || '';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${getApiBaseUrl()}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        let all = Array.isArray(json.data) ? json.data : [];
        if (sellerId) {
          all = all.filter(order => {
            const isBuyer = (order.buyer?._id || order.buyer)?.toString() === sellerId;
            const isManufacturer = (order.manufacturer?._id || order.manufacturer)?.toString() === sellerId;
            const sellerInStats = (order.sellerStats || []).some(
              s => (s.seller?._id || s.seller)?.toString() === sellerId
            );
            const sellerInItems = (order.items || []).some(
              i => (i.seller?._id || i.seller)?.toString() === sellerId
            );
            return isBuyer || isManufacturer || sellerInStats || sellerInItems;
          });
        }
        setOrders(all);
      }
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const getBuyerName = (o) => {
    if (typeof o.buyer === 'object' && o.buyer) {
      return o.buyer.name || o.buyer.businessDetails?.businessName || o.buyer.email || '—';
    }
    if (typeof o.wholesaler === 'object' && o.wholesaler) {
      return o.wholesaler.name || o.wholesaler.businessDetails?.businessName || o.wholesaler.email || '—';
    }
    return '—';
  };

  const filtered = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o._id?.toLowerCase().includes(q) ||
      getBuyerName(o).toLowerCase().includes(q) ||
      (o.status || '').toLowerCase().includes(q) ||
      (o.paymentStatus || '').toLowerCase().includes(q)
    );
  });

  const exportCSV = () => {
    const headers = ['Order ID', 'Buyer Name', 'Order Date', 'Total Amount (PKR)', 'Payment Status', 'Order Status', 'Delivery Status', 'Products Count'];
    const rows = filtered.map(o => [
      o._id,
      `"${(o.buyer?.name || 'Unknown').replace(/"/g, '""')}"`,
      o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '',
      o.totalAmount || 0,
      o.paymentStatus || '',
      o.status || '',
      o.deliveredAt ? 'Delivered' : o.status === 'shipped' ? 'Shipped' : 'Pending',
      (o.items || []).length,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-report${sellerName ? `-${sellerName}` : ''}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const title = sellerId && sellerName ? `Orders — ${sellerName}` : 'All Orders';
  const description = sellerId && sellerName
    ? `All orders involving ${sellerName} as a seller.`
    : 'All platform orders.';

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
            placeholder="Search orders..."
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
                  <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Order ID</th>
                  <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Buyer</th>
                  <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Date</th>
                  <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Total</th>
                  <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Payment</th>
                  <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Order Status</th>
                  <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Products</th>
                  <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Details</th>
                </tr>
              </thead>
              <tbody className="bg-[#FFFFFF] divide-y divide-[#E2E8F0] font-sans text-[13px] font-medium text-[#0F172A]">
                {filtered.map(order => (
                  <tr key={order._id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4 font-mono text-[12px] text-[#64748B]">#{order._id.slice(-8).toUpperCase()}</td>
                    <td className="px-6 py-4 font-semibold">{getBuyerName(order)}</td>
                    <td className="px-6 py-4 text-[#64748B]">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#10B981]">{formatPKR(order.totalAmount || 0)}</td>
                    <td className="px-6 py-4"><StatusBadge status={order.paymentStatus} /></td>
                    <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                    <td className="px-6 py-4 text-[#64748B]">{(order.items || []).length}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/payment-reviews?orderId=${order._id}`)}
                        className="px-3 py-1.5 rounded-[8px] border border-[#E5E7EB] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-[#64748B] text-[14px]">
                      {sellerId ? `No orders found for ${sellerName || 'this seller'}.` : 'No orders found.'}
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

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] animate-pulse" />}>
      <AdminOrdersContent />
    </Suspense>
  );
}
