/**
 * Backup and drop orphaned MongoDB collections (no model, no code refs).
 * Usage: node scripts/dropUnusedCollections.js [--dry-run]
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

/** Verified unused — no Mongoose model, no application code references. */
const UNUSED_COLLECTIONS = [
  'escrowtransactions',
  'escrowwallets',
  'gatewaytransactions',
  'wallettransactions',
  'paymentauditevents',
];

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI missing');
    process.exit(1);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = path.join(__dirname, '..', '..', 'backups', `unused-collections-${stamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const results = { dryRun: DRY_RUN, backupDir, dropped: [], backedUp: [] };

  for (const name of UNUSED_COLLECTIONS) {
    const exists = (await db.listCollections({ name }).toArray()).length > 0;
    if (!exists) {
      results.dropped.push({ name, status: 'not_found' });
      continue;
    }

    const col = db.collection(name);
    const count = await col.countDocuments();
    const indexes = await col.indexes();
    const stats = await db.command({ collStats: name }).catch(() => ({}));
    const docs = await col.find({}).toArray();

    const backupFile = path.join(backupDir, `${name}.json`);
    fs.writeFileSync(
      backupFile,
      JSON.stringify({ collection: name, count, indexes, documents: docs }, null, 2)
    );

    results.backedUp.push({
      name,
      count,
      indexCount: indexes.length,
      storageBytes: stats.storageSize || 0,
      backupFile,
    });

    if (!DRY_RUN) {
      await col.drop();
      results.dropped.push({ name, status: 'dropped', previousCount: count });
    } else {
      results.dropped.push({ name, status: 'would_drop', previousCount: count });
    }
  }

  fs.writeFileSync(path.join(backupDir, 'MANIFEST.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
