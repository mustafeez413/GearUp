"use client";

import React from 'react';
import Link from 'next/link';

const VARIANTS = {
  default:
    'border-[#E5E7EB] bg-white text-[#0F172A] hover:border-[#00A878] hover:text-[#00A878] hover:bg-[#F8FFFC]',
  primary: 'border-[#00A878] bg-[#00A878] text-white hover:bg-[#009E66] hover:border-[#009E66]',
  navy: 'border-[#0F172A] bg-[#0F172A] text-white hover:bg-[#1e293b] hover:border-[#1e293b]',
  warning:
    'border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100 hover:border-orange-300',
  danger: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300',
  ghost: 'border-transparent bg-transparent text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]',
};

/**
 * Labeled campaign action — icon + text, never icon-only.
 * Uses native title tooltip for immediate clarity on hover.
 */
export default function CampaignActionButton({
  href,
  onClick,
  disabled = false,
  label,
  icon: Icon,
  variant = 'default',
  title,
  className = '',
}) {
  const tooltip = title || label;
  const base =
    'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';
  const classes = `${base} ${VARIANTS[variant] || VARIANTS.default} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} title={tooltip} aria-label={tooltip}>
        {Icon ? <Icon size={14} aria-hidden /> : null}
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classes}
      title={tooltip}
      aria-label={tooltip}
    >
      {Icon ? <Icon size={14} aria-hidden /> : null}
      <span>{label}</span>
    </button>
  );
}
