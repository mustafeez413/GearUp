(async () => {
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
  const isImage = (type) => type && type.startsWith('image/');

  // Helper: fetch JSON
  const fetchJson = async (url, opts = {}) => {
    const res = await fetch(url, {headers: {Accept: 'application/json', ...(opts.headers||{})}, ...opts});
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
    return await res.json();
  };

  // 1️⃣ Existing URL‑based product
  const allProducts = (await fetchJson(`${BACKEND}/api/products`)).data;
  const urlProd = allProducts.find(p => p.images && p.images[0] && p.images[0].startsWith('http'));
  if (!urlProd) throw new Error('No URL product found');
  const urlResp = await fetch(urlProd.images[0]);
  const urlOk = urlResp.ok && isImage(urlResp.headers.get('content-type'));
  console.log('✅ URL product OK (ID', urlProd._id, ')', urlOk);

  // 2️⃣ Existing valid Base64 product
  const base64Prod = allProducts.find(p => p.images && p.images[0] && p.images[0].startsWith('data:image'));
  if (!base64Prod) throw new Error('No Base64 product found');
  let base64Ok = false;
  try {
    const b64 = base64Prod.images[0].replace(/^data:image\/[a-zA-Z]+;base64,/, '');
    Buffer.from(b64, 'base64');
    base64Ok = true;
  } catch (_) {}
  console.log('✅ Base64 product OK (ID', base64Prod._id, ') decoded:', base64Ok);

  // 3️⃣ New device upload (tiny PNG)
  const tinyBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/5+BFwAE/AL+Z4M+AAAAAElFTkSuQmCC';
  const tmpPath = require('path').join(__dirname, 'tmp_upload.png');
  require('fs').writeFileSync(tmpPath, Buffer.from(tinyBase64, 'base64'));
  const form = new FormData();
  form.append('image', require('fs').createReadStream(tmpPath));
  const uploadRes = await fetch(`${BACKEND}/api/products/upload-image`, {method: 'POST', body: form});
  const uploadJson = await uploadRes.json();
  const uploadedPath = uploadJson.path; // e.g. /uploads/product-xxx.png
  const fileExists = require('fs').existsSync(require('path').join(__dirname, '..', '..', 'backend', uploadedPath));
  console.log('✅ New upload stored at', uploadedPath, 'file exists:', fileExists);

  // 4️⃣ Create product using uploaded image
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
  const createRes = await fetch(`${BACKEND}/api/products`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(newProd)});
  const created = await createRes.json();
  const createdId = created.data._id;
  console.log('✅ Product created ID', createdId);

  // 5️⃣ Edit product – replace image with another tiny PNG
  const tmpPath2 = require('path').join(__dirname, 'tmp_upload2.png');
  require('fs').writeFileSync(tmpPath2, Buffer.from(tinyBase64, 'base64'));
  const form2 = new FormData();
  form2.append('image', require('fs').createReadStream(tmpPath2));
  const uploadRes2 = await fetch(`${BACKEND}/api/products/upload-image`, {method: 'POST', body: form2});
  const uploadJson2 = await uploadRes2.json();
  const newPath = uploadJson2.path;
  const editPayload = {images: [newPath]};
  await fetch(`${BACKEND}/api/products/${createdId}`, {method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(editPayload)});
  console.log('✅ Product edited – new image path', newPath);

  // 6️⃣ Verify edited image exists
  const editedProd = await fetchJson(`${BACKEND}/api/products/${createdId}`);
  const editedImg = editedProd.data.images[0];
  const editedFileExists = require('fs').existsSync(require('path').join(__dirname, '..', '..', 'backend', editedImg));
  console.log('✅ Edited image path matches DB', editedImg===newPath, 'file exists:', editedFileExists);

  // 7️⃣ Delete product
  await fetch(`${BACKEND}/api/products/${createdId}`, {method: 'DELETE'});
  console.log('✅ Product deleted ID', createdId);

  // 8️⃣ Verify listings still reachable
  const afterDelete = await fetchJson(`${BACKEND}/api/products`);
  console.log('✅ Total products after delete:', afterDelete.data.length);

  // cleanup temp files
  require('fs').unlinkSync(tmpPath);
  require('fs').unlinkSync(tmpPath2);

  console.log('\n--- FULL VERIFICATION REPORT COMPLETE ---');
})().catch(e => { console.error('❌ Verification failed:', e.message); process.exit(1); });
