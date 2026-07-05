"use client";

import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  className = '',
  bodyClassName = '',
  loading = false,
  ...props
}) => {
  return (
    <div className={`dashboard-card overflow-hidden flex flex-col ${className}`} {...props}>
      {(title || subtitle || headerAction) && (
        <div className="px-4 sm:px-5 py-3.5 border-b border-[#e2e5ea] flex items-center justify-between gap-4 bg-[#fafbfc]">
          <div className="min-w-0">
            {title && (
              <h3 className="text-sm font-bold text-[#1a2332] flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-[#00A878] shrink-0" />
                {title}
                {loading && (
                  <span className="w-2 h-2 rounded-full bg-[#00A878] animate-pulse" />
                )}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#6b7280] mt-1 pl-2">{subtitle}</p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}

      <div className={`p-4 sm:p-5 flex-1 ${bodyClassName}`}>{children}</div>
    </div>
  );
};

export default Card;
