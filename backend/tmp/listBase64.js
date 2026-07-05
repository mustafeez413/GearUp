const mongoose = require('mongoose');
(async () => {
  try {
    await mongoose.connect('mongodb+srv://gearup:gearup123@cluster0.obu9aln.mongodb.net/test?retryWrites=true&w=majority');
    const col = mongoose.connection.db.collection('products');
    const docs = await col.find({ images: { $elemMatch: { $regex: '^data:image' } } }).toArray();
    console.log('Base64 products count:', docs.length);
    docs.forEach(d => {
      const img = d.images[0];
      console.log('ID', d._id.toString(), 'len', img.length);
    });
    process.exit(0);
  } catch (e) {
    console.error('Error', e);
    process.exit(1);
  }
})();
