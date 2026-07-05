/**
 * Deep MongoDB collection analysis for unused collection cleanup.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MODEL_MAP = {
  users: { model: 'User', file: 'models/User.js', active: true },
  products: { model: 'Product', file: 'models/Product.js', active: true },
  orders: { model: 'Order', file: 'models/Order.js', active: true },
  productchats: { model: 'ProductChat', file: 'models/ProductChat.js', active: true },
  notifications: { model: 'Notification', file: 'models/Notification.js', active: true },
  advertisements: { model: 'Advertisement', file: 'models/Advertisement.js', active: true },
  disputes: { model: 'Dispute', file: 'models/Dispute.js', active: true },
  contactsubmissions: { model: 'ContactSubmission', file: 'models/ContactSubmission.js', active: true },
  transactions: { model: 'Transaction', file: 'models/Transaction.js', active: true },
  escrows: { model: 'Escrow', file: 'models/Escrow.js', active: true },
  wallets: { model: 'Wallet', file: 'models/Wallet.js', active: true },
  walletledgers: { model: 'WalletLedger', file: 'models/WalletLedger.js', active: true },
  withdrawrequests: { model: 'WithdrawRequest', file: 'models/WithdrawRequest.js', active: false, note: 'Model only — no controller import found' },
  refunds: { model: 'Refund', file: 'models/Refund.js', active: true },
  payouts: { model: 'Payout', file: 'models/Payout.js', active: true },
  sellersettlements: { model: 'SellerSettlement', file: 'models/SellerSettlement.js', active: false, note: 'Model only — no controller import found' },
  commissionlogs: { model: 'CommissionLog', file: 'models/CommissionLog.js', active: false, note: 'Model only — no controller import found' },
  settings: { model: 'Settings', file: 'models/Settings.js', active: true },
  auditlogs: { model: 'AuditLog', file: 'models/AuditLog.js', active: true },
  banners: { model: 'Banner', file: 'models/Banner.js', active: true },
  advertisementplans: { model: 'AdPlan', file: 'models/AdPlan.js', active: true },
  advertisementdiscounts: { model: 'AdvertisementDiscount', file: 'models/AdvertisementDiscount.js', active: true },
  adpayments: { model: 'AdPayment', file: 'models/AdPayment.js', active: true },
  adclicks: { model: 'AdClick', file: 'models/AdClick.js', active: true },
  adimpressions: { model: 'AdImpression', file: 'models/AdImpression.js', active: true },
  adanalytics: { model: 'AdAnalytics', file: 'models/AdAnalytics.js', active: true },
  adcampaignstatuslogs: { model: 'AdCampaignStatusLog', file: 'models/AdCampaignStatusLog.js', active: true },
  adcampaigns: { model: 'AdCampaign', file: 'models/AdCampaign.js', active: true },
  pricinghistories: { model: 'PricingHistory', file: 'models/PricingHistory.js', active: true },
  policyacceptancelogs: { model: 'PolicyAcceptanceLog', file: 'models/PolicyAcceptanceLog.js', active: true },
  escrowtransactions: { model: null, file: null, active: false, note: 'No model — orphaned legacy collection' },
  escrowwallets: { model: null, file: null, active: false, note: 'No model — orphaned legacy collection' },
  gatewaytransactions: { model: null, file: null, active: false, note: 'No model — orphaned legacy collection' },
  wallettransactions: { model: null, file: null, active: false, note: 'No model — orphaned legacy collection' },
  paymentauditevents: { model: null, file: null, active: false, note: 'No model — orphaned legacy collection' },
  adplans: { model: null, file: null, active: false, note: 'Duplicate/legacy name — superseded by advertisementplans' },
};

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const report = [];

  for (const { name } of collections.sort((a, b) => a.name.localeCompare(b.name))) {
    const col = db.collection(name);
    const count = await col.countDocuments();
    const indexes = await col.indexes();
    const stats = await db.command({ collStats: name }).catch(() => ({}));
    const meta = MODEL_MAP[name] || { model: null, active: false, note: 'Unknown — not in model map' };
    let classification = 'Unknown';
    if (!meta.model && !meta.active) classification = 'Unused';
    else if (meta.model && meta.active) classification = 'Active';
    else if (meta.model && !meta.active) classification = 'Legacy';
    else if (meta.note?.includes('orphaned') || meta.note?.includes('Duplicate')) classification = 'Unused';

    report.push({
      name,
      count,
      indexCount: indexes.length,
      sizeBytes: stats.size || 0,
      storageBytes: stats.storageSize || 0,
      classification,
      model: meta.model,
      note: meta.note || null,
    });
  }

  // Expected collections from models but missing in DB
  const dbNames = new Set(collections.map((c) => c.name));
  const missing = Object.keys(MODEL_MAP).filter((k) => MODEL_MAP[k].model && MODEL_MAP[k].active && !dbNames.has(k));

  console.log(JSON.stringify({ report, missingExpectedCollections: missing }, null, 2));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
