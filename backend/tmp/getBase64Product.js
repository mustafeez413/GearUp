const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://gearup:gearup123@cluster0.obu9aln.mongodb.net/test?retryWrites=true&w=majority')
  .then(async () => {
    const col = mongoose.connection.db.collection('products');
    const doc = await col.findOne({ images: { $elemMatch: { $regex: '^data:image' } } });
    if (!doc) {
      console.log('No base64 image product found');
    } else {
      console.log(JSON.stringify({ id: doc._id.toString(), name: doc.name, imageSnippet: doc.images[0].substring(0, 80) + '...' }, null, 2));
    }
    process.exit();
  })
  .catch(err => { console.error('Error', err); process.exit(1); });
