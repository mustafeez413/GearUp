const mongoose = require('mongoose');

const AdAnalyticsSchema = new mongoose.Schema({
  advertisementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertisement',
    required: true,
    index: true
  },
  date: { type: Date, required: true, index: true },
  impressions: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  inquiries: { type: Number, default: 0 },
  quoteRequests: { type: Number, default: 0 },
  ordersGenerated: { type: Number, default: 0 },
  revenueGenerated: { type: Number, default: 0 }
}, { timestamps: true });

AdAnalyticsSchema.index({ advertisementId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AdAnalytics', AdAnalyticsSchema);
