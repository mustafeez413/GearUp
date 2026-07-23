const mongoose = require('mongoose');

const AdPaymentSchema = new mongoose.Schema({
  advertisementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertisement',
    required: true,
    index: true
  },
  manufacturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: { type: Number, required: true },
  plan: { type: String, required: true },
  paymentMethod: {
    type: String,
    enum: ['card', 'stripe'],
    default: 'stripe'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  ledgerReference: { type: String, default: '' },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

AdPaymentSchema.index({ status: 1, createdAt: -1 });
AdPaymentSchema.index({ plan: 1, status: 1 });

module.exports = mongoose.model('AdPayment', AdPaymentSchema);
