"use client";

import UserProfile from '@/components/shared/Profile';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageShell from '@/components/dashboard/PageShell';
import PageHeader from '@/components/dashboard/PageHeader';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
    const { user } = useAuth();

    if (user?.role === 'manufacturer') {
        return (
            <ProtectedRoute allowedRoles={['manufacturer', 'wholesaler', 'admin']}>
                <DashboardLayout>
                    <PageShell>
                        <UserProfile isDashboard />
                    </PageShell>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    return (
        <main className="min-h-screen bg-[#F5F7FA]">
            <UserProfile isDashboard={false} />
        </main>
    );
}
