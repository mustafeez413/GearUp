"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { fetchRecommendedSponsored, mapSponsoredItem, trackAdEvent } from '@/lib/advertisingApi';
import { formatPKR } from '@/lib/financeUtils';
import { resolveProductImageUrl } from '@/lib/marketplaceData';
import { formatMoqDisplay } from '@/utils/moq';

export default function SponsoredProductsWidget({ limit = 5 }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchRecommendedSponsored(limit)
      .then((res) => setItems((res.data || []).map(mapSponsoredItem)))
      .catch(() => setItems([]));
  }, [limit]);

  if (!items.length) return null;

  return (
    <div className="dashboard-card overflow-hidden">
      <div className="px-5 py-4 border-b border-[#e2e5ea] bg-[#fafbfc] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#1a2332] flex items-center gap-2">
            <Sparkles size={16} className="text-[#00A878]" />
            Recommended Sponsored Products
          </h3>
          <p className="text-xs text-[#6b7280] mt-1">Top promoted listings based on marketplace activity</p>
        </div>
        <Link href="/wholesaler/marketplace" className="text-xs font-bold text-[#00A878] flex items-center gap-1 hover:underline">
          View all <ArrowRight size={14} />
        </Link>
      </div>
      <div className="p-4 space-y-3">
        {items.map((item) => {
          const img = resolveProductImageUrl(item.image);
          return (
            <Link
              key={item.adId || item.id}
              href={`/wholesaler/marketplace/product/${item.id}`}
              onClick={() => item.adId && trackAdEvent(item.adId, 'click', { placement: 'dashboard_widget' })}
              className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB] hover:border-[#00A878]/40 hover:bg-[#F8FAFC] transition-all group"
            >
              <div className="w-14 h-14 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] overflow-hidden shrink-0 flex items-center justify-center">
                {img ? <img src={img} alt="" className="w-full h-full object-contain" /> : <Sparkles size={20} className="text-[#94A3B8]" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#00A878] bg-[#E8FFF5] px-1.5 py-0.5 rounded">Sponsored</span>
                </div>
                <p className="text-sm font-bold text-[#0F172A] truncate group-hover:text-[#00A878]">{item.name}</p>
                <p className="text-xs text-[#64748B] truncate">{item.supplier}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-black text-[#0F172A]">{formatPKR(item.price)}</p>
                <p className="text-[10px] text-[#94A3B8]">MOQ {formatMoqDisplay(item.moq, item.bulkUnit, item.packSize).compact}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
