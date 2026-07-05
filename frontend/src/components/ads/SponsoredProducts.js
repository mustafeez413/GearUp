"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { fetchSponsoredProducts, mapSponsoredItem, trackAdEvent } from '@/lib/advertisingApi';
import SponsoredProductCard from './SponsoredProductCard';

export default function SponsoredProducts({
  category = 'all',
  keyword = '',
  limit = 6,
  placement = 'marketplace',
  onAddToCartClick,
  onInquiryClick,
  title = 'Sponsored Products',
  subtitle = 'Premium promoted listings from verified manufacturers',
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const trackedRef = useRef(new Set());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetchSponsoredProducts({ category, keyword, limit, placement });
        if (mounted) {
          setItems((res.data || []).map(mapSponsoredItem));
        }
      } catch {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [category, keyword, limit, placement]);

  useEffect(() => {
    items.forEach((item) => {
      if (item.adId && !trackedRef.current.has(item.adId)) {
        trackedRef.current.add(item.adId);
        trackAdEvent(item.adId, 'impression', { placement });
      }
    });
  }, [items, placement]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center text-sm text-[#64748B]">
        Loading sponsored products…
      </div>
    );
  }

  if (!items.length) return null;

  return (
    <div className="space-y-4">
      <div className={placement === 'homepage_featured' ? 'mb-8' : 'mb-5'}>
        <h2 className={`font-black flex items-center gap-2 ${placement === 'homepage_featured' ? 'text-2xl sm:text-3xl text-slate-900 tracking-tight' : 'text-lg text-slate-900'}`}>
          <Sparkles size={placement === 'homepage_featured' ? 24 : 18} className="text-emerald-500" /> {title}
        </h2>
        <p className={`font-semibold uppercase tracking-widest mt-2 ${placement === 'homepage_featured' ? 'text-sm text-slate-500' : 'text-xs text-slate-500'}`}>{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
        {items.map((product) => (
          <SponsoredProductCard
            key={product.adId || product.id}
            product={product}
            isPremium={placement === 'homepage_featured'}
            onAddToCart={(p) => {
              if (p.adId) trackAdEvent(p.adId, 'click', { placement });
              onAddToCartClick?.(p);
            }}
            onRequestQuote={(p) => {
              if (p.adId) trackAdEvent(p.adId, 'quote', { placement });
              onInquiryClick?.(p);
            }}
            onView={(p) => {
              if (p.adId) trackAdEvent(p.adId, 'view', { placement });
            }}
          />
        ))}
      </div>
    </div>
  );
}
