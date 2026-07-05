const mongoose = require('mongoose');
const Advertisement = require('../models/Advertisement');
require('dotenv').config({ path: '../.env' });

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gearup');
  const ads = await Advertisement.find({}).lean();
  console.log(JSON.stringify(ads, null, 2));
  process.exit(0);
}
check();
