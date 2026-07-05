"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getApiBaseUrl } from '@/lib/api';
import {
  Menu,
  ShoppingCart,
  Search,
  MessageSquare,
  ChevronDown,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Plus
} from 'lucide-react';
import NotificationBell from '../NotificationBell';
import UserAvatar from '@/components/ui/UserAvatar';
import ChatNotificationBadge from '@/components/shared/ChatNotificationBadge';

const Topbar = ({
  onToggleSidebar,
  onAddProductClick,
  isSidebarOpen = true,
  isMobile = false
}) => {
  const { user, logout, isReadOnlyMode } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      const role = user?.role || 'wholesaler';
      const cartKey = role === 'wholesaler' ? 'wholesaler_cart' : 'manufacturer_cart';
      const savedCart = localStorage.getItem(cartKey) || localStorage.getItem('wholesaler_cart');
      if (savedCart) {
        try {
          setCartCount(JSON.parse(savedCart).length || 0);
        } catch {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    const interval = setInterval(updateCartCount, 1000);
    return () => {
      window.removeEventListener('storage', updateCartCount);
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const breadcrumbs = useMemo(() => {
    if (pathname === '/wholesaler/marketplace' || pathname.startsWith('/wholesaler/marketplace/')) {
      const roleLabel = user?.role === 'wholesaler' ? 'Wholesaler' : 'Manufacturer';
      if (pathname === '/wholesaler/marketplace') {
        return [roleLabel, 'Marketplace'];
      }
      return [roleLabel, 'Marketplace', 'Product Details'];
    }

    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return ['Home'];
    return parts.map((p) => {
      const name = p.replace(/-/g, ' ');
      return name.charAt(0).toUpperCase() + name.slice(1);
    });
  }, [pathname, user?.role]);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    router.push('/login');
  };

  const roleDisplay =
    user?.role === 'admin'
      ? 'Administrator'
      : user?.role === 'wholesaler'
        ? 'Wholesaler'
        : 'Manufacturer';

  const profileHref = user?.role === 'wholesaler' ? '/wholesaler/profile' : '/profile';

  const badgeClass =
    'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#00A878] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 border-2 border-white';

  return (
    <header className="topbar">
      <div className="h-full w-full px-4 sm:px-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="topbar-menu-btn shrink-0 lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu size={22} />
          </button>

          <div className="hidden sm:block min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#00A878]">
              {user?.role === 'admin' ? 'GearUp Admin Center' : user?.role === 'wholesaler' ? 'GearUp Wholesaler Center' : 'GearUp Manufacturer Center'}
            </div>
            <div className="text-sm font-semibold text-[#0F172A] truncate">{breadcrumbs.join(' › ')}</div>
          </div>
        </div>

        <div className="flex items-center gap-5 shrink-0 ml-auto">

          <NotificationBell />

          {user?.role !== 'admin' && (
            <>
              <Link
                href={user?.role === 'wholesaler' ? '/wholesaler/chats' : '/manufacturer/chats'}
                className="icon-wrapper relative"
              >
                <MessageSquare size={20} />
                <ChatNotificationBadge />
              </Link>
              <Link href="/wholesaler/cart" className={`icon-wrapper relative ${isReadOnlyMode ? 'pointer-events-none opacity-40' : ''}`} aria-disabled={isReadOnlyMode} title={isReadOnlyMode ? 'Cart unavailable in read-only mode' : 'Cart'}>
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className={badgeClass}>{cartCount > 99 ? '99+' : cartCount}</span>
                )}
              </Link>
            </>
          )}

          <div className="w-px h-8 bg-[#E5E7EB] mx-1 hidden sm:block" />

          {/* Profile block */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="profile-btn"
            >
              <div className="relative shrink-0">
                <UserAvatar user={user} size="sm" className="border-2 border-[#00A878] bg-[#062B20]" />
                <span className="status-indicator" />
              </div>
              <div className="text-left hidden sm:block min-w-0 max-w-[140px]">
                <div className="text-sm font-bold text-[#0F172A] truncate leading-tight">
                  {user?.name || 'User'}
                </div>
                <div className="text-[11px] font-semibold text-[#64748B] capitalize">
                  {roleDisplay}
                </div>
              </div>
              <ChevronDown
                size={16}
                className={`text-[#94A3B8] hidden sm:block shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <div className="dropdown-menu">
                <div className="p-4 bg-gradient-to-br from-[#0b141e] to-[#152535] text-white">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={user} size="md" variant="dark" className="border-2 border-[#00A878]" />
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate">{user?.name}</div>
                      <div className="text-xs text-[#00A878] font-semibold">{roleDisplay}</div>
                      <div className="text-[10px] text-white/50 truncate mt-0.5">{user?.email}</div>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <Link href={profileHref} onClick={() => setDropdownOpen(false)} className="dropdown-link">
                    <User size={16} className="text-[#00A878]" /> My account
                  </Link>
                  <Link href={profileHref} onClick={() => setDropdownOpen(false)} className="dropdown-link">
                    <Settings size={16} className="text-[#00A878]" /> Settings
                  </Link>
                  <Link href="/contact" onClick={() => setDropdownOpen(false)} className="dropdown-link">
                    <HelpCircle size={16} className="text-[#00A878]" /> Help
                  </Link>
                  <button type="button" onClick={handleLogout} className="dropdown-logout">
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
