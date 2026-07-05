import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

export function useInactivityLogout() {
    const { logout, user } = useAuth();
    const router = useRouter();
    const timeoutRef = useRef(null);
    const lastActivityRef = useRef(Date.now());

    const resetInactivityTimer = () => {
        lastActivityRef.current = Date.now();

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (user) {
            timeoutRef.current = setTimeout(() => {
                logout();
                router.push('/login');
            }, INACTIVITY_TIMEOUT);
        }
    };

    useEffect(() => {
        if (!user) return;

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

        events.forEach(event => {
            document.addEventListener(event, resetInactivityTimer, true);
        });

        // Initial timeout setup
        resetInactivityTimer();

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, resetInactivityTimer, true);
            });
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [user, logout, router]);
}
