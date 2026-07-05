/**
 * Phase 4 — Convert inline Base64 product images to /uploads/ files.
 * Does NOT change schema; only updates images[] string values.
 * Usage: node scripts/normalizeProductImages.js [--dry-run] [--write-report]
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Product = require('../models/Product');

const uploadDir = path.join(__dirname, '..', 'uploads');
const dryRun = process.argv.includes('--dry-run');
const writeReport = process.argv.includes('--write-report');
const reportPath = path.join(__dirname, '..', '..', 'IMAGE_NORMALIZATION_REPORT.md');

function extFromMime(mime) {
  if (mime.includes('png')) return '.png';
  if (mime.includes('webp')) return '.webp';
  if (mime.includes('gif')) return '.gif';
  return '.jpg';
}

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI missing');
    process.exit(1);
  }

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  await mongoose.connect(process.env.MONGO_URI);
  const products = await Product.find({
    images: { $elemMatch: { $regex: '^data:image' } },
  });

  const reportRows = [];

  for (const product of products) {
    const nextImages = [];
    let updated = false;

    for (const img of product.images || []) {
      if (typeof img !== 'string' || !img.startsWith('data:image')) {
        nextImages.push(img);
        continue;
      }

      const match = img.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
      if (!match) {
        reportRows.push({
          productId: String(product._id),
          name: product.name,
          action: 'Skipped',
          reason: 'Invalid data URI format',
        });
        nextImages.push(img);
        continue;
      }

      const mime = match[1];
      const buffer = Buffer.from(match[2], 'base64');
      const ext = extFromMime(mime);
      const filename = `product-migrated-${String(product._id)}-${crypto.randomBytes(4).toString('hex')}${ext}`;
      const relativePath = `/uploads/${filename}`;
      const absolutePath = path.join(uploadDir, filename);

      if (!dryRun) {
        fs.writeFileSync(absolutePath, buffer);
      }

      nextImages.push(relativePath);
      updated = true;
      reportRows.push({
        productId: String(product._id),
        name: product.name,
        action: dryRun ? 'Would migrate' : 'Migrated',
        oldFormat: 'Base64',
        newPath: relativePath,
        bytes: buffer.length,
      });
    }

    if (updated && !dryRun) {
      await Product.updateOne(
        { _id: product._id },
        { $set: { images: nextImages } },
        { runValidators: false }
      );
    }
  }

  const lines = [
    '# Image Normalization Report',
    '',
    `**Generated:** ${new Date().toISOString()}`,
    `**Mode:** ${dryRun ? 'DRY RUN' : 'LIVE'}`,
    '',
    '| Product ID | Name | Action | New Path | Bytes |',
    '|------------|------|--------|----------|-------|',
  ];
  for (const r of reportRows) {
    lines.push(
      `| ${r.productId} | ${r.name} | ${r.action} | ${r.newPath || r.reason || '-'} | ${r.bytes || '-'} |`
    );
  }
  if (reportRows.length === 0) {
    lines.push('', '_No Base64 product images found._');
  }

  if (writeReport || !dryRun) {
    fs.writeFileSync(reportPath, lines.join('\n'));
    console.log('Report written to', reportPath);
  }

  console.log(JSON.stringify({ migrated: reportRows.length, dryRun }, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
