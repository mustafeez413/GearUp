/** Global feature flag for Sponsored Products & Advertising module */
export const AD_SYSTEM_ENABLED = true;

export const CAMPAIGN_STATUSES = {
  draft: { label: 'Draft', color: 'slate' },
  pending_payment: { label: 'Pending Payment', color: 'amber' },
  pending_approval: { label: 'Pending Approval', color: 'blue' },
  active: { label: 'Active', color: 'emerald' },
  paused: { label: 'Paused', color: 'orange' },
  rejected: { label: 'Rejected', color: 'red' },
  expired: { label: 'Expired', color: 'slate' },
  completed: { label: 'Completed', color: 'slate' },
};

export const CAMPAIGN_TYPES = [
  { value: 'sponsored_product', label: 'Sponsored Product' },
  { value: 'homepage_featured', label: 'Homepage Featured' },
];
