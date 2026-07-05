/**
 * Safe application data cleanup — preserves users, settings, ad plan config.
 * Usage: node scripts/cleanupApplicationData.js [--dry-run]
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

const DRY_RUN = process.argv.includes('--dry-run');

/** Collections to fully clear (delete all documents). */
const COLLECTIONS_TO_CLEAR = [
  'products',
  'orders',
  'productchats',
  'notifications',
  'advertisements',
  'disputes',
  'contactsubmissions',
  'transactions',
  'escrows',
  'escrowtransactions',
  'escrowwallets',
  'gatewaytransactions',
  'wallettransactions',
  'walletledgers',
  'withdrawrequests',
  'refunds',
  'payouts',
  'sellersettlements',
  'commissionlogs',
  'banners',
  'auditlogs',
  'adanalytics',
  'adclicks',
  'adimpressions',
  'adpayments',
  'adcampaigns',
  'adcampaignstatuslogs',
  'paymentauditevents',
  'pricinghistories',
  'policyacceptancelogs',
];

/** Preserved configuration collections (not cleared). */
const COLLECTIONS_PRESERVED = [
  'users',
  'settings',
  'adplans',
  'advertisementplans',
  'advertisementdiscounts',
];

const uploadDir = path.join(__dirname, '..', 'uploads');

function collectProtectedUploadBasenames(users) {
  const protectedNames = new Set(['.gitkeep']);
  for (const user of users) {
    for (const field of [user.avatar, user.businessDetails?.businessLicense]) {
      if (!field || typeof field !== 'string') continue;
      const base = path.basename(field.replace(/^\/uploads\//, ''));
      if (base) protectedNames.add(base);
    }
  }
  return protectedNames;
}

function isProductOrAdImage(filename) {
  return (
    /^product-/i.test(filename) ||
    /^product-migrated-/i.test(filename) ||
    /^gearup-/i.test(filename)
  );
}

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI missing');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const results = {
    dryRun: DRY_RUN,
    deleted: {},
    walletsReset: 0,
    filesRemoved: [],
    filesKept: [],
    preserved: {},
    warnings: [],
  };

  for (const name of COLLECTIONS_PRESERVED) {
    results.preserved[name] = await db.collection(name).countDocuments();
  }

  for (const name of COLLECTIONS_TO_CLEAR) {
    const exists = (await db.listCollections({ name }).toArray()).length > 0;
    if (!exists) {
      results.deleted[name] = 0;
      continue;
    }
    const count = await db.collection(name).countDocuments();
    if (!DRY_RUN && count > 0) {
      await db.collection(name).deleteMany({});
    }
    results.deleted[name] = count;
  }

  const walletCount = await db.collection('wallets').countDocuments();
  if (!DRY_RUN && walletCount > 0) {
    const res = await db.collection('wallets').updateMany(
      {},
      { $set: { balance: 0, escrowBalance: 0, availableBalance: 0 } }
    );
    results.walletsReset = res.modifiedCount;
  } else {
    results.walletsReset = walletCount;
  }
  results.preserved.wallets = await db.collection('wallets').countDocuments();

  const users = await User.find({}).lean();
  const protectedFiles = collectProtectedUploadBasenames(users);

  if (fs.existsSync(uploadDir)) {
    for (const filename of fs.readdirSync(uploadDir)) {
      if (protectedFiles.has(filename)) {
        results.filesKept.push(filename);
        continue;
      }
      if (isProductOrAdImage(filename)) {
        if (!DRY_RUN) {
          fs.unlinkSync(path.join(uploadDir, filename));
        }
        results.filesRemoved.push(filename);
        continue;
      }
      // Keep verification PDFs, payment proofs, and other user documents
      results.filesKept.push(filename);
    }
  }

  console.log(JSON.stringify(results, null, 2));
  await mongoose.disconnect();
  return results;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
