'use client';

import { useInactivityLogout } from '@/hooks/useInactivityLogout';

export function InactivityLogoutWrapper({ children }) {
    useInactivityLogout();
    return <>{children}</>;
}
