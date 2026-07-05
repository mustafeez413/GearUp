"use client";

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AdminLayout({ children }) {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                {children}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
