'use client';

import { Search, RotateCcw } from 'lucide-react';

const inputClass =
  'w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/15 focus:border-[#10B981]';

const labelClass = 'text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1.5 block';

export default function AdminFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  fields = [],
  onReset,
  className = '',
}) {
  return (
    <div className={`rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:p-5 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <div className="sm:col-span-2 lg:col-span-2">
          <label className={labelClass}>Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>

        {fields.map((field) => (
          <div key={field.id} className={field.colSpan || ''}>
            <label className={labelClass} htmlFor={field.id}>{field.label}</label>
            {field.type === 'select' ? (
              <select
                id={field.id}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className={inputClass}
              >
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : field.type === 'date' ? (
              <input
                id={field.id}
                type="date"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className={inputClass}
              />
            ) : (
              <input
                id={field.id}
                type={field.type || 'text'}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={field.placeholder}
                className={inputClass}
              />
            )}
          </div>
        ))}

        {onReset && (
          <div className="flex items-end">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center gap-2 w-full h-[38px] px-4 rounded-xl border border-[#E2E8F0] bg-white text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] transition-colors"
            >
              <RotateCcw size={14} />
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
