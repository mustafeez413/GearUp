"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import DisputesListView from '@/components/disputes/DisputesListView';

export default function ManufacturerDisputesPage() {
    const [tab, setTab] = useState('sales');
    const [salesDisputes, setSalesDisputes] = useState([]);
    const [myReports, setMyReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDisputes = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const base = getApiBaseUrl();
            const [sellerRes, mineRes] = await Promise.all([
                fetch(`${base}/api/disputes/seller`, { headers }),
                fetch(`${base}/api/disputes/mine`, { headers })
            ]);
            const sellerData = await sellerRes.json();
            const mineData = await mineRes.json();

            if (sellerData.success) {
                setSalesDisputes(sellerData.data || []);
            } else if (sellerRes.status === 403) {
                setSalesDisputes([]);
            } else {
                toast.error(sellerData.error || 'Could not load seller issues');
            }

            if (mineData.success) {
                setMyReports(mineData.data || []);
            } else {
                toast.error(mineData.error || 'Could not load your reports');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load order issues');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDisputes();
    }, [fetchDisputes]);

    const activeList = tab === 'sales' ? salesDisputes : myReports;
    const activeRole = tab === 'sales' ? 'seller' : 'buyer';

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={() => setTab('sales')}
                    className={`px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border ${
                        tab === 'sales' 
                            ? 'bg-[#00A878] text-white border-[#00A878] shadow-[0_4px_14px_rgba(0,168,120,0.35)]' 
                            : 'bg-[#F8FAFC] text-[#64748B] border-[#E5E7EB] hover:bg-white hover:text-[#0F172A]'
                    }`}
                >
                    On my sales ({salesDisputes.length})
                </button>
                <button
                    type="button"
                    onClick={() => setTab('reports')}
                    className={`px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border ${
                        tab === 'reports' 
                            ? 'bg-[#00A878] text-white border-[#00A878] shadow-[0_4px_14px_rgba(0,168,120,0.35)]' 
                            : 'bg-[#F8FAFC] text-[#64748B] border-[#E5E7EB] hover:bg-white hover:text-[#0F172A]'
                    }`}
                >
                    I reported ({myReports.length})
                </button>
            </div>

            <DisputesListView
                title={tab === 'sales' ? 'Order issues on your sales' : 'Issues you reported as buyer'}
                subtitle={
                    tab === 'sales'
                        ? 'Buyers reported problems on orders where you are the seller. Submit your evidence and explanation — the GearUp Admin team will decide the outcome.'
                        : 'Track refund requests you opened on orders you purchased.'
                }
                disputes={activeList}
                loading={loading}
                role={activeRole}
                onRefresh={fetchDisputes}
                emptyTitle={
                    tab === 'sales'
                        ? 'No disputes on your sales'
                        : 'You have not reported any order issues'
                }
                emptyHint={
                    tab === 'sales'
                        ? 'Issues appear here only when you are the seller on the order. If you reported a problem as a buyer, check the “I reported” tab.'
                        : 'Open an issue from your purchase order page (Report issue) after checkout.'
                }
            />
        </div>
    );
}
