"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getNotificationsPath } from '@/components/notifications/NotificationsPanel';

export default function NotificationsRedirectPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        router.replace(getNotificationsPath(user.role));
    }, [user, loading, router]);

    return (
        <div className="min-h-[40vh] flex items-center justify-center text-slate-400 text-sm">
            Opening notifications…
        </div>
    );
}
