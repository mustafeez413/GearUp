"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const optionsMap = {
  today: 'Today',
  '7days': 'Last 7 Days',
  '30days': 'Last 30 Days',
  '3months': 'Last 3 Months',
  '6months': 'Last 6 Months',
  '12months': 'Last 12 Months'
};

const MENU_MIN_WIDTH = 220;

const getGreeting = () => {
  const hrs = new Date().getHours();
  if (hrs >= 5 && hrs < 12) return 'Good morning';
  if (hrs >= 12 && hrs < 17) return 'Good afternoon';
  return 'Good evening';
};

const WelcomeBanner = ({
  userName = 'Partner',
  timeRange = '6months',
  setTimeRange
}) => {
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const inTrigger = triggerRef.current?.contains(event.target);
      const inMenu = menuRef.current?.contains(event.target);
      if (!inTrigger && !inMenu) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
        triggerRef.current?.querySelector('button')?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [dropdownOpen]);

  const greeting = useMemo(() => getGreeting(), []);
  const displayName = user?.name || userName;
  const roleBadge =
    user?.role === 'admin'
      ? 'Platform Admin'
      : 'Verified Business';

  const menu = dropdownOpen && mounted
    ? (
        <div
          ref={menuRef}
          id="reporting-period-menu"
          role="listbox"
          aria-label="Reporting period options"
          className="absolute left-0 top-[100%] mt-2 min-w-[220px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] shadow-[0_20px_40px_rgba(15,23,42,0.15)] p-2 z-[9999] transform origin-top animate-in fade-in zoom-in-95 duration-200"
        >
          {Object.entries(optionsMap).map(([key, label]) => {
            const isActive = timeRange === key;
            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  setTimeRange(key);
                  setDropdownOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-[10px] text-[13px] font-semibold flex items-center justify-between transition-colors duration-200 ${
                  isActive
                    ? 'bg-[#E8FFF5] text-[#00A878]'
                    : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                {label}
                {isActive && <Check size={16} className="text-[#00A878] drop-shadow-sm" />}
              </button>
            );
          })}
        </div>
      )
    : null;

  return (
    <div
      className="relative flex flex-col justify-center rounded-[24px] p-[28px] sm:p-[36px] h-full min-h-[220px] md:min-h-[280px] lg:min-h-[320px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-visible group transition-all duration-500 hover:shadow-[0_24px_60px_rgba(0,0,0,0.2)]"
      style={{ background: 'linear-gradient(135deg, #07141A 0%, #062B20 100%)' }}
    >
      {/* Background artwork layer — clip decorative layers only */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[24px]">
        {/* Subtle radial green ambient lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_92%_30%,rgba(0,168,120,0.18),transparent_50%),radial-gradient(circle_at_6%_80%,rgba(0,168,120,0.06),transparent_40%)] mix-blend-overlay"></div>

        {/* Premium glow behind image area */}
        <div
          className="absolute z-[1]"
          style={{
            right: '-5%',
            top: '10%',
            width: '45%',
            height: '80%',
            background: 'radial-gradient(ellipse at center, rgba(0,168,120,0.12) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }}
        ></div>

        {/* Fakhar Zaman Image — pushed further right, reduced opacity */}
        <div 
          className="absolute inset-0 z-[2] transition-opacity duration-700"
          style={{
            backgroundImage: "url('/dashboard/fakhar-zaman-banner.png')",
            backgroundPosition: "calc(100% + 40px) center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "contain",
            opacity: 0.13
          }}
        ></div>

        {/* Strengthened dark overlay — heavier on left for text readability */}
        <div className="absolute inset-0 z-[5]" style={{ background: 'linear-gradient(to right, #031A1F 0%, rgba(3,26,31,0.92) 35%, rgba(3,26,31,0.55) 60%, rgba(3,26,31,0.15) 100%)' }}></div>
      </div>

      <div className="relative z-[10] flex flex-col w-full lg:w-[58%] animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-[12px] font-semibold text-[#a7f3d0] shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300 hover:bg-white/10 hover:border-[#00A878]/40 hover:shadow-[0_4px_16px_rgba(0,168,120,0.15)] cursor-default">
            {user?.role === 'admin' ? 'Platform Admin' : user?.role === 'wholesaler' ? 'GearUp Wholesaler Center' : 'GearUp Manufacturer Center'}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-[12px] font-semibold text-white/90 shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_4px_16px_rgba(255,255,255,0.05)] cursor-default">
            <ShieldCheck size={14} className="text-[#00A878]" />
            {roleBadge}
          </span>
        </div>

        {/* Heading */}
        <h1 className="welcome-banner-title font-[800] text-white tracking-tight leading-tight mb-3 break-words" style={{ color: '#ffffff', fontSize: 'clamp(28px, 4vw, 44px)', maxWidth: '100%', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
          {greeting}, {displayName} 👋
        </h1>

        {/* Subtitle */}
        <p
          className="text-[15px] sm:text-[16px] leading-relaxed mb-8 font-medium"
          style={{ color: 'rgba(255,255,255,0.85)', maxWidth: '520px' }}
        >
          Track revenue, orders, and inventory from one place — built for B2B sports trade.
        </p>

        {/* Reporting Period */}
        {setTimeRange && (
          <div className="relative w-fit" ref={triggerRef}>
            <span className="block text-[11px] font-bold uppercase tracking-[0.06em] text-white/60 mb-2 pl-1">
              Reporting period
            </span>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
              aria-controls="reporting-period-menu"
              onClick={() => {
                setDropdownOpen((open) => !open);
              }}
              className="inline-flex items-center justify-between gap-4 min-w-[180px] bg-white/10 backdrop-blur-md border border-white/15 text-white text-[14px] font-semibold px-5 py-3 rounded-[12px] shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-all duration-300 hover:bg-white/15 hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-[#00A878]/50"
            >
              <span>{optionsMap[timeRange] || 'Last 6 Months'}</span>
              <ChevronDown
                size={18}
                className={`text-[#00A878] transition-transform duration-300 ease-out ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {menu}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(WelcomeBanner);
