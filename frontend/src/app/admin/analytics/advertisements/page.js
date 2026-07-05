'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAnalyticsAdvertisementsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/advertisements/revenue');
  }, [router]);
  return <div className="p-8 text-slate-500">Redirecting to advertisement analytics…</div>;
}
