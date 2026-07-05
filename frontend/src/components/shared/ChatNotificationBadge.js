"use client";

import { useState, useEffect } from "react";
import { getApiBaseUrl } from "@/lib/api";

export default function ChatNotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${getApiBaseUrl()}/api/chats/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setUnreadCount(json.count);
        }
      } catch (err) {
        console.error("Failed to fetch unread chat count", err);
      }
    };

    fetchUnreadCount();
    window.addEventListener('chats-read', fetchUnreadCount);

    const interval = setInterval(fetchUnreadCount, 5000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('chats-read', fetchUnreadCount);
    };
  }, []);

  return unreadCount > 0 ? (
    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-emerald-600 text-white rounded-full text-[10px] flex items-center justify-center font-black border-2 border-white px-1">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  ) : null;
}
