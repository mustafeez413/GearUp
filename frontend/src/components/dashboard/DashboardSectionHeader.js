"use client";

import React from "react";

const DashboardSectionHeader = ({ title, subtitle, className = "" }) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    <div className="flex items-center gap-3">
      <span className="w-1.5 h-8 rounded-full bg-[#00A878] shrink-0" />
      <h2 className="text-[24px] font-bold text-[#0F172A] tracking-tight">{title}</h2>
    </div>
    {subtitle && (
      <p className="text-[14px] text-[#64748B] pl-4.5 font-medium leading-relaxed">{subtitle}</p>
    )}
  </div>
);

export default DashboardSectionHeader;
