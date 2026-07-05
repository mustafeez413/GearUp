"use client";

import React from 'react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-body font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';
  
  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 hover:-translate-y-0.5 active:translate-y-0 focus:ring-emerald-500',
    secondary: 'bg-slate-900 hover:bg-slate-800 text-white hover:-translate-y-0.5 active:translate-y-0 focus:ring-slate-900',
    outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-300 focus:ring-slate-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white hover:-translate-y-0.5 active:translate-y-0 focus:ring-red-500',
    ghost: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:ring-slate-400',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 focus:ring-emerald-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-[10px] uppercase tracking-wider gap-1.5',
    md: 'px-4 py-2.5 text-xs uppercase tracking-wider gap-2',
    lg: 'px-5 py-3 text-sm gap-2.5',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : null}

      {!loading && Icon && iconPosition === 'left' ? <Icon size={14} className="stroke-[2.5]" /> : null}
      
      <span>{children}</span>
      
      {!loading && Icon && iconPosition === 'right' ? <Icon size={14} className="stroke-[2.5]" /> : null}
    </button>
  );
};

export default Button;
