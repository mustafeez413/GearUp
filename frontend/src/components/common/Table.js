"use client";

import React from 'react';

const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyState,
  className = "",
  tableClassName = "",
  ...props
}) => {
  return (
    <div className={`overflow-x-auto w-full border border-[#E7ECF3] rounded-2xl bg-white shadow-[0_2px_15px_rgba(0,0,0,0.01)] ${className}`} {...props}>
      <table className={`min-w-full divide-y divide-slate-100/80 table-auto ${tableClassName}`}>
        <thead className="bg-[#F8FAFC] select-none">
          <tr>
            {columns.map((col, index) => (
              <th
                key={col.key || index}
                scope="col"
                className={`px-6 py-3.5 text-left font-body font-black text-[9px] uppercase tracking-widest text-slate-400 ${col.className || ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100/60">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <svg className="animate-spin h-6 w-6 text-[#00C26E]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="font-body text-[9px] font-black uppercase text-slate-400 tracking-wider">Loading records</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4">
                {emptyState || (
                  <div className="text-center py-8 font-body text-xs text-slate-400 select-none">
                    No records found.
                  </div>
                )}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row._id || row.id || rowIndex}
                className="hover:bg-slate-50/50 transition-colors duration-150 group"
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={col.key || colIndex}
                    className={`px-6 py-4 text-xs font-body text-slate-700 whitespace-nowrap ${col.className || ""}`}
                  >
                    {col.render ? col.render(row, rowIndex) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
