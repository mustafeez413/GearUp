'use client';

import Profile from '@/components/shared/Profile';

export default function WholesalerSettingsPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
                <Profile isDashboard={true} />
            </div>
        </div>
    );
}
