"use client";

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ManufacturerLayout({ children }) {
    return (
        <ProtectedRoute allowedRoles={['manufacturer', 'wholesaler']}>
            <DashboardLayout>
                {children}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
