export const FINANCIAL_SYNC_EVENT = 'gearup-financial-sync';

export function dispatchFinancialSync(detail = {}) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(FINANCIAL_SYNC_EVENT, { detail }));
}

export function subscribeFinancialSync(handler) {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(FINANCIAL_SYNC_EVENT, handler);
    return () => window.removeEventListener(FINANCIAL_SYNC_EVENT, handler);
}
