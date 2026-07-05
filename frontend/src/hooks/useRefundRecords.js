import { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import { buildRefundRecordsFromDisputes } from '@/lib/financeUtils';
import { subscribeFinancialSync } from '@/lib/financialSync';

export function useRefundRecords() {
    const [refundRecords, setRefundRecords] = useState([]);

    const fetchRefundRecords = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const headers = { Authorization: `Bearer ${token}` };
            const base = getApiBaseUrl();
            const [mineRes, sellerRes] = await Promise.all([
                fetch(`${base}/api/disputes/mine`, { headers }),
                fetch(`${base}/api/disputes/seller`, { headers }),
            ]);
            const mineData = await mineRes.json();
            const sellerData = await sellerRes.json();
            const merged = [
                ...(mineData.success ? mineData.data || [] : []),
                ...(sellerData.success ? sellerData.data || [] : []),
            ];
            const unique = Array.from(
                new Map(merged.map((d) => [String(d._id || d.id), d])).values()
            );
            setRefundRecords(buildRefundRecordsFromDisputes(unique));
        } catch {
            setRefundRecords([]);
        }
    }, []);

    useEffect(() => {
        fetchRefundRecords();
        return subscribeFinancialSync(fetchRefundRecords);
    }, [fetchRefundRecords]);

    return { refundRecords, refreshRefundRecords: fetchRefundRecords };
}
