/**
 * Read-only orphan scan + optional report file generation.
 * Usage: node scripts/reconcileOrphanImages.js [--write-report]
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');

const uploadDir = path.join(__dirname, '..', 'uploads');
const writeReport = process.argv.includes('--write-report');
const reportPath = path.join(__dirname, '..', '..', 'ORPHAN_IMAGES_REPORT.md');

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI missing');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const products = await Product.find({}, { name: 1, images: 1, sku: 1 }).lean();

  const rows = [];
  for (const p of products) {
    for (const img of p.images || []) {
      if (typeof img !== 'string' || !img.startsWith('/uploads/')) continue;
      const filePath = path.join(uploadDir, path.basename(img));
      const exists = fs.existsSync(filePath);
      rows.push({
        productId: String(p._id),
        productName: p.name,
        sku: p.sku || 'N/A',
        currentPath: img,
        existsOnDisk: exists ? 'Yes' : 'No',
        status: exists ? 'OK' : 'Missing',
        actionTaken: exists ? 'None required' : 'Manual re-upload required via product edit',
      });
    }
  }

  console.log(JSON.stringify(rows, null, 2));

  if (writeReport) {
    const lines = [
      '# Orphan Upload Images Report',
      '',
      `**Generated:** ${new Date().toISOString()}`,
      '',
      '| Product ID | Product Name | SKU | Current Path | Exists | Status | Action Taken |',
      '|------------|--------------|-----|--------------|--------|--------|--------------|',
    ];
    for (const r of rows) {
      lines.push(
        `| ${r.productId} | ${r.productName} | ${r.sku} | \`${r.currentPath}\` | ${r.existsOnDisk} | ${r.status} | ${r.actionTaken} |`
      );
    }
    if (rows.length === 0) {
      lines.push('', '_No `/uploads/` paths found in product catalog._');
    }
    fs.writeFileSync(reportPath, lines.join('\n'));
    console.log('Report written to', reportPath);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
