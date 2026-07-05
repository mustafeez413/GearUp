'use client';

import { tabPillWrap, tabPill, tabCountBadge, tabCountBadgeMuted } from './escrowTheme';

const TABS = [
  { id: 'overview', label: 'Overview', emoji: '📊' },
  { id: 'verifications', label: 'Verifications', emoji: '✅', countKey: 'verifications' },
  { id: 'settlements', label: 'Settlements & Holds', emoji: '💳', countKey: 'settlements' },
  { id: 'transactions', label: 'Ledger', emoji: '📄' },
  { id: 'disputes', label: 'Disputes', emoji: '⚠', countKey: 'disputes' },
];

export default function EscrowTabNav({ activeTab, onChange, counts = {} }) {
  return (
    <div className={tabPillWrap} role="tablist" aria-label="Escrow sections">
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        const count = tab.countKey ? counts[tab.countKey] : 0;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={tabPill(active)}
          >
            <span aria-hidden="true">{tab.emoji}</span>
            <span>{tab.label}</span>
            {count > 0 && (
              <span className={tab.id === 'disputes' ? tabCountBadge : tabCountBadgeMuted}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
