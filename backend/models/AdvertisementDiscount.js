const mongoose = require('mongoose');

const AdvertisementDiscountSchema = new mongoose.Schema({
  discountName: { type: String, required: true, trim: true },
  discountPercentage: { type: Number, required: true, min: 0, max: 100 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['active', 'inactive', 'scheduled', 'expired'],
    default: 'active'
  },
  applyTo: {
    type: String,
    enum: ['all_plans', 'specific_plans', 'specific_categories'],
    default: 'all_plans'
  },
  applicablePlans: [{
    type: String,
    enum: ['starter', 'growth', 'premium']
  }],
  applicableCategories: [{ type: String, trim: true }],
  isPromotion: { type: Boolean, default: false },
  promotionTag: { type: String, default: '', trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, collection: 'advertisementdiscounts' });

module.exports = mongoose.model('AdvertisementDiscount', AdvertisementDiscountSchema);
