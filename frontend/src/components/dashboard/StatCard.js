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

  // Tone color mapping
  const toneClass = {
    primary: 'accent-green',
    warning: 'accent-amber',
    danger: 'accent-red'
  }[tone] || 'accent-slate';

  const trendStyle = {
    up: { bg: 'bg-emerald-50', text: 'text-emerald-700', Icon: TrendingUp },
    down: { bg: 'bg-rose-50', text: 'text-rose-700', Icon: TrendingDown },
    neutral: { bg: 'bg-slate-50', text: 'text-slate-600', Icon: Minus }
  }[isNeutral ? 'neutral' : isDown ? 'down' : 'up'];

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
      className={`kpi-card-enterprise ${toneClass} ${loading ? 'opacity-60 animate-pulse' : ''} flex flex-col justify-between h-full min-h-[140px] w-full`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[12px] sm:text-[13px] font-semibold text-[#64748B] uppercase tracking-wider leading-tight">
          {label}
        </span>
        {Icon && (
          <div className="w-9 h-9 flex items-center justify-center shrink-0 rounded-xl bg-slate-50 border border-slate-100 text-slate-500">
            <Icon size={16} strokeWidth={2.5} />
          </div>
        )}
      </div>

      <div className="mt-4 flex-1 flex flex-col justify-end">
        <span className="text-[26px] sm:text-[30px] font-black text-[#0F172A] tracking-tight leading-none">
          {value}
        </span>

        {change && (
          <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-bold text-[10px] ${trendStyle.bg} ${trendStyle.text}`}>
                {!isNeutral && <trendStyle.Icon size={12} className="stroke-[2.5]" />}
                {changePrimary}
              </span>
              {changeSecondary && (
                <span className="text-[#64748B] text-[10px] font-medium truncate">
                  {changeSecondary}
                </span>
              )}
            </div>
            {href && (
              <span className="text-[11px] font-bold text-[#00A878] opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all duration-200">
                Details <ArrowRight size={12} />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block w-full h-full">
        {inner}
      </Link>
    );
  }

  return inner;
};

export default React.memo(StatCard);
