'use client';

import Profile from '@/components/shared/Profile';
import AdminPageShell from '@/components/admin/AdminPageShell';

export default function AdminPlatformSettingsPage() {
  return (
    <AdminPageShell
      title="Platform Settings"
      description="Manage your administrator profile and platform account preferences."
    >
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Profile isDashboard={true} />
      </div>
    </AdminPageShell>
  );
}
