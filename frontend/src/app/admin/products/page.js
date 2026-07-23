'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api';
import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminProductsPanel from '@/components/admin/panels/AdminProductsPanel';
import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function AdminProductsContent() {
  const searchParams = useSearchParams();
  const sellerId = searchParams.get('seller');
  const sellerName = searchParams.get('sellerName') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const url = sellerId
        ? `${getApiBaseUrl()}/api/products?manufacturer=${sellerId}&scope=inventory`
        : `${getApiBaseUrl()}/api/products`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setProducts(Array.isArray(json.data) ? json.data : []);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const exportCSV = () => {
    const headers = ['Product Name', 'SKU', 'Category', 'Price (PKR)', 'Bulk Unit', 'Stock', 'Status', 'Seller', 'Created Date'];
    const rows = products.map(p => [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      p.sku || '',
      p.category || '',
      p.price || p.pricePerBulkUnit || 0,
      p.bulkUnit || '',
      p.stock ?? '',
      p.isActive !== false ? 'Active' : 'Hidden',
      `"${(p.manufacturer?.name || sellerName || '').replace(/"/g, '""')}"`,
      p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products-report${sellerName ? `-${sellerName}` : ''}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const title = sellerId && sellerName
    ? `Products — ${sellerName}`
    : 'Products';
  const description = sellerId && sellerName
    ? `All products listed by ${sellerName}.`
    : 'Browse marketplace inventory, monitor listing status, and review sponsored product placements.';

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
        <button
          type="button"
          onClick={exportCSV}
          disabled={products.length === 0}
          className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-[12px] font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>
      {loading ? (
        <div className="h-64 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] animate-pulse" />
      ) : (
        <AdminProductsPanel overrideProducts={products} />
      )}
    </AdminPageShell>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] animate-pulse" />}>
      <AdminProductsContent />
    </Suspense>
  );
}
