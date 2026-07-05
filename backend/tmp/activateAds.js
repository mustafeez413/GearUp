const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Ad = require('../models/Advertisement');
  await Ad.updateMany({ status: 'pending_approval' }, { $set: { status: 'active' } });
  console.log('Activated pending ads.');
  process.exit(0);
});
