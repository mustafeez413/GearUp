"use client";

import React from 'react';

const Skeleton = ({
  variant = 'card', // 'stat' | 'chart' | 'table' | 'card' | 'text'
  rows = 3,
  className = ''
}) => {
  const baseClasses = "animate-pulse bg-slate-100/80 rounded-xl";

  if (variant === 'stat') {
    return (
      <div className={`p-5 bg-white border border-[#E7ECF3] rounded-2xl ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 ${baseClasses}`} />
          <div className={`h-3 w-20 ${baseClasses}`} />
        </div>
        <div className="space-y-2 mt-1">
          <div className={`h-6 w-28 ${baseClasses}`} />
          <div className={`h-2.5 w-16 ${baseClasses}`} />
        </div>
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className={`p-6 bg-white border border-[#E7ECF3] rounded-2xl ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className={`h-4 w-32 ${baseClasses} mb-2`} />
            <div className={`h-2.5 w-48 ${baseClasses}`} />
          </div>
          <div className={`h-6 w-20 ${baseClasses}`} />
        </div>
        <div className="h-[280px] flex items-end gap-3 mt-4">
          <div className={`w-full h-[60%] ${baseClasses}`} />
          <div className={`w-full h-[85%] ${baseClasses}`} />
          <div className={`w-full h-[40%] ${baseClasses}`} />
          <div className={`w-full h-[95%] ${baseClasses}`} />
          <div className={`w-full h-[55%] ${baseClasses}`} />
          <div className={`w-full h-[70%] ${baseClasses}`} />
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`bg-white border border-[#E7ECF3] rounded-2xl overflow-hidden ${className}`}>
        <div className="px-6 py-5 border-b border-[#E7ECF3]/60 flex items-center justify-between">
          <div className={`h-4 w-28 ${baseClasses}`} />
          <div className={`h-6 w-16 ${baseClasses}`} />
        </div>
        <div className="p-0">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-[#F8FAFC]">
              <tr>
                {[1, 2, 3, 4, 5].map((i) => (
                  <th key={i} className="px-6 py-3.5">
                    <div className={`h-3 w-16 ${baseClasses}`} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {Array.from({ length: rows }).map((_, rIdx) => (
                <tr key={rIdx}>
                  {[1, 2, 3, 4, 5].map((cIdx) => (
                    <td key={cIdx} className="px-6 py-4.5">
                      <div className={`h-3.5 ${cIdx === 1 ? 'w-24' : 'w-16'} ${baseClasses}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`space-y-2.5 ${className}`}>
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className={`h-3 ${baseClasses} ${
              idx === rows - 1 ? 'w-2/3' : 'w-full'
            }`}
          />
        ))}
      </div>
    );
  }

  // Default 'card' variant
  return (
    <div className={`p-6 bg-white border border-[#E7ECF3] rounded-2xl space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${baseClasses}`} />
        <div className="space-y-2">
          <div className={`h-4.5 w-24 ${baseClasses}`} />
          <div className={`h-3 w-16 ${baseClasses}`} />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <div className={`h-3.5 w-full ${baseClasses}`} />
        <div className={`h-3.5 w-5/6 ${baseClasses}`} />
        <div className={`h-3.5 w-4/5 ${baseClasses}`} />
      </div>
    </div>
  );
};

export default Skeleton;
