const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    link: String,
    seller: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    startDate: Date,
    endDate: Date,
    isActive: {
        type: Boolean,
        default: true
    },
    position: {
        type: String,
        enum: ['homepage_top', 'homepage_middle', 'sidebar'],
        default: 'homepage_top'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Banner', BannerSchema);
