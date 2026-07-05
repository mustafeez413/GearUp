const mongoose = require('mongoose');

const AdClickSchema = new mongoose.Schema({
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
  placement: { type: String, default: 'marketplace' },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

AdClickSchema.index({ advertisementId: 1, createdAt: -1 });

module.exports = mongoose.model('AdClick', AdClickSchema);
