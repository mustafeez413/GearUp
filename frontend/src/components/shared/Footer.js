import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Twitter, Linkedin, Instagram, ArrowRight } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-[#021812] relative overflow-hidden pt-14 pb-8 border-t border-emerald-900/40">
            {/* Ultra-Premium Mesh Gradient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[60%] rounded-full bg-emerald-600/10 blur-[120px]"></div>
                <div className="absolute top-[10%] -right-[10%] w-[40%] h-[50%] rounded-full bg-teal-600/10 blur-[100px]"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] rounded-full bg-emerald-900/20 blur-[120px]"></div>
            </div>
            
            {/* Top decorative glowing beam */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] max-w-[800px] h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"></div>

            <div className="w-full mx-auto px-4 sm:px-6 lg:px-10 2xl:px-12 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-12">
                    
                    {/* Brand Column (Span 4) */}
                    <div className="lg:col-span-4 space-y-6">
                        <Link href="/" className="flex items-center gap-4 group inline-flex relative">
                             {/* Ambient white spotlight to make the dark logo readable */}
                             <div className="absolute left-[40px] top-1/2 -translate-y-1/2 -translate-x-1/2 w-[100px] h-[60px] bg-white/40 blur-[20px] rounded-full pointer-events-none transition-all duration-300 group-hover:bg-white/60"></div>
                             
                             <img src="/assets/images/gearup-logo-cropped.png" alt="GearUp Logo" className="relative z-10 h-[40px] md:h-[48px] w-auto object-contain opacity-100 transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
                             <div className="relative z-10 flex flex-col justify-center border-l-2 border-emerald-700/50 pl-5 h-10">
                                <span className="text-[13px] md:text-[15px] font-black tracking-[0.3em] uppercase bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent drop-shadow-sm">
                                    Empowering the Future
                                </span>
                                <span className="text-[10px] md:text-[12px] font-extrabold tracking-[0.4em] text-emerald-400 uppercase mt-1 drop-shadow-sm">
                                    Of E-Commerce
                                </span>
                            </div>
                        </Link>
                        <div className="relative group inline-block mt-2">
                            {/* Animated background glow */}
                            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                            
                            <div className="relative border-l-[3px] border-emerald-500/80 pl-4 py-1.5">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[14px] text-emerald-100/60 font-light tracking-wider flex items-center gap-3">
                                        We build the bridge
                                        <span className="w-12 h-[1px] bg-gradient-to-r from-emerald-500/80 to-transparent"></span>
                                    </span>
                                    <span className="text-white font-black tracking-[0.35em] uppercase text-[12px] md:text-[13px] bg-gradient-to-r from-white via-emerald-100 to-emerald-500 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]">
                                        You own the market.
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <a href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center text-emerald-200/70 hover:text-white hover:border-emerald-400/50 hover:bg-emerald-500/20 transition-all duration-300 shadow-xl group">
                                <Twitter size={15} className="group-hover:scale-110 transition-transform duration-300" />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center text-emerald-200/70 hover:text-white hover:border-emerald-400/50 hover:bg-emerald-500/20 transition-all duration-300 shadow-xl group">
                                <Linkedin size={15} className="group-hover:scale-110 transition-transform duration-300" />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center text-emerald-200/70 hover:text-white hover:border-emerald-400/50 hover:bg-emerald-500/20 transition-all duration-300 shadow-xl group">
                                <Instagram size={15} className="group-hover:scale-110 transition-transform duration-300" />
                            </a>
                        </div>
                    </div>

                    {/* Links Columns (Span 6 total) */}
                    <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
                        <div>
                            <h4 className="text-emerald-400 font-bold mb-5 tracking-[0.2em] text-[10px] uppercase pl-1">Platform</h4>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/wholesaler/marketplace" className="group flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-transparent hover:border-emerald-500/20 hover:bg-emerald-500/10 transition-all duration-300">
                                        <span className="text-[13px] font-medium text-emerald-100/70 group-hover:text-emerald-100 transition-colors">Marketplace</span>
                                        <ArrowRight size={14} className="text-emerald-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/industries" className="group flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-transparent hover:border-emerald-500/20 hover:bg-emerald-500/10 transition-all duration-300">
                                        <span className="text-[13px] font-medium text-emerald-100/70 group-hover:text-emerald-100 transition-colors">Industries</span>
                                        <ArrowRight size={14} className="text-emerald-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-emerald-400 font-bold mb-5 tracking-[0.2em] text-[10px] uppercase pl-1">Company</h4>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/about" className="group flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-transparent hover:border-emerald-500/20 hover:bg-emerald-500/10 transition-all duration-300">
                                        <span className="text-[13px] font-medium text-emerald-100/70 group-hover:text-emerald-100 transition-colors">About Us</span>
                                        <ArrowRight size={14} className="text-emerald-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/contact" className="group flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-transparent hover:border-emerald-500/20 hover:bg-emerald-500/10 transition-all duration-300">
                                        <span className="text-[13px] font-medium text-emerald-100/70 group-hover:text-emerald-100 transition-colors">Contact Us</span>
                                        <ArrowRight size={14} className="text-emerald-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-emerald-400 font-bold mb-5 tracking-[0.2em] text-[10px] uppercase pl-1">Legal</h4>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/terms" className="group flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-transparent hover:border-emerald-500/20 hover:bg-emerald-500/10 transition-all duration-300">
                                        <span className="text-[13px] font-medium text-emerald-100/70 group-hover:text-emerald-100 transition-colors">Terms & Conditions</span>
                                        <ArrowRight size={14} className="text-emerald-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/commission" className="group flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-transparent hover:border-emerald-500/20 hover:bg-emerald-500/10 transition-all duration-300">
                                        <span className="text-[13px] font-medium text-emerald-100/70 group-hover:text-emerald-100 transition-colors">Commission Policies</span>
                                        <ArrowRight size={14} className="text-emerald-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/privacy" className="group flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-transparent hover:border-emerald-500/20 hover:bg-emerald-500/10 transition-all duration-300">
                                        <span className="text-[13px] font-medium text-emerald-100/70 group-hover:text-emerald-100 transition-colors">Privacy Policies</span>
                                        <ArrowRight size={14} className="text-emerald-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-6 border-t border-white/5 flex justify-center items-center">
                    <p className="text-[11px] font-medium text-emerald-100/40 tracking-[0.1em] uppercase text-center">
                        &copy; {new Date().getFullYear()} GEARUP B2B MARKETPLACE. ALL RIGHTS RESERVED.
                    </p>
                </div>
            </div>
        </footer>
    );
}
