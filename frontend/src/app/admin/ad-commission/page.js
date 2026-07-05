'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAdCommissionPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/advertisements/pricing');
  }, [router]);
  return <div className="p-8 text-slate-500">Redirecting to advertisement commission settings…</div>;
}
