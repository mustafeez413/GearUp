"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Package } from 'lucide-react';

/**
 * Premium sports hero banner for dashboard overview pages.
 * Shows Fakhar Zaman artwork with GearUp branding and CTA buttons.
 * Visual-only component — no business logic.
 */
const DashboardHeroBanner = ({ role = 'manufacturer' }) => {
  const marketplaceHref = role === 'admin' ? '/admin/users' : '/wholesaler/marketplace';
  const productsHref = role === 'wholesaler' ? '/wholesaler/orders' : '/manufacturer/products';
  const productsLabel = role === 'wholesaler' ? 'My Purchases' : role === 'admin' ? 'Manage Users' : 'Manage Products';

  return (
    <section className="w-full mb-6">
      <div className="dashboard-hero">

        <img
          src="/dashboard/fakhar-zaman-banner.png"
          alt="Fakhar"
          style={{
            width: "450px",
            height: "auto",
            border: "3px solid red",
            position: "absolute",
            right: 0,
            bottom: 0,
            zIndex: 50
          }}
        />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 lg:px-12 z-10">
          {/* Athlete tag */}
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#00A878] mb-1">
            Fakhar Zaman · #39
          </span>

          {/* Headline */}
          <h2 className="text-white font-black text-2xl sm:text-3xl lg:text-4xl leading-tight tracking-tight max-w-md">
            GEAR UP.
          </h2>
          <p className="text-white/70 text-xs sm:text-sm font-semibold mt-1 tracking-wide max-w-sm">
            EMPOWERING THE FUTURE OF SPORT.
          </p>

          {/* Tagline */}
          <p className="text-white/40 text-[10px] sm:text-xs font-medium mt-3 max-w-xs leading-relaxed hidden sm:block">
            Premium Sports Marketplace for Manufacturers, Wholesalers & Retailers.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3 mt-5">
            <Link
              href={marketplaceHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00A878] hover:bg-[#0DBB85] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 shadow-lg shadow-[#00A878]/25"
            >
              Explore Marketplace
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
            <Link
              href={productsHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 border border-white/20 backdrop-blur-sm"
            >
              <Package size={14} strokeWidth={2.5} />
              {productsLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(DashboardHeroBanner);
