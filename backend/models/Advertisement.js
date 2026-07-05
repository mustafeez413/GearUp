const mongoose = require('mongoose');

const AdvertisementSchema = new mongoose.Schema({
  manufacturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  campaignType: {
    type: String,
    enum: ['sponsored_product', 'featured_product', 'homepage_featured'],
    default: 'sponsored_product'
  },
  plan: {
    type: String,
    enum: ['starter', 'growth', 'premium'],
    required: true
  },
  budget: { type: Number, default: 0 },
  dailyBudget: { type: Number, default: null },
  startDate: { type: Date },
  endDate: { type: Date },
  status: {
    type: String,
    enum: [
      'draft',
      'pending_payment',
      'pending_approval',
      'active',
      'paused',
      'rejected',
      'expired',
      'completed'
    ],
    default: 'draft',
    index: true
  },
  impressions: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 },
  inquiries: { type: Number, default: 0 },
  quoteRequests: { type: Number, default: 0 },
  ordersGenerated: { type: Number, default: 0 },
  revenueGenerated: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 },
  originalPrice: { type: Number, default: 0 },
  discountPercent: { type: Number, default: 0 },
  discountName: { type: String, default: '' },
  rankScore: { type: Number, default: 0 },
  rejectionReason: { type: String, default: '' },
  duplicatedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertisement'
  },
  customMedia: { type: String, default: null },
  description: { type: String, default: '' },
  expiredAt: { type: Date, default: null }
}, { timestamps: true });

AdvertisementSchema.index({ status: 1, endDate: 1 });
AdvertisementSchema.index({ manufacturerId: 1, status: 1 });

module.exports = mongoose.model('Advertisement', AdvertisementSchema);
