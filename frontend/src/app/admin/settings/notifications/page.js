'use client';

import AdminPageShell from '@/components/admin/AdminPageShell';
import NotificationsPanel from '@/components/notifications/NotificationsPanel';

export default function AdminNotificationSettingsPage() {
  return (
    <div className="max-w-6xl mx-auto w-full px-6">
      <AdminPageShell
        title="Notification Settings"
        description="Review platform alerts, system events, and activity in a unified inbox."
        align="center"
      >
        <NotificationsPanel compact />
      </AdminPageShell>
    </div>
  );
}
