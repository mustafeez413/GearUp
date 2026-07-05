'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, Package, Shield, Sparkles, Circle } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

const MARKETPLACE_CATEGORIES = [
  {
    key: 'cricket',
    name: 'Cricket',
    match: ['cricket'],
    icon: 'cricket',
    accent: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]',
    emoji: '🏏',
  },
  {
    key: 'football',
    name: 'Football',
    match: ['football'],
    icon: 'football',
    accent: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
    emoji: '⚽',
  },
  {
    key: 'protective-gear',
    name: 'Protective Gear',
    match: ['protective gear', 'protective'],
    icon: 'shield',
    accent: 'bg-[#F8FAFC] text-[#0F172A] border-[#E2E8F0]',
    emoji: '🛡️',
  },
];

function normalizeCategory(value) {
  return String(value || '').trim().toLowerCase();
}

function matchesCategory(productCategory, categoryDef) {
  const normalized = normalizeCategory(productCategory);
  return categoryDef.match.some(
    (token) => normalized === token || normalized.includes(token)
  );
}

function CategoryIcon({ category }) {
  if (category.icon === 'shield') {
    return <Shield size={26} strokeWidth={1.75} />;
  }
  if (category.icon === 'football') {
    return <Circle size={26} strokeWidth={1.75} />;
  }
  return <span className="text-[26px] leading-none">{category.emoji}</span>;
}

function SummaryTile({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-4 rounded-[16px] border border-[#E2E8F0] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] text-[#10B981]">
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-[#64748B]">{label}</p>
        <p className="text-[22px] font-bold text-[#0F172A] tabular-nums leading-none mt-1">{value}</p>
      </div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-[#F1F5F9] last:border-b-0">
      <span className="text-[14px] font-medium text-[#64748B]">{label}</span>
      <span className="text-[15px] font-semibold text-[#0F172A] tabular-nums">{value}</span>
    </div>
  );
}

function CategoryManagementCard({ category, stats }) {
  return (
    <article className="group flex h-full flex-col rounded-[20px] border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#10B981]/35 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-[16px] border ${category.accent}`}>
          <CategoryIcon category={category} />
        </div>
        <span className="inline-flex items-center rounded-full bg-[rgba(16,185,129,0.12)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#047857]">
          Active Category
        </span>
      </div>

      <div className="mt-5">
        <h3 className="text-[22px] font-bold text-[#0F172A] tracking-tight leading-tight">
          {category.name}
        </h3>
        <p className="text-[14px] text-[#64748B] mt-2 leading-relaxed">
          Core marketplace vertical for {category.name.toLowerCase()} equipment and inventory.
        </p>
      </div>

      <div className="mt-6 flex-1 rounded-[14px] bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-1">
        <StatRow label="Products" value={stats.products} />
        <StatRow label="Manufacturers" value={stats.manufacturers} />
        <StatRow label="Sponsored Listings" value={stats.sponsored} />
      </div>
    </article>
  );
}

export default function AdminCategoriesPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch(`${getApiBaseUrl()}/api/products/categories`, { headers }).then((r) => r.json()),
      fetch(`${getApiBaseUrl()}/api/products`, { headers }).then((r) => r.json()),
    ])
      .then(([, productsJson]) => {
        if (productsJson.success) {
          setProducts(Array.isArray(productsJson.data) ? productsJson.data : []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const categoryCards = useMemo(() => {
    return MARKETPLACE_CATEGORIES.map((category) => {
      const matched = products.filter((product) => matchesCategory(product.category, category));
      const manufacturerIds = new Set();

      matched.forEach((product) => {
        const manufacturerId =
          product.manufacturer?._id ||
          product.manufacturer ||
          product.manufacturerId ||
          product.seller?._id ||
          product.seller;
        if (manufacturerId) manufacturerIds.add(String(manufacturerId));
      });

      const sponsored = matched.filter(
        (product) => product.isSponsored === true || product.sponsored === true
      ).length;

      return {
        category,
        stats: {
          products: matched.length,
          manufacturers: manufacturerIds.size,
          sponsored,
        },
      };
    });
  }, [products]);

  const summary = useMemo(() => {
    const totalProducts = categoryCards.reduce((sum, item) => sum + item.stats.products, 0);
    const allManufacturers = new Set();
    categoryCards.forEach(({ category }) => {
      products
        .filter((product) => matchesCategory(product.category, category))
        .forEach((product) => {
          const manufacturerId =
            product.manufacturer?._id ||
            product.manufacturer ||
            product.manufacturerId ||
            product.seller?._id ||
            product.seller;
          if (manufacturerId) allManufacturers.add(String(manufacturerId));
        });
    });

    return {
      categories: MARKETPLACE_CATEGORIES.length,
      products: totalProducts,
      manufacturers: allManufacturers.size,
    };
  }, [categoryCards, products]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-[16px] bg-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[320px] rounded-[20px] bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryTile label="Marketplace Categories" value={summary.categories} icon={Sparkles} />
        <SummaryTile label="Listed Products" value={summary.products} icon={Package} />
        <SummaryTile label="Active Manufacturers" value={summary.manufacturers} icon={Building2} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {categoryCards.map(({ category, stats }) => (
          <CategoryManagementCard key={category.key} category={category} stats={stats} />
        ))}
      </div>
    </div>
  );
}
