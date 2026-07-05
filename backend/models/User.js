const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { findCityMatch, normalizeProvince, RECOGNIZED_PROVINCES } = require('../utils/pakistanLocations');
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [
            function () { return this.authProvider === 'local'; },
            'Please add a password'
        ],
        minlength: 6,
        select: false
    },
    googleId: {
        type: String,
        sparse: true,
        unique: true
    },
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    role: {
        type: String,
        enum: ['wholesaler', 'manufacturer', 'admin'],
        default: 'wholesaler'
    },
    avatar: {
        type: String,
        default: ''
    },
    businessDetails: {
        businessName: String,
        shopNumber: String,
        street: String,
        area: String,
        city: {
            type: String,
            validate: {
                validator: function (v) {
                    if (!v) return true;
                    return Boolean(findCityMatch(v));
                },
                message: 'Please select a valid city.'
            }
        },
        province: {
            type: String,
            validate: {
                validator: function (v) {
                    if (!v) return true;
                    return RECOGNIZED_PROVINCES.includes(normalizeProvince(v));
                },
                message: 'Please select a valid province.'
            }
        },
        phone: {
            type: String,
            validate: {
                validator: function (v) {
                    if (!v) return true; // Optional empty / null values are allowed
                    return /^((\+92)|(0092))?3[0-9]{9}$|^03[0-9]{9}$/.test(v);
                },
                message: 'Please add a valid Pakistan phone number'
            }
        },
        taxId: {
            type: String,
            match: [/^\d{7,9}$/, 'NTN must be 7-9 numeric digits']
        },
        businessLicense: String,
        isVerified: {
            type: Boolean,
            default: false
        },
        sellerType: {
            type: String,
            enum: ['manufacturer', 'wholesaler', 'none'],
            default: 'none'
        }
    },
    paymentDetails: {
        paymentMethodType: {
            type: String,
            enum: ['Bank Account', 'JazzCash', 'Easypaisa', 'SadaPay', 'NayaPay', 'Other'],
            default: 'Bank Account'
        },
        bankName: String,
        accountTitle: String,
        accountNumber: String,
        iban: String,
        jazzCashNumber: String,
        easypaisaNumber: String,
        sadaPayNumber: String,
        nayaPayNumber: String,
        otherWalletName: String,
        otherWalletNumber: String,
        paymentNotes: String
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'business_required'],
        default: 'pending'
    },
    verificationSubmittedAt: { type: Date },
    verificationReviewedAt: { type: Date },
    verificationRejectionReason: { type: String },
    verificationAdminNotes: { type: String },
    otp: {
        type: String,
        select: false
    },
    otpExpires: {
        type: Date,
        select: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    agreedToTerms: {
        type: Boolean,
        default: false
    },
    acceptedPolicies: {
        type: Boolean,
        default: false
    },
    acceptedPoliciesAt: {
        type: Date
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    isBlocked: {
        type: Boolean,
        default: false
    },
    blockReason: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

// Normalize Pakistan location fields to canonical values before save
UserSchema.pre('save', function () {
    if (this.businessDetails?.city) {
        const matchedCity = findCityMatch(this.businessDetails.city);
        if (matchedCity) {
            this.businessDetails.city = matchedCity;
        }
    }
    if (this.businessDetails?.province) {
        this.businessDetails.province = normalizeProvince(this.businessDetails.province);
    }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
