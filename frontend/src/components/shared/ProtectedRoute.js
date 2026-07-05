"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace(`/login?from=${pathname}`);
        }

        if (!loading && isAuthenticated && allowedRoles && !allowedRoles.includes(user?.role)) {
            router.replace('/unauthorized');
        }
    }, [loading, isAuthenticated, user, allowedRoles, router, pathname]);

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-deep mx-auto mb-4"></div>
                    <p className="font-body text-neutral-600">Verifying session...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || (allowedRoles && !allowedRoles.includes(user?.role))) {
        return null; // Will redirect in useEffect
    }

    return children;
};

export default ProtectedRoute;
