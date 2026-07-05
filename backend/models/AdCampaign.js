const mongoose = require('mongoose');

const AdCampaignSchema = new mongoose.Schema({
  manufacturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  tagline: {
    type: String,
    trim: true
  },
  placement: {
    type: String,
    enum: ['hero', 'grid', 'widget'],
    required: true
  },
  plan: {
    type: String,
    enum: ['plan-basic', 'plan-premium', 'plan-elite'],
    required: true
  },
  duration: {
    type: Number,
    required: true // duration in days
  },
  targetCategory: {
    type: String,
    default: 'all',
    lowercase: true
  },
  budget: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'Approved', 'rejected', 'Active', 'Expired'],
    default: 'pending'
  },
  impressions: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  feedback: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AdCampaign', AdCampaignSchema);
