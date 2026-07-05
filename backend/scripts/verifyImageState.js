require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const b64 = await Product.countDocuments({ images: { $elemMatch: { $regex: '^data:' } } });
  const upload = await Product.countDocuments({ images: { $elemMatch: { $regex: '^/uploads/' } } });
  console.log('base64 remaining:', b64, 'upload paths:', upload);
  const products = await Product.find({ images: { $elemMatch: { $regex: '^/uploads/' } } }, { name: 1, images: 1 }).lean();
  const dir = path.join(__dirname, '..', 'uploads');
  for (const p of products) {
    for (const img of p.images) {
      if (!img.startsWith('/uploads/')) continue;
      const exists = fs.existsSync(path.join(dir, path.basename(img)));
      console.log(p.name, img, exists ? 'disk OK' : 'disk MISSING');
    }
  }
  await mongoose.disconnect();
})();
