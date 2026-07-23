"use client";

import React from 'react';

const Badge = ({
  children,
  variant = 'slate', // 'emerald' | 'amber' | 'blue' | 'indigo' | 'red' | 'slate'
  status = '', // optional status mapper helper
  className = '',
  ...props
}) => {
  // Map statuses if status prop is provided
  let activeVariant = variant;
  if (status) {
    const statusMap = {
      pending: 'orange',
      pending_approval: 'amber',
      verified: 'emerald',
      processing: 'indigo',
      shipped: 'blue',
      delivered: 'emerald',
      cancelled: 'red',
      completed: 'emerald',
      rejected: 'red',
      held: 'amber',
      released: 'emerald',
      refunded: 'red',
    };
    activeVariant = statusMap[status.toLowerCase()] || 'slate';
  }

  const baseStyle = 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-widest border select-none transition-colors duration-200';

  const variants = {
    emerald: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]/50',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/50',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200/50',
    orange: 'bg-[#FFF7ED] text-[#EA580C] border-[#FDBA74]/50',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/50',
    indigo: 'bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]/50',
    red: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]/50',
    slate: 'bg-slate-50 text-slate-600 border-slate-200/50'
  };

  const dotColors = {
    emerald: 'bg-[#059669]',
    amber: 'bg-amber-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-[#EA580C]',
    blue: 'bg-blue-500',
    indigo: 'bg-[#4F46E5]',
    red: 'bg-[#DC2626]',
    slate: 'bg-slate-400'
  };

  return (
    <span
      className={`${baseStyle} ${variants[activeVariant]} ${className}`}
      {...props}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[activeVariant]} animate-pulse`} />
      <span>{children || status}</span>
    </span>
  );
};

export default Badge;
