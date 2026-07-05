/**
 * Read-only inventory of MongoDB collections and record counts.
 * Usage: node scripts/inventoryDatabase.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MODELS = [
  '../models/Product',
  '../models/Order',
  '../models/ProductChat',
  '../models/Notification',
  '../models/Advertisement',
  '../models/Dispute',
  '../models/ContactSubmission',
  '../models/Transaction',
  '../models/Refund',
  '../models/Wallet',
  '../models/WalletLedger',
  '../models/WithdrawRequest',
  '../models/Escrow',
  '../models/Payout',
  '../models/SellerSettlement',
  '../models/CommissionLog',
  '../models/Banner',
  '../models/AuditLog',
  '../models/AdCampaign',
  '../models/AdPayment',
  '../models/AdImpression',
  '../models/AdClick',
  '../models/AdAnalytics',
  '../models/AdCampaignStatusLog',
  '../models/PricingHistory',
  '../models/PolicyAcceptanceLog',
  '../models/AdvertisementDiscount',
  '../models/User',
  '../models/Settings',
  '../models/AdPlan',
];

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI missing');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name).sort();

  const counts = {};
  for (const name of collectionNames) {
    counts[name] = await db.collection(name).countDocuments();
  }

  const users = await db.collection('users').find({}, { projection: { name: 1, email: 1, role: 1 } }).toArray();

  const uploadDir = path.join(__dirname, '..', 'uploads');
  let uploadFiles = [];
  if (fs.existsSync(uploadDir)) {
    uploadFiles = fs.readdirSync(uploadDir).filter((f) => f !== '.gitkeep');
  }

  const report = {
    generatedAt: new Date().toISOString(),
    database: mongoose.connection.name,
    collections: collectionNames,
    counts,
    users: users.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
    })),
    uploadFileCount: uploadFiles.length,
    uploadSample: uploadFiles.slice(0, 20),
  };

  console.log(JSON.stringify(report, null, 2));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
