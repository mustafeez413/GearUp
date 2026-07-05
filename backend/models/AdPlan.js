const mongoose = require('mongoose');

const AdPlanSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    enum: ['starter', 'growth', 'premium']
  },
  planName: { type: String, required: true },
  duration: { type: Number, required: true },
  price: { type: Number, required: true, min: 0 },
  packageWeight: { type: Number, default: 1 },
  visibilityTier: {
    type: String,
    enum: ['basic', 'increased', 'highest'],
    default: 'basic'
  },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true, collection: 'advertisementplans' });

AdPlanSchema.virtual('name').get(function () {
  return this.planName;
});

AdPlanSchema.virtual('durationDays').get(function () {
  return this.duration;
});

AdPlanSchema.set('toJSON', { virtuals: true });
AdPlanSchema.set('toObject', { virtuals: true });

AdPlanSchema.pre('save', function syncStatus() {
  if (this.isModified('status')) {
    this.isActive = this.status === 'active';
  } else if (this.isModified('isActive')) {
    this.status = this.isActive ? 'active' : 'inactive';
  }
});

module.exports = mongoose.model('AdPlan', AdPlanSchema, 'advertisementplans');
