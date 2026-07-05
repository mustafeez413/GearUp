'use client';

export function AdminTableHead({ children }) {
  return (
    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] sticky top-0 z-10">
      <tr>{children}</tr>
    </thead>
  );
}

export function AdminTableTh({ children, align = 'left', className = '' }) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th
      className={`px-4 sm:px-5 py-3.5 font-sans font-semibold text-[11px] uppercase tracking-wider text-[#64748B] whitespace-nowrap ${alignClass} ${className}`}
    >
      {children}
    </th>
  );
}

export function AdminTableRow({ children, className = '' }) {
  return (
    <tr className={`group border-b border-[#E2E8F0] last:border-b-0 hover:bg-[#F8FAFC] transition-colors ${className}`}>
      {children}
    </tr>
  );
}

export function AdminTableTd({ children, align = 'left', className = '', mono = false }) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <td
      className={`px-4 sm:px-5 py-3.5 text-[13px] text-[#0F172A] align-middle ${alignClass} ${mono ? 'font-mono' : ''} ${className}`}
    >
      {children}
    </td>
  );
}

export default function AdminResponsiveTable({ children, emptyMessage, isEmpty, minWidth = 0 }) {
  return (
    <div className="rounded-[16px] border border-[#E2E8F0] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.03)] overflow-hidden">
      {isEmpty ? (
        <div className="px-6 py-12 text-center text-[14px] text-[#64748B]">{emptyMessage}</div>
      ) : (
        <div className="overflow-x-auto max-w-full">
          <table
            className="w-full text-left border-collapse"
            style={minWidth ? { minWidth: `${minWidth}px` } : undefined}
          >
            {children}
          </table>
        </div>
      )}
    </div>
  );
}
