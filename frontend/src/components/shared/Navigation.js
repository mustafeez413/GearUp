"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, Lock } from 'lucide-react';
import AdminButton from './AdminButton';

const Navigation = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, logout, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-white/85 backdrop-blur-xl border-b border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]' : 'bg-transparent'
            }`}>
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-10 2xl:px-12">
                <div className="flex justify-between items-center h-20 md:h-[90px]">
                    <div className="flex items-center h-full">
                        <Link href="/" className="flex items-center h-full transition-transform duration-300 hover:scale-[1.03] active:scale-95 group">
                            <img 
                                src="/assets/images/gearup-logo-cropped.png" 
                                alt="GearUp Logo" 
                                className="h-[40px] md:h-[48px] w-auto object-contain transition-all duration-300 drop-shadow-sm group-hover:drop-shadow-md"
                            />
                        </Link>
                        <div className="hidden md:flex items-center ml-4 md:ml-6 pl-4 md:pl-6 border-l-2 border-slate-300/70 h-10">
                            <div className="flex flex-col justify-center gap-1">
                                <span className="text-[12px] md:text-[14px] font-extrabold tracking-[0.2em] uppercase bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent drop-shadow-sm leading-none">
                                    Empowering the Future
                                </span>
                                <span className="text-[10px] md:text-[12px] font-semibold tracking-[0.25em] text-slate-500/90 uppercase leading-none mt-1">
                                    Of E-Commerce
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        className="md:hidden p-2 text-slate-800 hover:text-emerald-600 transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex desktop-auth-menu items-center h-full">
                        <div className="flex items-center space-x-8 mr-8">
                            <Link href={isAuthenticated ? (user?.role === 'wholesaler' || user?.role === 'manufacturer' ? '/wholesaler/marketplace' : `/${user?.role}/dashboard`) : '/login'} className="relative font-body text-[15px] font-semibold text-slate-700 hover:text-emerald-700 transition-colors duration-300 group py-2 flex items-center">
                                Marketplace
                                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-emerald-500 transition-all duration-300 group-hover:w-full rounded-full"></span>
                            </Link>
                            <Link href="/industries" className="relative font-body text-[15px] font-semibold text-slate-700 hover:text-emerald-700 transition-colors duration-300 group py-2 flex items-center">
                                Industries
                                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-emerald-500 transition-all duration-300 group-hover:w-full rounded-full"></span>
                            </Link>
                            <Link href="/about" className="relative font-body text-[15px] font-semibold text-slate-700 hover:text-emerald-700 transition-colors duration-300 group py-2 flex items-center">
                                About
                                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-emerald-500 transition-all duration-300 group-hover:w-full rounded-full"></span>
                            </Link>
                            <Link href="/contact" className="relative font-body text-[15px] font-semibold text-slate-700 hover:text-emerald-700 transition-colors duration-300 group py-2 flex items-center">
                                Contact
                                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-emerald-500 transition-all duration-300 group-hover:w-full rounded-full"></span>
                            </Link>
                        </div>

                        {/* Divider Line */}
                        <div className="h-10 w-[2px] bg-slate-200/60 mx-2"></div>

                        {isAuthenticated ? (
                            <div className="flex items-center space-x-5 ml-6">
                                {user?.role === 'admin' ? (
                                    <>
                                        <span className="font-body text-sm font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-full shadow-inner flex items-center">
                                            {user.name}
                                        </span>
                                        <AdminButton to="/admin/dashboard" />
                                    </>
                                ) : (
                                    <Link href={user?.role === 'manufacturer' ? '/manufacturer/dashboard' : '/wholesaler/dashboard'} className="font-body text-[15px] font-bold text-primary-deep hover:text-emerald-600 transition-colors flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                                            {user?.name?.charAt(0) || 'U'}
                                        </div>
                                        Dashboard
                                    </Link>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="px-5 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 font-body text-[15px] font-semibold flex items-center justify-center"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4 ml-6">
                                <Link href="/login" className="font-body text-[15px] font-bold text-slate-700 hover:text-emerald-600 transition-colors px-4 py-2.5 rounded-lg hover:bg-emerald-50 flex items-center justify-center">
                                    Log In
                                </Link>
                                <Link href="/register" className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-primary-deep text-white rounded-lg transition-all shadow-[0_4px_14px_0_rgb(5,150,105,0.39)] hover:shadow-[0_6px_20px_rgba(5,150,105,0.23)] hover:-translate-y-0.5 font-body text-[15px] font-bold tracking-wide flex items-center justify-center">
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Navigation */}
                    {isMobileMenuOpen && (
                        <div className="mobile-auth-menu absolute top-24 left-0 w-full bg-white/95 backdrop-blur-xl shadow-2xl flex flex-col p-6 border-t border-slate-100 rounded-b-3xl">
                            <Link href={isAuthenticated ? (user?.role === 'wholesaler' || user?.role === 'manufacturer' ? '/wholesaler/marketplace' : `/${user?.role}/dashboard`) : '/login'} onClick={() => setIsMobileMenuOpen(false)} className="font-body text-base font-semibold text-slate-700 hover:text-emerald-600 transition-colors py-4 border-b border-slate-100">Marketplace</Link>
                            <Link href="/industries" onClick={() => setIsMobileMenuOpen(false)} className="font-body text-base font-semibold text-slate-700 hover:text-emerald-600 transition-colors py-4 border-b border-slate-100">Industries</Link>
                            <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="font-body text-base font-semibold text-slate-700 hover:text-emerald-600 transition-colors py-4 border-b border-slate-100">About</Link>
                            <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="font-body text-base font-semibold text-slate-700 hover:text-emerald-600 transition-colors py-4 border-b border-slate-100">Contact</Link>

                            {isAuthenticated ? (
                                <div className="flex flex-col space-y-4 mt-6">
                                    {user?.role === 'admin' ? (
                                        <Link href="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="font-body text-base font-bold text-primary-deep hover:text-emerald-600 transition-colors py-2 text-center bg-emerald-50 rounded-xl">
                                            Dashboard
                                        </Link>
                                    ) : (
                                        <Link href={user?.role === 'manufacturer' ? '/manufacturer/dashboard' : '/wholesaler/dashboard'} onClick={() => setIsMobileMenuOpen(false)} className="font-body text-base font-bold text-primary-deep hover:text-emerald-600 transition-colors py-2 text-center bg-emerald-50 rounded-xl">
                                            Dashboard
                                        </Link>
                                    )}

                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-center px-4 py-3.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all shadow-md font-body text-base font-bold"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col space-y-4 mt-6">
                                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-center font-body text-base font-bold text-slate-700 hover:text-emerald-600 transition-colors py-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                                        Log In
                                    </Link>
                                    <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="text-center px-4 py-3.5 bg-gradient-to-r from-emerald-600 to-primary-deep text-white rounded-xl shadow-lg font-body text-base font-bold">
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
