"use client";

import React from 'react';
import { HelpCircle, MessageSquare, Clock, FileText, Zap } from 'lucide-react';

const SupportCard = ({ className = "" }) => {
  return (
    <div className={`bg-white rounded-[16px] border border-[#E5E7EB] shadow-[0_8px_24px_rgba(15,23,42,0.05)] overflow-hidden select-none ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00A878]/15 blur-[40px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#00A878] bg-[#00A878]/10 border border-[#00A878]/20 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A878] animate-pulse" />
              Priority Support
            </span>
          </div>
          <h3 className="text-[20px] font-[800] text-white tracking-tight mt-3">Help &amp; Support</h3>
          <p className="text-[13px] text-white/60 font-medium mt-1">B2B Sports Merchant Help Desk</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        <p className="text-[13px] text-[#64748B] font-medium leading-relaxed">
          Need assistance with wholesale transactions, product cataloging, or bank payouts? Our dedicated merchant support team is available 24/7.
        </p>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="group p-4 bg-white border border-[#E5E7EB] rounded-[12px] flex flex-col gap-3 hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition-all duration-300 cursor-pointer">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-[#00A878] group-hover:text-white transition-all duration-300 text-[#00A878]">
              <MessageSquare size={18} strokeWidth={2} />
            </div>
            <div>
              <h5 className="font-bold text-[13px] text-[#0F172A] leading-tight">Live Chat</h5>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mt-1.5 block">Avg reply: 2 min</span>
            </div>
          </div>

          <div className="group p-4 bg-white border border-[#E5E7EB] rounded-[12px] flex flex-col gap-3 hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition-all duration-300 cursor-pointer">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 text-blue-600">
              <HelpCircle size={18} strokeWidth={2} />
            </div>
            <div>
              <h5 className="font-bold text-[13px] text-[#0F172A] leading-tight">Docs &amp; FAQs</h5>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mt-1.5 block">42+ sport guides</span>
            </div>
          </div>
        </div>

        {/* SLA Info */}
        <div className="space-y-0 divide-y divide-slate-100 border border-[#E5E7EB] rounded-[12px] overflow-hidden bg-slate-50/50">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2.5">
              <Clock size={14} className="text-[#64748B]" strokeWidth={2} />
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest">Hours</span>
            </div>
            <span className="text-[11px] font-[800] text-[#0F172A]">Mon–Sat, 9am–7pm</span>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2.5">
              <Zap size={14} className="text-[#00A878]" strokeWidth={2} />
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest">Response SLA</span>
            </div>
            <span className="text-[11px] font-[800] text-[#00A878]">Under 2 hours</span>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2.5">
              <FileText size={14} className="text-[#64748B]" strokeWidth={2} />
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest">Ticket Status</span>
            </div>
            <span className="text-[11px] font-[800] text-[#0F172A]">Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportCard;
