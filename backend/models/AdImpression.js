const mongoose = require('mongoose');

const AdImpressionSchema = new mongoose.Schema({
  advertisementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertisement',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  eventType: {
    type: String,
    enum: ['impression', 'view'],
    default: 'impression'
  },
  placement: { type: String, default: 'marketplace' },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

AdImpressionSchema.index({ advertisementId: 1, createdAt: -1 });

module.exports = mongoose.model('AdImpression', AdImpressionSchema);
