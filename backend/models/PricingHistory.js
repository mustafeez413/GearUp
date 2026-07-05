const mongoose = require('mongoose');

const PricingHistorySchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planName: { type: String, required: true },
  planSlug: { type: String, required: true },
  oldPrice: { type: Number, required: true },
  newPrice: { type: Number, required: true },
  changedAt: { type: Date, default: Date.now }
}, { collection: 'pricinghistories' });

PricingHistorySchema.index({ changedAt: -1 });
PricingHistorySchema.index({ planSlug: 1, changedAt: -1 });

module.exports = mongoose.model('PricingHistory', PricingHistorySchema);
