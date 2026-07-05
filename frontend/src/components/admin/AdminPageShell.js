'use client';

export default function AdminPageShell({
  eyebrow = 'GearUp Admin',
  title,
  description,
  actions,
  children,
  className = '',
  align = 'left',
}) {
  const isCenter = align === 'center';
  return (
    <div className={`space-y-6 w-full pb-6 min-w-0 animate-in fade-in duration-300 ${className}`}>
      <div className={`flex flex-col ${isCenter ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between'} gap-4`}>
        <div className={`min-w-0 ${isCenter ? 'flex flex-col items-center' : ''}`}>
          {eyebrow ? (
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#14B8A6] mb-1.5">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-[28px] sm:text-[32px] font-black text-[#0F172A] tracking-tight leading-none">{title}</h1>
          {description ? <p className={`text-[14px] text-[#64748B] max-w-2xl leading-relaxed ${isCenter ? 'mt-2.5' : 'mt-2'}`}>{description}</p> : null}
        </div>
        {actions ? <div className={`flex flex-wrap items-center gap-2 shrink-0 ${isCenter ? 'mt-4 justify-center' : ''}`}>{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
