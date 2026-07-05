import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';

const AdminButton = ({ to, onClick, className = '', variant = 'default', children }) => {
    const baseStyles = 'inline-flex items-center justify-center gap-3 px-7 py-4 font-body font-bold text-sm uppercase tracking-wider rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden';

    const variants = {
        default: 'bg-[#0A0F1A] text-white border-2 border-[#1A1F2E] hover:bg-[#151A26] hover:border-[#2A2F3E] hover:shadow-xl hover:shadow-[#062B20]/40 hover:-translate-y-0.5 focus:ring-[#062B20] focus:ring-offset-neutral-900 active:translate-y-0 active:shadow-lg',
        minimal: 'bg-neutral-900 text-white border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-600 hover:shadow-lg focus:ring-neutral-700',
        danger: 'bg-[#1A0F0F] text-red-100 border-2 border-red-900/50 hover:bg-[#251515] hover:border-red-800/70 hover:shadow-xl hover:shadow-red-900/40 hover:-translate-y-0.5 focus:ring-red-700 focus:ring-offset-neutral-900 active:translate-y-0'
    };

    const buttonStyles = `${baseStyles} ${variants[variant]} ${className}`;

    const content = (
        <>
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
            <div className="relative z-10 flex items-center">
                <Shield className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <span className="relative z-10 font-semibold">{children || 'Administrator Access'}</span>
        </>
    );

    if (to) {
        return (
            <Link href={to} className={buttonStyles} aria-label="Administrator Access">
                {content}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={buttonStyles} type="button" aria-label="Administrator Access">
            {content}
        </button>
    );
};

export default AdminButton;
