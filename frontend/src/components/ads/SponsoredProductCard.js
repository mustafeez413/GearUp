"use client";

import React from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  MessageCircle,
  CheckCircle,
  Package,
  MapPin,
  Calendar,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { formatPKR } from '@/lib/financeUtils';
import { PRODUCT_PLACEHOLDER, resolveProductImageUrl } from '@/lib/marketplaceData';
import { formatMoqDisplay } from '@/utils/moq';

export default function SponsoredProductCard({
  product,
  onAddToCart,
  onRequestQuote,
  onView,
  compact = false,
  isPremium = false,
}) {
  const imageUrl = resolveProductImageUrl(product.image);

  const moqLabel = formatMoqDisplay(product.moq, product.bulkUnit, product.packSize);

  const trustBadges = [];
  if (product.verified) trustBadges.push('Verified Supplier');
  if (product.moq && product.price != null) trustBadges.push('Trade Ready');
  if (product.sponsored !== false) trustBadges.push('Secure Orders');

  const memberSince = product.memberSince || product.joinedDate || null;

  const mediaUrl = product.customMedia
    ? resolveProductImageUrl(product.customMedia)
    : imageUrl;

  const isVideo = mediaUrl && (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm'));

  return (
    <article
      className={`relative h-full flex flex-col rounded-2xl bg-white overflow-hidden transition-all duration-300 ease-out group ${
        isPremium
          ? 'border border-slate-200 shadow-lg hover:shadow-2xl hover:-translate-y-1'
          : 'border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5'
      } ${compact ? '' : ''}`}
    >
      {/* Sponsored/Featured badge */}
      <div className="absolute top-4 left-4 z-20">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
          isPremium
            ? 'bg-slate-900 text-white shadow-md'
            : 'bg-white text-slate-700 border border-slate-200 shadow-sm'
        }`}>
          {isPremium ? (
            <><Sparkles size={12} className="text-emerald-400" /> Featured</>
          ) : (
            <><Package size={12} className="text-slate-400" /> Sponsored</>
          )}
        </span>
      </div>

      {/* Product image */}
      <div className={`relative bg-slate-50 border-b border-slate-100 overflow-hidden ${
        isPremium ? 'h-[240px] sm:h-[280px]' : 'h-[200px] sm:h-[220px]'
      }`}>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-black/5 pointer-events-none z-[1]" />
        <div className="absolute inset-0 flex items-center justify-center p-6">
          {isVideo ? (
            <video
              src={mediaUrl}
              autoPlay
              muted
              loop
              playsInline
              className="max-h-full max-w-full object-contain transition-transform duration-500 ease-out group-hover:scale-105 drop-shadow-sm rounded-lg"
            />
          ) : (
            <img
              src={mediaUrl}
              alt={product.name}
              className="max-h-full max-w-full object-contain transition-transform duration-500 ease-out group-hover:scale-110 drop-shadow-sm"
              onError={(e) => { e.currentTarget.src = PRODUCT_PLACEHOLDER; }}
            />
          )}
        </div>
        {!product.image && !product.customMedia && (
          <div className="absolute inset-0 flex items-center justify-center text-[#94A3B8]">
            <Package size={48} className="stroke-[1.5] opacity-40" />
          </div>
        )}
      </div>

      <div className={`flex flex-col flex-1 ${isPremium ? 'p-6 sm:p-8' : 'p-4 sm:p-5'}`}>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
          {product.category}
        </p>
        <h3 className={`font-bold text-slate-900 leading-snug line-clamp-2 transition-colors min-h-[44px] ${
          isPremium ? 'text-lg group-hover:text-emerald-600' : 'text-[15px] group-hover:text-emerald-600'
        }`}>
          {product.name}
        </h3>

        {/* Manufacturer */}
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 text-sm truncate">{product.supplier}</span>
            {product.verified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider border border-emerald-100">
                <CheckCircle size={10} /> Verified
              </span>
            )}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <MapPin size={14} className="text-slate-400 shrink-0" />
            {product.location || product.country}
          </p>
          {memberSince && (
            <p className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Calendar size={14} className="text-slate-400 shrink-0" />
              Member since {memberSince}
            </p>
          )}
        </div>

        {/* Price */}
        <div className={`mt-5 py-4 px-4 rounded-xl ${
          isPremium ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
        } border`}>
          <p className={`font-black leading-none tracking-tight tabular-nums ${
            isPremium ? 'text-2xl sm:text-3xl text-white' : 'text-[22px] sm:text-2xl text-emerald-600'
          }`}>
            {formatPKR(product.price)}
          </p>
          <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${
            isPremium ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Bulk Trade Pricing
          </p>
        </div>

        {/* MOQ chip */}
        <div className="mt-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
            📦 MOQ: {moqLabel.compact}
          </span>
          {moqLabel.secondary && (
            <p className="text-xs text-slate-500 font-medium mt-1.5 ml-1">{moqLabel.secondary}</p>
          )}
        </div>

        {/* Trust indicators */}
        {trustBadges.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {trustBadges.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[9px] font-bold uppercase tracking-wider text-slate-500 shadow-sm"
              >
                <ShieldCheck size={12} className="text-emerald-500" />
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-3 mt-auto">
          <Link
            href={`/wholesaler/marketplace/product/${product.id}`}
            onClick={() => onView?.(product)}
            className="flex w-full items-center justify-center h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest transition-all shadow-md hover:shadow-lg"
          >
            View Details
          </Link>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onRequestQuote?.(product)}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
              title="Message Supplier"
            >
              <MessageCircle size={16} />
              Message
            </button>
            <button
              type="button"
              onClick={() => onAddToCart?.(product)}
              className="flex items-center justify-center gap-2 h-12 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-md hover:shadow-lg shrink-0"
              title="Add to Cart"
            >
              <ShoppingCart size={16} />
              Add
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-5 pt-4 border-t border-slate-100 text-[10px] text-center text-slate-400 font-semibold tracking-wider uppercase">
          Promoted on GearUp
        </p>
      </div>
    </article>
  );
}
