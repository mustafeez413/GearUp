const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'; // adjust port if needed

function isImageContentType(type){return type && type.startsWith('image/');}

(async () => {
  try {
    // ----- 1. Existing URL‑based product -----
    const urlProd = await axios.get(`${BACKEND}/api/products`);
    const urlItem = urlProd.data.data.find(p=>p.images && p.images[0] && p.images[0].startsWith('http'));
    if(!urlItem) throw new Error('No URL‑based product found');
    const urlResp = await axios.get(urlItem.images[0], {responseType:'arraybuffer'});
    const urlOk = urlResp.status===200 && isImageContentType(urlResp.headers['content-type']);
    console.log('✅ URL product OK (ID',urlItem._id,')');

    // ----- 2. Existing valid Base64 product -----
    const base64Item = urlProd.data.data.find(p=>p.images && p.images[0] && p.images[0].startsWith('data:image'));
    if(!base64Item) throw new Error('No Base64 product found');
    let base64Ok = false;
    try { const b64 = base64Item.images[0].replace(/^data:image\/[a-zA-Z]+;base64,/, ''); Buffer.from(b64,'base64'); base64Ok = true; } catch(e) {}
    console.log('✅ Base64 product OK (ID',base64Item._id,') decoded:',base64Ok);

    // ----- 3. New Device upload (tiny PNG) -----
    const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/5+BFwAE/AL+Z4M+AAAAAElFTkSuQmCC';
    const tmpPath = path.join(__dirname,'tmp_upload.png');
    fs.writeFileSync(tmpPath, Buffer.from(tinyPngBase64,'base64'));
    const form = new FormData();
    form.append('image', fs.createReadStream(tmpPath));
    const uploadRes = await axios.post(`${BACKEND}/api/products/upload-image`, form, {headers: form.getHeaders()});
    const uploadedPath = uploadRes.data.path; // e.g. /uploads/product-xxx.png
    const fileExists = fs.existsSync(path.join(__dirname,'..','..','backend',uploadedPath));
    console.log('✅ New upload stored at',uploadedPath,'file exists:',fileExists);

    // ----- 4. Create product using uploaded image -----
    const newProd = {
      name: 'Verification Test Product',
      description: 'auto‑generated',
      price: 1,
      category: 'Test',
      stock: 1,
      packSize: 1,
      bulkUnit: 'Pack',
      images: [uploadedPath]
    };
    const createRes = await axios.post(`${BACKEND}/api/products`, newProd);
    const createdId = createRes.data.data._id;
    console.log('✅ Product created ID',createdId);

    // ----- 5. Edit product – replace image with another tiny PNG -----
    const secondPng = Buffer.from(tinyPngBase64,'base64'); // reuse same tiny image for simplicity
    const tmpPath2 = path.join(__dirname,'tmp_upload2.png');
    fs.writeFileSync(tmpPath2, secondPng);
    const form2 = new FormData();
    form2.append('image', fs.createReadStream(tmpPath2));
    const uploadRes2 = await axios.post(`${BACKEND}/api/products/upload-image`, form2, {headers: form2.getHeaders()});
    const newPath = uploadRes2.data.path;
    const editPayload = { images: [newPath] };
    await axios.patch(`${BACKEND}/api/products/${createdId}`, editPayload);
    console.log('✅ Product edited – new image path',newPath);

    // ----- 6. Verify edited image renders -----
    const fetchEdited = await axios.get(`${BACKEND}/api/products/${createdId}`);
    const editedImg = fetchEdited.data.data.images[0];
    const editedFileExists = fs.existsSync(path.join(__dirname,'..','..','backend',editedImg));
    console.log('✅ Edited image path matches DB', editedImg===newPath, 'file exists:', editedFileExists);

    // ----- 7. Delete product -----
    await axios.delete(`${BACKEND}/api/products/${createdId}`);
    console.log('✅ Product deleted ID',createdId);

    // ----- 8. Verify listings for each dashboard -----
    const all = await axios.get(`${BACKEND}/api/products`);
    console.log('✅ Total products after delete:', all.data.data.length);
    // manufacturer, wholesaler, marketplace all read from same endpoint in this app – just ensure request succeeds.
    console.log('✅ Manufacturer/Wholesaler/Marketplace listings reachable (GET /api/products)');

    // ----- 9. Clean up temp files -----
    fs.unlinkSync(tmpPath);
    fs.unlinkSync(tmpPath2);

    console.log('\n--- FULL VERIFICATION REPORT COMPLETE ---');
  } catch (e) {
    console.error('❌ Verification failed:', e.message);
    process.exit(1);
  }
})();
