/**
 * Full MongoDB backup before data cleanup.
 * Usage: node scripts/backupDatabase.js [outputDir]
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI missing');
    process.exit(1);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outDir = process.argv[2] || path.join(__dirname, '..', '..', 'backups', `pre-cleanup-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const manifest = { generatedAt: new Date().toISOString(), database: db.databaseName, collections: {} };

  for (const { name } of collections) {
    const docs = await db.collection(name).find({}).toArray();
    fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(docs, null, 2));
    manifest.collections[name] = docs.length;
  }

  fs.writeFileSync(path.join(outDir, 'MANIFEST.json'), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({ outDir, manifest }, null, 2));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
