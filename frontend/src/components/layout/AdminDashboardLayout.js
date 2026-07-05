"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getApiBaseUrl } from '@/lib/api';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    BarChart3,
    Banknote,
    Users,
    CheckCircle,
    LogOut,
    Building2,
    Search,
    Store,
    ShoppingBag,
    Settings,
    Menu,
    X,
    MessageSquare,
    AlertTriangle
} from 'lucide-react';

import GlobalChatbot from '@/components/shared/GlobalChatbot';
import NotificationBell from '@/components/NotificationBell';
import ChatNotificationBadge from '@/components/shared/ChatNotificationBadge';
import UserAvatar from '@/components/ui/UserAvatar';

const DashboardLayout = ({ children }) => {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout, updateUser } = useAuth();
    const [cartItemCount, setCartItemCount] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [submittingModal, setSubmittingModal] = useState(false);
    const [openDisputeCount, setOpenDisputeCount] = useState(0);

    useEffect(() => {
        // TEMP_DISABLED_TERMS_GATE
        // Keep the check commented out so we can re-enable later
        /*
        if (user && (user.role === 'manufacturer' || user.role === 'wholesaler') && !user.acceptedPolicies) {
            setShowPolicyModal(true);
        } else {
            setShowPolicyModal(false);
        }
        */
        setShowPolicyModal(false);
    }, [user]);

    const handleAcceptPolicies = async () => {
        // TEMP_DISABLED_TERMS_GATE
        setShowPolicyModal(false);
        return;

        /*
        if (!agreed) return;
        setSubmittingModal(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${getApiBaseUrl()}/api/auth/accept-policies`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                updateUser({
                    ...user,
                    acceptedPolicies: true,
                    acceptedPoliciesAt: data.data.acceptedPoliciesAt
                });
                setShowPolicyModal(false);
            } else {
                alert(data.error || 'Failed to accept policies. Please try again.');
            }
        } catch (error) {
            console.error('Accept policies error:', error);
            alert('Failed to accept policies. Please check your network connection and try again.');
        } finally {
            setSubmittingModal(false);
        }
        */
    };

    useEffect(() => {
        // Verification Gate
        if (user && !user.isEmailVerified && user.role !== 'admin') {
            router.replace(`/verify-email?email=${encodeURIComponent(user.email)}`);
        }
    }, [user, router]);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) {
                setMobileNavOpen(false);
                setIsSidebarOpen(true);
            } else {
                setIsSidebarOpen(false);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const updateCount = () => {
            const savedCart = localStorage.getItem('wholesaler_cart');
            if (savedCart) {
                try {
                    setCartItemCount(JSON.parse(savedCart).length);
                } catch {
                    setCartItemCount(0);
                }
            } else {
                setCartItemCount(0);
            }
        };
        updateCount();
        window.addEventListener('storage', updateCount);
        return () => window.removeEventListener('storage', updateCount);
    }, []);

    useEffect(() => {
        if (!user?.role) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        const openStatuses = ['open', 'awaiting_seller', 'seller_responded', 'under_review', 'investigating'];
        const countOpen = (list) => (list || []).filter((d) => openStatuses.includes(d.status)).length;
        const headers = { Authorization: `Bearer ${token}` };
        const base = getApiBaseUrl();

        const load = async () => {
            try {
                if (user.role === 'admin') {
                    const r = await fetch(`${base}/api/disputes/admin`, { headers });
                    const data = await r.json();
                    if (data.success) setOpenDisputeCount(countOpen(data.data));
                    return;
                }
                if (user.role === 'manufacturer') {
                    const [sellerRes, mineRes] = await Promise.all([
                        fetch(`${base}/api/disputes/seller`, { headers }),
                        fetch(`${base}/api/disputes/mine`, { headers })
                    ]);
                    const sellerData = await sellerRes.json();
                    const mineData = await mineRes.json();
                    const n =
                        (sellerData.success ? countOpen(sellerData.data) : 0) +
                        (mineData.success ? countOpen(mineData.data) : 0);
                    setOpenDisputeCount(n);
                    return;
                }
                if (user.role === 'wholesaler') {
                    const r = await fetch(`${base}/api/disputes/mine`, { headers });
                    const data = await r.json();
                    if (data.success) setOpenDisputeCount(countOpen(data.data));
                }
            } catch {
                /* ignore badge fetch errors */
            }
        };

        load();
    }, [user?.role, pathname]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const manufacturerMenu = [
        { path: '/manufacturer/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/manufacturer/products', label: 'Inventory', icon: Package },
        { path: '/manufacturer/orders', label: 'Sales orders', icon: ShoppingCart },
        { path: '/wholesaler/marketplace', label: 'Marketplace', icon: Search },
        { path: '/manufacturer/chats', label: 'Seller chats', icon: MessageSquare },
        { path: '/wholesaler/cart', label: 'Cart', icon: Store },
        { path: '/wholesaler/orders', label: 'Purchase orders', icon: ShoppingBag },
        { path: '/manufacturer/transactions', label: 'Payments', icon: Banknote },
        { path: '/manufacturer/disputes', label: 'Order issues', icon: AlertTriangle, badgeCount: openDisputeCount || undefined },
        { path: '/manufacturer/settings', label: 'Settings', icon: Settings },
    ];

    const wholesalerMenu = [
        { path: '/wholesaler/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/manufacturer/products', label: 'Inventory', icon: Package },
        { path: '/manufacturer/orders', label: 'Sales orders', icon: ShoppingCart },
        { path: '/wholesaler/marketplace', label: 'Marketplace', icon: Search },
        { path: '/wholesaler/chats', label: 'Seller chats', icon: MessageSquare },
        { path: '/wholesaler/cart', label: 'Cart', icon: Store },
        { path: '/wholesaler/orders', label: 'Purchase orders', icon: ShoppingBag },
        { path: '/manufacturer/transactions', label: 'Payments', icon: Banknote },
        { path: '/manufacturer/disputes', label: 'Order issues', icon: AlertTriangle, badgeCount: openDisputeCount || undefined },
        { path: '/wholesaler/settings', label: 'Settings', icon: Settings },
    ];

    const adminMenu = [
        { path: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/admin/disputes', label: 'Order issues', icon: AlertTriangle, badgeCount: openDisputeCount || undefined },
        { path: '/admin/escrow', label: 'Escrow center', icon: Banknote },
        { path: '/admin/verifications', label: 'Verifications', icon: CheckCircle },
        { path: '/admin/users', label: 'Users', icon: Users },
        { path: '/admin/payouts', label: 'Payment Records', icon: Banknote },
    ];

    const menu = user?.role === 'manufacturer' 
        ? manufacturerMenu 
        : user?.role === 'wholesaler' 
            ? wholesalerMenu
            : adminMenu;

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
            {/* Redesigned Premium Glassmorphism Navbar */}
            <header className="h-[72px] sm:h-[84px] bg-white/80 backdrop-blur-md border-b border-slate-100/60 fixed top-0 w-full z-[60] px-4 sm:px-6 lg:px-10 flex items-center justify-between shadow-[0_2px_20px_rgba(0,0,0,0.015)] transition-all">
                {/* BRAND LOGO & TOGGLE SECTION */}
                <div className="flex items-center gap-3 sm:gap-8 min-w-0">
                    <button
                        type="button"
                        onClick={() => {
                            if (isMobile) setMobileNavOpen(!mobileNavOpen);
                            else setIsSidebarOpen(!isSidebarOpen);
                        }}
                        className="p-2 hover:bg-slate-50 rounded-xl transition-all duration-300 text-slate-500 hover:text-slate-800 shrink-0"
                        aria-label="Toggle menu"
                    >
                        {isMobile ? (mobileNavOpen ? <X size={20} /> : <Menu size={20} />) : isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <Link 
                        href={user?.role === 'manufacturer' ? '/manufacturer/dashboard' : user?.role === 'wholesaler' ? '/wholesaler/dashboard' : '/admin/dashboard'} 
                        className="flex items-center gap-3.5 select-none transition-all group"
                    >
                        <img 
                            src="/icon.png" 
                            className="w-11 h-11 object-contain rounded-xl shadow-sm border border-slate-100 group-hover:scale-105 transition-transform duration-300" 
                            alt="GearUp" 
                        />
                        <span className="font-heading text-lg sm:text-2xl font-black text-slate-950 tracking-tighter uppercase italic leading-none group-hover:text-emerald-600 transition-colors truncate">
                            GearUp
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-5 lg:gap-6">
                    {/* Notifications with interaction layer */}
                    <div className="p-1 hover:bg-slate-50 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                        <NotificationBell />
                    </div>

                    {(user?.role === 'wholesaler' || user?.role === 'manufacturer') && (
                        <Link href="/wholesaler/cart" className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all relative hover:scale-105 duration-300" aria-label="Cart">
                            <ShoppingCart size={20} />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-emerald-600 text-white rounded-full text-[10px] flex items-center justify-center font-black border-2 border-white px-1 shadow-sm animate-in fade-in duration-300">
                                    {cartItemCount}
                                </span>
                            )}
                        </Link>
                    )}

                    <div className="w-px h-6 bg-slate-200" />

                    {/* Enhanced Profile Sizing & Quality Rendering */}
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block select-none">
                            <div className="font-body font-bold text-slate-900 text-sm leading-tight mb-0.5">{user?.name || 'Authorized User'}</div>
                            <div className="font-body text-[9px] font-black uppercase tracking-widest text-emerald-600 flex items-center justify-end gap-1 leading-none">
                                {(user?.verificationStatus === 'approved' || user?.verificationStatus === 'verified') && <CheckCircle size={9} className="text-emerald-500" />}
                                {user?.role || 'Guest'}
                            </div>
                        </div>
                        <Link
                            href={user?.role === 'wholesaler' ? "/wholesaler/profile" : "/profile"}
                            className="hover:ring-4 hover:ring-emerald-500/10 transition-all shrink-0 group shadow-sm rounded-full"
                        >
                            <UserAvatar
                              user={user}
                              size="md"
                              variant="emerald"
                              imageClassName="group-hover:scale-105 transition-transform duration-500"
                            />
                        </Link>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="hidden sm:flex items-center gap-2 px-4 py-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-body font-black text-[10px] uppercase tracking-widest border border-transparent hover:border-red-100"
                    >
                        <LogOut size={14} />
                        Sign Out
                    </button>
                </div>
            </header>

            <div className="flex flex-1 pt-[72px] sm:pt-[84px]">
                {isMobile && mobileNavOpen && (
                    <button
                        type="button"
                        className="fixed inset-0 top-[72px] sm:top-[84px] bg-black/50 z-40"
                        aria-label="Close menu"
                        onClick={() => setMobileNavOpen(false)}
                    />
                )}
                {/* Sidebar */}
                <aside
                    className={`fixed left-0 top-[72px] sm:top-[84px] h-[calc(100vh-72px)] sm:h-[calc(100vh-84px)] bg-white border-r border-slate-100 transition-all duration-300 z-50 ${
                        isMobile
                            ? mobileNavOpen ? 'w-64 translate-x-0' : '-translate-x-full w-64'
                            : isSidebarOpen ? 'w-60' : 'w-16'
                    }`}
                >
                    <div className="flex flex-col h-full">
                        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                            {menu.map((item) => {
                                const Icon = item.icon;
                                const pathBase = item.path.split('?')[0];
                                const isActive = pathname === pathBase || pathname.startsWith(pathBase + '/');
                                const isChatItem = item.label === 'Seller chats' && user?.role === 'manufacturer';
                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        onClick={() => isMobile && setMobileNavOpen(false)}
                                        className={`flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-body font-bold text-sm transition-all group relative ${isActive
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                    >
                                        <div className="relative shrink-0">
                                            <Icon size={18} className={isActive ? 'text-slate-300' : 'group-hover:text-emerald-600 transition-colors'} />
                                            {isChatItem && <ChatNotificationBadge />}
                                        </div>
                                        {(isSidebarOpen || isMobile) && (
                                            <span className="truncate flex-1">{item.label}</span>
                                        )}
                                        {item.badgeCount > 0 && isSidebarOpen && (
                                            <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                                                {item.badgeCount}
                                            </span>
                                        )}
                                        {isActive && isSidebarOpen && !item.badgeCount && (
                                            <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Support/Settings footer */}
                        <div className="p-3 border-t border-slate-50">
                            <Link
                                href={user?.role === 'wholesaler' ? "/wholesaler/profile" : user?.role === 'manufacturer' ? "/profile" : "/admin/settings"}
                                className={`flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-body font-bold text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all group ${!isSidebarOpen && 'justify-center'}`}
                            >
                                <Settings size={18} className="group-hover:rotate-45 transition-transform duration-500" />
                                {isSidebarOpen && <span>Settings</span>}
                            </Link>
                            <button
                                onClick={handleLogout}
                                className={`flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-body font-bold text-sm text-red-400 hover:bg-red-50 hover:text-red-700 transition-all group mt-1 w-full ${!isSidebarOpen && 'justify-center'}`}
                            >
                                <LogOut size={18} />
                                {isSidebarOpen && <span>Logout</span>}
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Workspace */}
                <main
                    className={`flex-1 transition-all duration-300 w-full min-w-0 overflow-x-hidden ${
                        isMobile ? 'ml-0' : isSidebarOpen ? 'ml-60' : 'ml-16'
                    } p-4 sm:p-6 lg:p-10`}
                >
                    <div className="max-w-[1200px] mx-auto flex flex-col min-h-[calc(100vh-164px)] justify-between min-w-0">
                        <div>
                            {children}
                        </div>
                        

                    </div>
                </main>
            </div>

            {/* Persistent AI layer */}
            {user?.role !== 'admin' && <GlobalChatbot />}

            {/* Policy Acceptance Modal */}
            {showPolicyModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-8 md:p-10 my-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h2 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Platform Policies & Terms</h2>
                                <p className="text-sm text-slate-500 font-medium">Please review and accept our rules before accessing your dashboard</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-6 space-y-6 max-h-[300px] overflow-y-auto font-body text-slate-600 text-sm leading-relaxed mb-6">
                            <div>
                                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5 text-emerald-700 font-sans">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 1. Service Settlement Agreement
                                </h3>
                                <p>
                                    GearUp utilizes high-speed matching systems and automated verification services that are processed server-side for absolute safety and platform security.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5 text-emerald-700 font-sans">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 2. Escrow & Payment Policies
                                </h3>
                                <p>
                                    All B2B transactions require valid advance payment proof (bank deposit slip or invoice). Settlements are paid out weekly to registered seller bank accounts. No manual or off-platform payment settlements are permitted.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5 text-emerald-700 font-sans">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 3. Refund & Dispute Policies
                                </h3>
                                <p>
                                    Refunds and cancellations are only supported prior to order shipment or in case of verified damaged shipments notified within 48 hours of delivery. In administrator-approved refund settlements, dynamic refund rules apply to the clawback of platform fees.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5 text-emerald-700 font-sans">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 4. Fraud & Code of Conduct
                                </h3>
                                <p>
                                    Any attempt to bypass platform guidelines, share off-platform payment information, perform duplicate transactions, or misrepresent business details will result in immediate investigation, rating penalties, and potential account termination.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5 text-emerald-700 font-sans">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 5. Suspension & Violation
                                </h3>
                                <p>
                                    Accounts that consistently fail quality compliance, exceed delivery latency thresholds, or accumulate poor buyer ratings are subject to temporary rating blocks, payout holding, or permanent suspension at administrative discretion.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 mb-8">
                            <input
                                type="checkbox"
                                id="modalAgree"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="w-5 h-5 mt-0.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                            />
                            <label htmlFor="modalAgree" className="text-sm font-semibold text-slate-700 select-none cursor-pointer">
                                I agree to the <a href="/terms" target="_blank" className="text-emerald-700 underline">Terms of Service</a>, <a href="/commission-policy" target="_blank" className="text-emerald-700 underline">Commission Policies</a>, and <a href="/privacy" target="_blank" className="text-emerald-700 underline">Refund & Fraud Policies</a> of GearUp.
                            </label>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button
                                onClick={handleAcceptPolicies}
                                disabled={!agreed || submittingModal}
                                className="w-full sm:flex-1 py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-center"
                            >
                                {submittingModal ? 'Processing...' : 'Accept & Continue'}
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full sm:w-auto px-6 py-4 border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-600 hover:text-red-700 rounded-xl transition-all font-bold"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardLayout;
