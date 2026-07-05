"use client";

import React from 'react';
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';

const colorToTone = (color = '') => {
  const c = (color || '').toLowerCase();
  if (c.includes('rose') || c.includes('#ef4444') || c.includes('red')) return 'danger';
  if (c.includes('amber') || c.includes('#f39c12') || c.includes('yellow') || c.includes('orange') || c.includes('fuchsia')) return 'warning';
  return 'primary';
};

const StatCard = ({
  label,
  value,
  change,
  trend = 'up',
  icon: Icon,
  color,
  href,
  loading = false
}) => {
  const tone = colorToTone(color);
  const isDown = trend === 'down' || (change && change.trim().startsWith('-'));
  const isNeutral = trend === 'neutral' || (change && !change.includes('%'));
  const isRevenue = (label || '').toLowerCase().includes('revenue');

  // Accent Line Mapping
  const accentLine = {
    primary: 'border-t-[#00A878]',
    warning: 'border-t-[#F59E0B]',
    danger: 'border-t-[#EF4444]'
  }[tone];

  // Icon Container Mapping
  const iconStyle = {
    primary: { bg: '#E8FFF5', border: 'rgba(0,168,120,.15)', shadow: 'rgba(0,168,120,.08)', color: '#00A878' },
    warning: { bg: '#FFF7E6', border: 'rgba(245,158,11,.15)', shadow: 'rgba(245,158,11,.08)', color: '#F59E0B' },
    danger:  { bg: '#FEF2F2', border: 'rgba(239,68,68,.15)', shadow: 'rgba(239,68,68,.08)', color: '#EF4444' }
  }[tone];

  // Trend Badge Mapping
  const trendStyle = {
    up: { bg: '#E8FFF5', text: '#00A878', Icon: TrendingUp },
    down: { bg: '#FEF2F2', text: '#EF4444', Icon: TrendingDown },
    neutral: { bg: '#F1F5F9', text: '#64748B', Icon: Minus }
  }[isNeutral ? 'neutral' : isDown ? 'down' : 'up'];

  // Parse `change` text to separate percentage from comparison text (e.g., "+16.4% vs last month")
  let changePrimary = change;
  let changeSecondary = '';
  if (change) {
    const parts = change.split('vs');
    if (parts.length > 1) {
      changePrimary = parts[0].trim();
      changeSecondary = `vs ${parts[1].trim()}`;
    } else {
        const spaceIdx = change.indexOf(' ');
        if(spaceIdx > 0) {
            changePrimary = change.substring(0, spaceIdx);
            changeSecondary = change.substring(spaceIdx + 1);
        }
    }
  }

  const inner = (
    <div
      className={`group flex flex-col relative transition-all duration-250 ease-in-out border-t-2 ${accentLine} ${loading ? 'opacity-60 animate-pulse' : ''}`}
      style={{
        minHeight: '220px',
        maxHeight: '240px',
        width: '260px',
        background: '#FFFFFF',
        border: '1px solid #EEF2F7',
        borderRadius: '24px',
        padding: '14px 16px',
        boxShadow: '0 12px 30px rgba(15,23,42,.08)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 26px 70px rgba(15,23,42,.14)';
        e.currentTarget.style.borderColor = '#00A878';
        e.currentTarget.style.borderTopColor = '#00A878';
        if (href) e.currentTarget.style.cursor = 'pointer';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 20px 50px rgba(15,23,42,.08)';
        e.currentTarget.style.borderColor = '#E5E7EB';
        e.currentTarget.style.borderTopColor = ''; // Reset to class-based top border color
      }}
    >
      <div className="flex items-start justify-between gap-3">
            <span 
            className="text-[12px] font-semibold uppercase text-[#64748B] tracking-[0.8px] leading-tight"
        >
            {label}
        </span>
        {Icon && (
          <div 
            className="w-9 h-9 flex items-center justify-center shrink-0"
            style={{
                background: iconStyle.bg,
                border: `1px solid ${iconStyle.border}`,
                borderRadius: '10px',
                boxShadow: `0 2px 8px ${iconStyle.shadow}`,
                color: iconStyle.color
            }}
          >
            <Icon size={18} strokeWidth={2.5} />
          </div>
        )}
      </div>

      <div className="mt-2 flex-1 flex flex-col justify-start min-w-0">
        <span className="text-[28px] sm:text-[32px] font-black text-[#0F172A] tracking-tighter leading-none break-words">
          {value}
        </span>

        {change && (
          <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
            <div className="flex items-center gap-2">
                <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[12px]"
                style={{ background: trendStyle.bg, color: trendStyle.text }}
                >
                {!isNeutral && <trendStyle.Icon size={14} className="stroke-[2.5]" />}
                {changePrimary}
                </span>
                {changeSecondary && (
                    <span className="text-[#64748B] text-[12px] font-medium">
                        {changeSecondary}
                    </span>
                )}
            </div>
            {href && (
              <span className="text-[13px] font-semibold text-[#00A878] opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all duration-200 translate-x-[-4px] group-hover:translate-x-0 group-hover:underline">
                Details <ArrowRight size={14} className="stroke-[2.5]" />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full outline-none">
        {inner}
      </Link>
    );
  }

  return inner;
};

export default React.memo(StatCard);
