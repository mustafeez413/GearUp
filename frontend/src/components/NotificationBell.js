"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
    getNotificationsPath,
} from "@/components/notifications/NotificationsPanel";
import { Bell } from "lucide-react";

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
    return getNotificationsPath(role);
}

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const router = useRouter();
    const { user } = useAuth();
    const panelRef = useRef(null);

    const viewAllPath = useMemo(() => getNotificationsPath(user?.role), [user?.role]);

    const fetchNotifications = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`${getApiBaseUrl()}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setNotifications(json.data || []);
                setUnreadCount((json.data || []).filter((n) => !n.isRead).length);
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        const onRefresh = () => fetchNotifications();
        window.addEventListener('gearup-notifications-refresh', onRefresh);
        return () => {
            clearInterval(interval);
            window.removeEventListener('gearup-notifications-refresh', onRefresh);
        };
    }, [fetchNotifications]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const handleMarkAsRead = async (notificationId) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`${getApiBaseUrl()}/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setNotifications((prev) =>
                    prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error("Failed to mark notification as read", err);
        }
    };

    const openNotification = (notification) => {
        if (!notification.isRead) handleMarkAsRead(notification._id);
        setIsOpen(false);
        router.push(resolveNotificationLink(notification, user));
    };

    const handleViewAll = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        router.push(viewAllPath);
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="icon-wrapper"
                aria-label="Notifications"
                aria-expanded={isOpen}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#00A878] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 border-2 border-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-[min(100vw-2rem,20rem)] sm:w-80 bg-white rounded-2xl border border-slate-100 shadow-2xl z-[200] overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
                        <h3 className="font-heading font-black text-slate-900 tracking-tight">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                {unreadCount} new
                            </span>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="font-body text-slate-400 text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="max-h-[min(60vh,400px)] overflow-y-auto">
                            {notifications.slice(0, 8).map((notification) => (
                                <button
                                    key={notification._id}
                                    type="button"
                                    className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-all ${
                                        !notification.isRead ? 'bg-emerald-50/80' : ''
                                    }`}
                                    onClick={() => openNotification(notification)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                                !notification.isRead ? 'bg-emerald-600' : 'bg-slate-300'
                                            }`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-700 font-medium leading-snug">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {new Date(notification.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="p-3 bg-slate-50 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={handleViewAll}
                            className="w-full py-2.5 text-emerald-600 font-bold text-xs uppercase tracking-widest hover:text-emerald-700 hover:bg-emerald-50/50 rounded-lg transition-colors"
                        >
                            View all
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
