"use client";

import React from 'react';
import Link from 'next/link';
import { Package, ShoppingCart, FileText, Search, MessageSquare, Users } from 'lucide-react';
import useReadOnlyMode from '@/hooks/useReadOnlyMode';

const defaultActions = [
  { label: 'Add product', route: '/manufacturer/products/new', tone: 'teal' },
  { label: 'Orders', route: '/manufacturer/orders', tone: 'teal' },
  { label: 'Marketplace', route: '/wholesaler/marketplace', tone: 'slate' },
  { label: 'Messages', route: '/manufacturer/chats', tone: 'teal' }
];

const TONE = {
  teal: 'bg-[#E8FFF5] text-[#00A878] border-[#86EFAC]',
  orange: 'bg-[#fef3e2] text-[#f39c12] border-[#fde68a]',
  green: 'bg-[#E8FFF5] text-[#00A878] border-[#86EFAC]',
  slate: 'bg-[#f3f4f6] text-[#4b5563] border-[#e5e7eb]'
};

const QuickActionsCard = ({ actions = defaultActions }) => {
  const { isReadOnlyMode } = useReadOnlyMode();
  const visibleActions = isReadOnlyMode
    ? actions.filter((action) => {
        const label = action.label?.toLowerCase() || '';
        const route = action.route?.toLowerCase() || '';
        return !label.includes('add product') && !route.includes('/new') && !route.includes('checkout');
      })
    : actions;

  const getIcon = (label) => {
    const l = label.toLowerCase();
    if (l.includes('product') || l.includes('purchases')) return Package;
    if (l.includes('order') || l.includes('cart') || l.includes('payout')) return ShoppingCart;
    if (l.includes('quote') || l.includes('commission') || l.includes('advertisement')) return FileText;
    if (l.includes('marketplace') || l.includes('browse') || l.includes('review') || l.includes('verification')) return Search;
    if (l.includes('message') || l.includes('dispute')) return MessageSquare;
    if (l.includes('supplier') || l.includes('user')) return Users;
    return Package;
  };

  const resolveTone = (action) => {
    if (action.tone && TONE[action.tone]) return action.tone;
    if (action.color?.includes('rose') || action.color?.includes('amber')) return 'orange';
    if (action.color?.includes('emerald') || action.color?.includes('00C875')) return 'teal';
    return 'slate';
  };

  return (
    <div
      className="h-full flex flex-col relative overflow-hidden"
      style={{
        minHeight: '520px',
        maxWidth: '460px',
        width: '100%',
        borderRadius: '24px',
      }}
    >
      {/* Background Image Layer */}
      <img
        src="/dashboard/quick-action-bg.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center z-0 pointer-events-none select-none"
        draggable={false}
      />

      {/* Dark Gradient Overlay */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(3,8,12,0.45), rgba(3,8,12,0.55))',
        }}
      />

      {/* Header */}
      <div className="relative z-10 px-6 pt-6 pb-4 border-b border-white/8">
        <h3 className="text-[17px] font-bold text-white tracking-tight">Quick Actions</h3>
        <p className="text-[12px] mt-1 font-medium tracking-wide" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Frequently used shortcuts
        </p>
      </div>

      {/* Action Buttons - Top Right */}
      <div className="relative z-10 p-4 flex flex-col gap-2 items-start flex-1">
        {visibleActions.map((action, i) => {
          const Icon = getIcon(action.label);
          return (
            <Link
              key={i}
              href={action.route}
              className="flex items-center justify-between gap-2 group cursor-pointer w-[170px]"
              style={{
                background: '#10B981',
                borderRadius: '10px',
                padding: '10px 14px',
                transition: 'all 0.25s ease',
                boxShadow: '0 3px 12px rgba(16,185,129,0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#059669';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#10B981';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 3px 12px rgba(16,185,129,0.3)';
              }}
            >
              <div className="flex items-center gap-2">
                <Icon size={15} className="text-white/90" strokeWidth={2} />
                <span className="text-[12px] font-semibold text-white">
                  {action.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {action.badgeCount ? (
                  <span className="min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold text-emerald-600 bg-white rounded-full">
                    {action.badgeCount}
                  </span>
                ) : null}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(QuickActionsCard);
