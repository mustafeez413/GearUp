/** Escrow Center — stable UI tokens */
export const pageShell = 'space-y-6 w-full min-w-0';

export const heroShell =
  'relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm';

export const kpiCard =
  'bg-white rounded-xl border border-[#E2E8F0] p-5 h-full transition-colors duration-150 hover:border-[#CBD5E1]';

export const tabShell = 'bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm';

export const tabBtn = (active) =>
  `relative flex items-center gap-2 px-5 py-4 text-[14px] font-semibold whitespace-nowrap transition-all duration-300 border-b-2 -mb-px ${
    active
      ? 'border-[#10B981] text-[#10B981] bg-[#F8FAFC]'
      : 'border-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]/50'
  }`;

export const tabCountBadge =
  'ml-1.5 min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#10B981]/10 text-[#10B981] text-[11px] font-bold leading-[20px] text-center';

export const tableWrap = 'overflow-x-auto rounded-xl border border-[#E2E8F0] shadow-sm';

export const tableHead =
  'bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-bold tracking-wider text-[#64748B] uppercase';

export const tableRow = 'border-b border-[#F1F5F9] hover:bg-slate-50 transition-colors duration-200';

export const sectionTitle = 'text-base font-semibold text-[#0F172A]';

export const innerStatCard = 'rounded-xl border border-[#E2E8F0] bg-white p-4 h-full';

export const chartCard = 'rounded-xl border border-[#E2E8F0] bg-white p-5 sm:p-6';

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5';

export const btnAccent =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-[13px] font-semibold transition-all duration-200 shadow-[0_4px_14px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5';

export const btnOutline =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] text-[13px] font-semibold hover:border-[#CBD5E1] hover:bg-[#F8FAFC] transition-all duration-200 shadow-sm';

export const badge =
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border';
