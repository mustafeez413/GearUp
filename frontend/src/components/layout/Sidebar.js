"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getApiBaseUrl } from '@/lib/api';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Search,
  MessageSquare,
  Banknote,
  BarChart3,
  Settings,
  HelpCircle,
  LifeBuoy,
  X,
  LogOut,
  Users,
  CheckCircle,
  Megaphone,
  ShoppingBag,
  AlertTriangle,
  FileText,
  PlusCircle,
  LineChart,
  Receipt,
  Tag,
  Bell,
} from 'lucide-react';
import { AD_SYSTEM_ENABLED } from '@/lib/advertisingConfig';
import AdminSidebarNav from '@/components/admin/AdminSidebarNav';
import UserAvatar from '@/components/ui/UserAvatar';

const Sidebar = ({
  isOpen = true,
  onClose,
  isMobile = false,
  widthFull = 280,
  widthCollapsed = 72,
}) => {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOrders, setUnreadOrders] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && json.data) {
          const unread = json.data.filter(n => !n.isRead);
          setUnreadCount(unread.length);
          setUnreadOrders(unread.filter(n => n.type === 'order' || (n.message || '').toLowerCase().includes('order')).length);
          setUnreadChats(unread.filter(n => n.type === 'message' || (n.message || '').toLowerCase().includes('chat') || (n.message || '').toLowerCase().includes('message')).length);
        }
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    };
    if (user) {
      fetchUnread();
    }
    
    // Listen for custom event to update badge immediately
    const handleRead = () => fetchUnread();
    window.addEventListener('notifications-read', handleRead);
    return () => window.removeEventListener('notifications-read', handleRead);
  }, [user]);

  const getMenuItems = () => {
    if (user?.role === 'admin') {
      return null;
    }

    if (user?.role === 'wholesaler') {
      return [
        { label: 'Overview', path: '/wholesaler/dashboard', icon: LayoutDashboard },
        { label: 'Inventory', path: '/manufacturer/products', icon: Package },
        { label: 'Sales Orders', path: '/manufacturer/orders', icon: ShoppingCart, hasNotification: unreadOrders },
        { label: 'Purchase Orders', path: '/wholesaler/orders', icon: ShoppingBag, hasNotification: unreadOrders },
        { label: 'Marketplace', path: '/wholesaler/marketplace', icon: Search },
        { label: 'Seller Chats', path: '/wholesaler/chats', icon: MessageSquare, hasNotification: unreadChats },
        { label: 'Payments', path: '/manufacturer/transactions', icon: Banknote },
        { label: 'Order Issues', path: '/manufacturer/disputes', icon: AlertTriangle },
        { label: 'Support Requests', path: '/wholesaler/support', icon: LifeBuoy },
        { label: 'Analytics', path: '/manufacturer/analytics', icon: BarChart3 },
      ];
    }

    const manufacturerItems = [
      { label: 'Overview', path: '/manufacturer/dashboard', icon: LayoutDashboard },
      { label: 'Inventory', path: '/manufacturer/products', icon: Package },
      { label: 'Sales Orders', path: '/manufacturer/orders', icon: ShoppingCart, hasNotification: unreadOrders },
      { label: 'Purchase Orders', path: '/wholesaler/orders', icon: ShoppingBag, hasNotification: unreadOrders },
      { label: 'Marketplace', path: '/wholesaler/marketplace', icon: Search },
      { label: 'Seller Chats', path: '/manufacturer/chats', icon: MessageSquare, hasNotification: unreadChats },
      { label: 'Payments', path: '/manufacturer/transactions', icon: Banknote },
      { label: 'Order Issues', path: '/manufacturer/disputes', icon: AlertTriangle },
      { label: 'Support Requests', path: '/manufacturer/support', icon: LifeBuoy },
      { label: 'Analytics', path: '/manufacturer/analytics', icon: BarChart3 },
    ];

    if (AD_SYSTEM_ENABLED) {
      manufacturerItems.push(
        { label: 'Create Advertisement', path: '/manufacturer/advertising/create', icon: PlusCircle, section: 'Marketing & Advertising' },
        { label: 'Active Campaigns', path: '/manufacturer/advertising/campaigns', icon: Megaphone, section: 'Marketing & Advertising' },
        { label: 'Campaign Analytics', path: '/manufacturer/advertising/analytics', icon: LineChart, section: 'Marketing & Advertising' },
        { label: 'Billing History', path: '/manufacturer/advertising/billing', icon: Receipt, section: 'Marketing & Advertising' },
      );
    }

    return manufacturerItems;
  };

  const menuItems = getMenuItems() || [];
  const roleDisplay = user?.role === 'admin'
    ? 'Administrator'
    : user?.role === 'wholesaler'
      ? 'Wholesaler'
      : user?.role === 'manufacturer'
        ? 'Manufacturer'
        : '';

  const width = isMobile ? widthFull : isOpen ? widthFull : widthCollapsed;
  const showLabels = isOpen || isMobile;

  const sidebarClasses = isMobile
    ? `fixed inset-y-0 left-0 z-[100] transform transition-transform duration-300 shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
    : 'fixed inset-y-0 left-0 z-50 transition-all duration-300';

  return (
    <>
      {isMobile && isOpen && (
        <div onClick={onClose} className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-sm" aria-hidden />
      )}

      <aside
        className={`${sidebarClasses} flex flex-col text-white/90`}
        style={{
          width,
          background: 'linear-gradient(180deg, var(--color-seller-nav-deep) 0%, var(--color-seller-nav) 100%)',
          borderRight: '1px solid rgba(0, 168, 150, 0.12)',
        }}
      >
        <div className={`h-16 flex items-center border-b border-white/10 shrink-0 ${showLabels ? 'px-4' : 'justify-center'}`}>
          <Link
            href={
              user?.role === 'manufacturer'
                ? '/manufacturer/dashboard'
                : user?.role === 'wholesaler'
                  ? '/wholesaler/dashboard'
                  : '/admin/dashboard'
            }
            className="flex items-center gap-2.5 min-w-0"
          >
            <div className="w-9 h-9 rounded-lg bg-[#00A878] flex items-center justify-center shrink-0">
              <span className="font-black text-white text-sm">G</span>
            </div>
            {showLabels && (
              <div className="min-w-0">
                <div className="font-bold text-white text-[15px] leading-none tracking-tight">GEARUP</div>
                <div className="text-[9px] text-[#00A878] font-bold uppercase tracking-[0.2em] mt-1">
                  {user?.role === 'admin' ? 'Admin Center' : user?.role === 'wholesaler' ? 'Wholesaler Center' : 'Manufacturer Center'}
                </div>
              </div>
            )}
          </Link>
          {isMobile && (
            <button type="button" onClick={onClose} className="ml-auto p-2 text-white/60 hover:text-white">
              <X size={20} />
            </button>
          )}
        </div>

        {showLabels && user?.role === 'admin' && (
          <div className="px-4 pt-3 pb-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">Control Center</div>
          </div>
        )}
        {showLabels && user?.role !== 'admin' && (
          <div className="px-4 pt-3 pb-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">Menu</div>
          </div>
        )}

        <nav className="flex-1 py-4 space-y-1.5 overflow-y-auto min-h-0">
          {user?.role === 'admin' ? (
            <AdminSidebarNav showLabels={showLabels} onNavigate={isMobile ? onClose : undefined} unreadCount={unreadCount} />
          ) : (
            menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.path || (item.path !== '#' && pathname.startsWith(item.path + '/'));
            const showSection =
              item.section &&
              showLabels &&
              (index === 0 || menuItems[index - 1]?.section !== item.section);

            return (
              <React.Fragment key={`${item.label}-${item.path}`}>
                {showSection && (
                  <div className="px-5 pt-5 pb-2">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                      {item.section}
                    </div>
                  </div>
                )}
                <Link
                href={item.path}
                onClick={isMobile ? onClose : undefined}
                title={!showLabels ? item.label : undefined}
                className={`flex items-center gap-3.5 py-3 rounded-xl transition-all duration-200 group relative ${
                  showLabels ? 'px-4 mx-3' : 'px-0 justify-center mx-2'
                } ${
                  isActive
                    ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/5'
                    : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <div className={`relative flex items-center justify-center shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-emerald-400' : 'text-white/50 group-hover:text-white/80'} />
                  {item.hasNotification > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-[16px] min-w-[16px] items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"></span>
                      <span className="relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)] border border-[rgba(255,255,255,0.4)] px-1 py-0.5 text-[9px] font-black leading-none text-white tracking-tighter">
                        {item.hasNotification}
                      </span>
                    </span>
                  )}
                </div>
                {showLabels && <span className={`truncate flex-1 tracking-wide ${isActive ? 'text-[13.5px] font-bold' : 'text-[13.5px] font-medium'}`}>{item.label}</span>}
                {item.badgeCount > 0 && showLabels && (
                  <span className="min-w-[20px] h-[20px] bg-emerald-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1.5 shadow-sm">
                    {item.badgeCount}
                  </span>
                )}
              </Link>
              </React.Fragment>
            );
          })
          )}
        </nav>

        <div className="p-2.5 border-t border-white/[0.06] space-y-1 shrink-0">
          {showLabels && user && (
            <div
              className="px-3.5 py-3 mb-1 rounded-[16px] border border-white/[0.08] backdrop-blur-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(8,25,20,0.95), rgba(12,45,35,0.95))',
                boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
              }}
            >
              <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/35 mb-3">Account</div>
              <div className="flex items-center gap-3">
                <div className="shrink-0" style={{ filter: 'drop-shadow(0 0 15px rgba(16,185,129,0.25))' }}>
                  <UserAvatar
                    user={user}
                    size="sm"
                    variant="dark"
                    className="border-2"
                    style={{ borderColor: 'rgba(16,185,129,0.4)' }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-white/95 truncate leading-tight">{user.name || 'User'}</div>
                  <div className="text-[10px] text-[#10B981] font-semibold mt-0.5">{roleDisplay}</div>
                </div>
              </div>
            </div>
          )}

          <Link
            href={
              user?.role === 'wholesaler'
                ? '/wholesaler/profile'
                : user?.role === 'manufacturer'
                  ? '/profile'
                  : '/admin/settings/platform'
            }
            className={`flex items-center gap-3 py-2.5 rounded-lg text-[13px] font-medium text-white/50 hover:bg-white/[0.05] hover:text-white/80 transition-all duration-200 ${
              !showLabels ? 'justify-center px-0' : 'px-3'
            }`}
          >
            <Settings size={17} className="shrink-0" />
            {showLabels && <span>Settings</span>}
          </Link>
          <Link
            href={user?.role === 'admin' ? '/admin/support' : '/contact'}
            className={`flex items-center gap-3 py-2.5 rounded-lg text-[13px] font-medium text-white/50 hover:bg-white/[0.05] hover:text-white/80 transition-all duration-200 ${
              !showLabels ? 'justify-center px-0' : 'px-3'
            }`}
          >
            <HelpCircle size={17} className="shrink-0" />
            {showLabels && <span>Support</span>}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className={`flex items-center gap-3 py-2.5 rounded-lg text-[13px] font-medium text-red-400/70 hover:text-red-300 hover:bg-red-500/[0.08] transition-all duration-200 w-full ${
              !showLabels ? 'justify-center px-0' : 'px-3'
            }`}
          >
            <LogOut size={17} className="shrink-0" />
            {showLabels && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
