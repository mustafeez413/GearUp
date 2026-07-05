"use client";

import { getApiBaseUrl } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle2,
  Clock,
  Megaphone,
  Scale,
  ShoppingCart,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

function resolveNotificationLink(notification, user) {
    if (notification.link) return notification.link;

    const role = user?.role || 'wholesaler';
    const msg = (notification.message || '').toLowerCase();

    if (notification.type === 'dispute' || msg.includes('dispute') || msg.includes('refund') || msg.includes('issue')) {
        if (role === 'admin') return '/admin/disputes';
        return '/manufacturer/disputes';
    }
    if (notification.type === 'order' || msg.includes('order')) {
        return role === 'manufacturer' ? '/manufacturer/orders' : '/wholesaler/orders';
    }
    if (notification.type === 'message' || msg.includes('message') || msg.includes('chat')) {
        return role === 'manufacturer' ? '/manufacturer/chats' : '/wholesaler/chats';
    }
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'manufacturer') return '/manufacturer/notifications';
    return '/wholesaler/notifications';
}

export function getNotificationsPath(role) {
    if (role === 'admin') return '/admin/notifications';
    if (role === 'manufacturer') return '/manufacturer/notifications';
    if (role === 'wholesaler') return '/wholesaler/notifications';
    return '/login';
}

function formatRelativeTime(value) {
  if (!value) return '—';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function getNotificationIcon(notification) {
  const msg = (notification.message || '').toLowerCase();
  const type = (notification.type || '').toLowerCase();
  if (type === 'dispute' || msg.includes('dispute')) return Scale;
  if (type === 'order' || msg.includes('order')) return ShoppingCart;
  if (msg.includes('advert') || msg.includes('campaign')) return Megaphone;
  if (msg.includes('verif')) return ShieldCheck;
  return Bell;
}

function CompactNotificationsFeed({
  notifications,
  filter,
  setFilter,
  unreadCount,
  markAllAsRead,
  markAsRead,
  router,
  user,
}) {
  const visibleNotifications = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.isRead);
    return notifications;
  }, [notifications, filter]);

  return (
    <div className="rounded-[18px] border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden max-w-4xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(59,130,246,0.12)] px-2.5 py-1 text-[11px] font-semibold text-[#1D4ED8]">
            {unreadCount} unread
          </span>
          <div className="inline-flex rounded-[10px] border border-[#E2E8F0] bg-white p-0.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`px-3 py-1.5 text-[12px] font-semibold rounded-[8px] transition-colors ${
                  filter === item.id ? 'bg-[#0F172A] text-white' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="inline-flex items-center justify-center rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {visibleNotifications.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Bell size={28} className="text-[#CBD5E1] mx-auto mb-3" />
          <p className="text-[14px] font-medium text-[#64748B]">No notifications to show</p>
        </div>
      ) : (
        <ul className="divide-y divide-[#F1F5F9]">
          {visibleNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification);
            return (
              <li key={notification._id}>
                <button
                  type="button"
                  className={`group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                    !notification.isRead
                      ? 'bg-[rgba(16,185,129,0.04)] hover:bg-[rgba(16,185,129,0.07)]'
                      : 'hover:bg-[#F8FAFC]'
                  }`}
                  onClick={() => {
                    if (!notification.isRead) markAsRead(notification._id);
                    router.push(resolveNotificationLink(notification, user));
                  }}
                >
                  <div className="relative shrink-0">
                    <div
                      className={`grid h-9 w-9 place-items-center rounded-[10px] ${
                        !notification.isRead ? 'bg-[#0F172A] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                      }`}
                    >
                      <Icon size={15} strokeWidth={1.75} />
                    </div>
                    {!notification.isRead && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#10B981] ring-2 ring-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[14px] leading-snug ${
                        !notification.isRead ? 'font-semibold text-[#0F172A]' : 'text-[#475569]'
                      }`}
                    >
                      {notification.message}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-[12px] text-[#94A3B8]">
                      <Clock size={11} />
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="shrink-0 text-[#CBD5E1] transition-transform group-hover:translate-x-0.5 group-hover:text-[#64748B]"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function NotificationsPanel({ compact = false }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const router = useRouter();
    const { user } = useAuth();

    const fetchNotifications = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const res = await fetch(`${getApiBaseUrl()}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setNotifications(json.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markAsRead = async (id) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${getApiBaseUrl()}/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications((prev) =>
                    prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
                );
                window.dispatchEvent(new CustomEvent('notifications-read'));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        const unread = notifications.filter((n) => !n.isRead);
        await Promise.all(unread.map((n) => markAsRead(n._id)));
        window.dispatchEvent(new CustomEvent('notifications-read'));
    };

    if (loading) {
        return (
            <div className={`flex items-center justify-center ${compact ? 'min-h-[240px]' : 'min-h-[40vh]'}`}>
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-[#E2E8F0] border-b-[#10B981] rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-[12px] font-medium text-[#64748B]">Loading notifications…</p>
                </div>
            </div>
        );
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    if (compact) {
      return (
        <CompactNotificationsFeed
          notifications={notifications}
          filter={filter}
          setFilter={setFilter}
          unreadCount={unreadCount}
          markAllAsRead={markAllAsRead}
          markAsRead={markAsRead}
          router={router}
          user={user}
        />
      );
    }

    return (
        <div className="space-y-6 pb-10 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Notifications
                    </h1>
                    <p className="font-body text-slate-500 mt-1 text-sm">
                        {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={markAllAsRead}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800"
                    >
                        Mark all read
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {notifications.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <Bell size={40} className="text-slate-200 mx-auto mb-3" />
                        <p className="font-medium text-slate-500">No notifications yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {notifications.map((notification) => (
                            <div
                                key={notification._id}
                                role="button"
                                tabIndex={0}
                                className={`px-4 sm:px-6 py-4 sm:py-5 transition-all cursor-pointer ${
                                    !notification.isRead ? 'bg-emerald-50/80 hover:bg-emerald-50' : 'hover:bg-slate-50'
                                }`}
                                onClick={() => {
                                    if (!notification.isRead) markAsRead(notification._id);
                                    router.push(resolveNotificationLink(notification, user));
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        if (!notification.isRead) markAsRead(notification._id);
                                        router.push(resolveNotificationLink(notification, user));
                                    }
                                }}
                            >
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div
                                        className={`p-2 rounded-xl shrink-0 ${
                                            !notification.isRead ? 'bg-emerald-600' : 'bg-slate-200'
                                        }`}
                                    >
                                        {!notification.isRead ? (
                                            <div className="w-2.5 h-2.5 bg-white rounded-full" />
                                        ) : (
                                            <CheckCircle2 size={14} className="text-slate-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={`text-sm leading-relaxed ${
                                                !notification.isRead
                                                    ? 'font-semibold text-slate-900'
                                                    : 'text-slate-600'
                                            }`}
                                        >
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2 text-slate-400">
                                            <Clock size={12} />
                                            <p className="text-xs">
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    {!notification.isRead && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markAsRead(notification._id);
                                            }}
                                            className="hidden sm:inline-flex px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase shrink-0"
                                        >
                                            Mark read
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
