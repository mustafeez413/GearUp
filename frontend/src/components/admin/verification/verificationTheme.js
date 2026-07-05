/** GearUp Verification Management — enterprise brand tokens */
export const brand = {
  navy: '#0B1F3A',
  navySecondary: '#102A43',
  accent: '#10B981',
  accentHover: '#059669',
  slate: '#64748B',
  warning: '#F59E0B',
  danger: '#EF4444',
  teal: '#0D9488',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
};

export const pageShell = 'w-full min-w-0';

export const shadowPremium = 'shadow-[0_8px_24px_rgba(15,23,42,0.06)]';

export const shadowSoft = 'shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.03)]';

export const cardBase = [
  'bg-white border border-[#E2E8F0] rounded-[20px]',
  shadowPremium,
  'transition-all duration-200 ease-out',
].join(' ');

export const cardInteractive = [
  cardBase,
  'hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)] hover:border-slate-300/80',
].join(' ');

export const toolbarBase = [
  'bg-white border border-[#E2E8F0] rounded-[18px] overflow-hidden',
  shadowSoft,
  'focus-within:border-[#10B981]/30 focus-within:shadow-[0_0_0_3px_rgba(16,185,129,0.08)]',
  'transition-all duration-200',
].join(' ');

export const inputToolbar =
  'h-12 w-full border-0 bg-transparent pl-10 pr-4 focus:ring-0 focus:outline-none text-[15px] font-medium text-[#0B1F3A] placeholder:text-slate-400';

export const selectToolbar =
  'h-12 border-0 bg-transparent px-4 pr-9 text-sm font-medium text-[#0B1F3A] appearance-none cursor-pointer focus:outline-none focus:ring-0 hover:bg-[#F8FAFC] transition-colors duration-150';

export const btnApprovePrimary =
  'inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-gradient-to-b from-[#10B981] to-[#059669] text-white text-sm font-bold shadow-[0_2px_10px_rgba(16,185,129,0.4)] hover:from-[#0ea472] hover:to-[#047857] hover:shadow-[0_4px_18px_rgba(16,185,129,0.45)] transition-all duration-150 disabled:opacity-50';

export const btnRejectSm =
  'inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl border-2 border-[#EF4444] bg-white text-[13px] font-semibold text-[#EF4444] hover:bg-red-50 transition-all duration-150 disabled:opacity-50';

export const btnNeutralSm =
  'inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl border border-[#E2E8F0] bg-white text-[13px] font-medium text-[#64748B] hover:border-slate-300 hover:bg-[#F8FAFC] hover:text-[#0B1F3A] transition-all duration-150';

export const btnGhost =
  'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-[#64748B] hover:border-[#10B981]/50 hover:text-[#10B981] hover:bg-emerald-50/40 transition-all duration-150';

export const sectionLabel =
  'text-[12px] font-semibold uppercase tracking-[0.08em] text-[#64748B]';

export const sectionTitle =
  'text-lg font-semibold text-[#0B1F3A] tracking-[-0.02em]';
