"use client";

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import ManufacturerDashboardLayout from '@/components/layout/DashboardLayout';

export default function WholesalerLayout({ children }) {
    return (
        <ProtectedRoute allowedRoles={['wholesaler', 'manufacturer']}>
            <ManufacturerDashboardLayout>
                {children}
            </ManufacturerDashboardLayout>
        </ProtectedRoute>
    );
}
