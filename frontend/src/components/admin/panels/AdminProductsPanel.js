'use client';

import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import { Package, CheckCircle, Star, Grid } from 'lucide-react';
import { formatPKR } from '@/lib/financeUtils';
import { resolveProductImageUrl } from '@/lib/marketplaceData';

function KpiCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[16px] p-5 flex items-center gap-4 transition-all hover:shadow-[0_8px_20px_rgba(15,23,42,0.04)] hover:-translate-y-[1px]">
      <div className="w-[48px] h-[48px] rounded-[14px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#14B8A6] shrink-0">
        <Icon size={24} />
      </div>
      <div>
        <div className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider">{label}</div>
        <div className="text-[24px] font-black text-[#0F172A] leading-tight tracking-tight mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status, text }) {
  let style = '';
  if (status === 'ACTIVE') style = 'bg-[rgba(16,185,129,0.12)] text-[#047857]';
  else if (status === 'APPROVED') style = 'bg-[rgba(20,184,166,0.12)] text-[#0F766E]';
  else if (status === 'SUSPENDED') style = 'bg-[rgba(239,68,68,0.12)] text-[#DC2626]';
  else if (status === 'PENDING') style = 'bg-[rgba(245,158,11,0.12)] text-[#B45309]';
  else style = 'bg-[#F1F5F9] text-[#475569]';

  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${style}`}>
      {text}
    </span>
  );
}

function SponsoredBadge({ isSponsored }) {
  if (isSponsored) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.25)] text-[#B45309] text-[11px] font-bold uppercase tracking-wider">
        <Star size={10} className="fill-[#F59E0B]" />
        Sponsored
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[#64748B] text-[11px] font-bold uppercase tracking-wider">
      Standard
    </span>
  );
}

export default function AdminProductsPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${getApiBaseUrl()}/api/products`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProducts(Array.isArray(json.data) ? json.data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-64 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] animate-pulse" />;
  }

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.isActive !== false).length;
  const sponsoredProducts = products.filter(p => p.isSponsored).length;
  const categories = new Set(products.map(p => p.category).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Package} label="Total Products" value={totalProducts} />
        <KpiCard icon={CheckCircle} label="Active Products" value={activeProducts} />
        <KpiCard icon={Star} label="Sponsored" value={sponsoredProducts} />
        <KpiCard icon={Grid} label="Categories" value={categories} />
      </div>

      <div className="rounded-[20px] border border-[#E2E8F0] bg-[#FFFFFF] shadow-[0_4px_20px_rgba(15,23,42,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-left border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Product</th>
                <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Manufacturer</th>
                <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Category</th>
                <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Price</th>
                <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Status</th>
                <th className="px-6 py-4 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Placement</th>
              </tr>
            </thead>
            <tbody className="bg-[#FFFFFF] divide-y divide-[#E2E8F0] font-sans text-[13px] font-medium text-[#0F172A]">
              {products.map((product) => (
                <tr key={product._id} className="group hover:bg-[#F8FAFC] transition-colors relative">
                  <td className="px-6 py-4 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#14B8A6] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F8FAFC] border border-[#E2E8F0] shrink-0">
                        {product.images && product.images[0] ? (
                          <img 
                            src={resolveProductImageUrl(product.images[0])} 
                            alt={product.name} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = resolveProductImageUrl(null);
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#94A3B8] font-bold text-[10px]">NO IMG</div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-[#0F172A]">{product.name}</p>
                        <p className="text-[11px] text-[#64748B] font-mono mt-0.5">#{String(product._id).slice(-6).toUpperCase()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold">{product.manufacturer?.name || product.manufacturerName || '—'}</td>
                  <td className="px-6 py-4 capitalize text-[#475569]">{product.category || '—'}</td>
                  <td className="px-6 py-4 font-bold text-[#10B981]">{formatPKR(product.price || product.basePrice || 0)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={product.isActive !== false ? 'ACTIVE' : 'PENDING'} text={product.isActive !== false ? 'Active' : 'Hidden'} />
                  </td>
                  <td className="px-6 py-4">
                    <SponsoredBadge isSponsored={product.isSponsored} />
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-[#64748B] text-[14px]">
                    No products listed on the marketplace yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
