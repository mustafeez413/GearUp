const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    platformFeePercentage: {
        type: Number,
        default: 3,
        min: 0,
        max: 100
    },
    commissionEnabled: {
        type: Boolean,
        default: true
    },
    commissionChargedTo: {
        type: String,
        enum: ['manufacturer', 'wholesaler'],
        default: 'manufacturer'
    },
    refundDeductionPolicy: {
        type: String,
        enum: ['full', 'keep_commission'],
        default: 'full'
    },
    transactionPolicy: {
        type: String,
        default: 'standard'
    },
    platformBankDetails: {
        bankName: { type: String, default: 'Meezan Bank' },
        accountTitle: { type: String, default: 'GearUp Marketplace' },
        accountNumber: { type: String, default: '0123456789' },
        iban: { type: String, default: 'PK00MEZN000000123456789' }
    },
    platformMobileMoney: {
        jazzCashNumber: { type: String, default: '03001234567' },
        easypaisaNumber: { type: String, default: '03451234567' }
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Settings', SettingsSchema);
