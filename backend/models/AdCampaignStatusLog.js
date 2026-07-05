const mongoose = require('mongoose');

const AdCampaignStatusLogSchema = new mongoose.Schema(
  {
    advertisementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Advertisement',
      required: true,
      index: true
    },
    eventType: {
      type: String,
      enum: ['status_change', 'extend'],
      default: 'status_change'
    },
    previousStatus: { type: String, default: null },
    newStatus: { type: String, default: null },
    previousEndDate: { type: Date, default: null },
    newEndDate: { type: Date, default: null },
    reason: { type: String, required: true, trim: true },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

AdCampaignStatusLogSchema.index({ advertisementId: 1, createdAt: -1 });

module.exports = mongoose.model('AdCampaignStatusLog', AdCampaignStatusLogSchema);
