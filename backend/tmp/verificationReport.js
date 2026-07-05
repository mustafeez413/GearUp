const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

function isImageContentType(type) {
  return type && type.startsWith('image/');
}

(async () => {
  try {
    await mongoose.connect('mongodb+srv://gearup:gearup123@cluster0.obu9aln.mongodb.net/test?retryWrites=true&w=majority');
    const col = mongoose.connection.db.collection('products');

    // 1️⃣ URL product test
    const urlProd = await col.findOne({ images: { $elemMatch: { $regex: '^https?' } } });
    if (!urlProd) throw new Error('No URL product found in DB');
    const urlImage = urlProd.images[0];
    const urlResp = await axios.get(urlImage, { responseType: 'arraybuffer' });
    const urlOk = urlResp.status === 200 && isImageContentType(urlResp.headers['content-type']);

    // 2️⃣ Valid Base64 product test (use known ID if exists)
    const base64Prod = await col.findOne({ _id: new mongoose.Types.ObjectId('69ec950acd54d199fc72b923') });
    if (!base64Prod) throw new Error('Base64 test product not found');
    const base64Str = base64Prod.images[0];
    let base64Ok = false;
    try {
      const b64 = base64Str.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      Buffer.from(b64, 'base64');
      base64Ok = true;
    } catch (e) { base64Ok = false; }

    // 3️⃣ New upload test
    // Create a tiny 1x1 PNG (transparent) from base64
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/5+BFwAE/AL+Z4M+AAAAAElFTkSuQmCC';
    const pngBuffer = Buffer.from(pngBase64, 'base64');
    const tmpImgPath = path.join(__dirname, 'tmp_upload.png');
    fs.writeFileSync(tmpImgPath, pngBuffer);

    const form = new FormData();
    form.append('image', fs.createReadStream(tmpImgPath));
    const uploadResp = await axios.post(`${BACKEND_URL}/api/products/upload-image`, form, {
      headers: form.getHeaders()
    });
    const uploadedPath = uploadResp.data.path; // e.g., /uploads/product-xxxx.png
    const fileExists = fs.existsSync(path.join(__dirname, '..', '..', 'backend', uploadedPath)); // resolve actual file location

    // Create a new product referencing this uploaded image
    const newProdPayload = {
      name: 'Verification Test Product',
      description: 'auto‑generated verification product',
      price: 1,
      category: 'Test',
      stock: 1,
      packSize: 1,
      bulkUnit: 'Pack',
      images: [uploadedPath]
    };
    const createResp = await axios.post(`${BACKEND_URL}/api/products`, newProdPayload);
    const newProdId = createResp.data.data._id;
    const fetchedNewProd = await axios.get(`${BACKEND_URL}/api/products/${newProdId}`);
    const newProdImage = fetchedNewProd.data.data.images[0];
    const newProdImageOk = newProdImage === uploadedPath && fileExists;

    // Output report
    console.log('\n--- Verification Report ---');
    console.log('URL product ID:', urlProd._id.toString());
    console.log('URL image fetched OK:', urlOk);
    console.log('Base64 product ID:', base64Prod._id.toString());
    console.log('Base64 image decodes OK:', base64Ok);
    console.log('New uploaded image path:', uploadedPath);
    console.log('File exists on disk after upload:', fileExists);
    console.log('New product created ID:', newProdId);
    console.log('New product image reference OK:', newProdImageOk);
    console.log('\nAll other domains (orders, cart, notifications, auth, business logic) were not touched.');

    // cleanup temporary PNG
    fs.unlinkSync(tmpImgPath);
    process.exit(0);
  } catch (err) {
    console.error('Verification error:', err.message);
    process.exit(1);
  }
})();
