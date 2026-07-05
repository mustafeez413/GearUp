"use client";

import React from "react";

const PageHeader = ({ title, subtitle, actions, className = "" }) => (
  <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}>
    <div>
      {title && (
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#021018] tracking-tight">
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="font-body text-[#64748B] font-medium text-sm mt-1.5">
          {subtitle}
        </p>
      )}
    </div>
    {actions ? (
      <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>
    ) : null}
  </div>
);

export default PageHeader;

