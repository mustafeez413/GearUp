// migrationReport.js
// Run with: node backend/tmp/migrationReport.js

const mongoose = require('mongoose');
const Product = require('../models/Product');
const dotenv = require('dotenv');

dotenv.config({ path: '../../.env' });

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const total = await Product.countDocuments();
    const urlImages = await Product.countDocuments({ images: { $elemMatch: { $regex: '^https?://' } } });
    const base64Images = await Product.countDocuments({ images: { $elemMatch: { $regex: '^data:image' } } });
    const uploadPathImages = await Product.countDocuments({ images: { $elemMatch: { $regex: '^/uploads/' } } });

    console.log('\n--- Migration Report ---');
    console.log('Total products: ', total);
    console.log('Products with URL images: ', urlImages);
    console.log('Products with Base64 images: ', base64Images);
    console.log('Products with uploaded /uploads images: ', uploadPathImages);
    console.log('--- End of Report ---\n');

    // Identify potentially corrupt Base64 entries (simple heuristic: length > 100 and not ending with "=" )
    const possiblyCorrupt = await Product.find({ images: { $elemMatch: { $regex: '^data:image' } } }, { images: 1, _id: 1 });
    const corruptIds = [];
    for (const prod of possiblyCorrupt) {
      for (const img of prod.images) {
        if (img.startsWith('data:image')) {
          const parts = img.split(',');
          if (parts.length === 2) {
            const base64 = parts[1];
            // If the base64 string length is not a multiple of 4, it may be truncated
            if (base64.length % 4 !== 0) {
              corruptIds.push(prod._id.toString());
              break;
            }
          }
        }
      }
    }
    console.log('Potentially corrupted Base64 product IDs:', corruptIds);
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    mongoose.disconnect();
  }
}

main();
