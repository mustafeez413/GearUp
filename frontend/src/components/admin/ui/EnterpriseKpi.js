'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';

export function EnterpriseKpiTile({
  label,
  value,
  icon: Icon,
  trend,
  context,
  variant = 'default',
  featured = false,
  className = '',
}) {
  const isPositive = trend === undefined || trend >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  const variants = {
    default: 'border-[#E2E8F0] bg-white',
    success: 'border-[#A7F3D0] bg-[rgba(16,185,129,0.04)]',
    warning: 'border-[#FDE68A] bg-[rgba(245,158,11,0.06)]',
    featured: 'border-[#0F172A] bg-[#0F172A] text-white',
  };

  const shell = featured
    ? variants.featured
    : variant === 'warning'
      ? variants.warning
      : variant === 'success'
        ? variants.success
        : variants.default;

  const labelClass = featured ? 'text-slate-300' : 'text-[#64748B]';
  const valueClass = featured ? 'text-white' : 'text-[#0F172A]';
  const iconShell = featured
    ? 'bg-white/10 text-[#10B981] border-white/10'
    : 'bg-[#F8FAFC] text-[#10B981] border-[#E2E8F0]';

  return (
    <div
      className={`rounded-[18px] border p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)] ${shell} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border ${iconShell}`}>
          <Icon size={18} strokeWidth={1.75} />
        </div>
        {trend !== undefined && (
          <div
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold tabular-nums ${
              featured
                ? isPositive
                  ? 'bg-white/10 text-emerald-300'
                  : 'bg-white/10 text-rose-300'
                : isPositive
                  ? 'bg-[rgba(16,185,129,0.12)] text-[#047857]'
                  : 'bg-[rgba(239,68,68,0.12)] text-[#DC2626]'
            }`}
          >
            <TrendIcon size={12} strokeWidth={2.25} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className={`mt-4 text-[12px] font-semibold uppercase tracking-wider ${labelClass}`}>{label}</p>
      <p className={`mt-2 text-[26px] font-bold tabular-nums tracking-tight leading-none ${valueClass}`}>{value}</p>
      {context ? (
        <p className={`mt-2 text-[13px] leading-relaxed ${featured ? 'text-slate-400' : 'text-[#64748B]'}`}>
          {context}
        </p>
      ) : null}
    </div>
  );
}

export function EnterpriseKpiGrid({ children, cols = 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4' }) {
  return <div className={`grid ${cols} gap-4 items-stretch`}>{children}</div>;
}
