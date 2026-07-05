const Settings = require('../models/Settings');

const DEFAULTS = {
    commissionEnabled: true,
    platformFeePercentage: 3,
    commissionChargedTo: 'manufacturer'
};

async function loadCommissionSettings() {
    const settings = await Settings.findOne();
    return {
        commissionEnabled: settings?.commissionEnabled ?? DEFAULTS.commissionEnabled,
        platformFeePercentage: settings?.platformFeePercentage ?? DEFAULTS.platformFeePercentage,
        commissionChargedTo: settings?.commissionChargedTo ?? DEFAULTS.commissionChargedTo
    };
}

function resolveFeePercent(settings) {
    if (!settings?.commissionEnabled) return 0;
    return (Number(settings.platformFeePercentage) || 0) / 100;
}

function calculateItemCommission(itemSubtotal, feePercent) {
    return Math.round(itemSubtotal * feePercent * 100) / 100;
}

function splitCommission(itemSubtotal, itemCommission, commissionChargedTo, commissionEnabled) {
    if (!commissionEnabled || itemCommission <= 0) {
        return { platformCommission: 0, sellerReceivable: itemSubtotal };
    }

    if (commissionChargedTo === 'wholesaler') {
        return {
            platformCommission: itemCommission,
            sellerReceivable: itemSubtotal
        };
    }

    return {
        platformCommission: itemCommission,
        sellerReceivable: Math.round((itemSubtotal - itemCommission) * 100) / 100
    };
}

function calculateBuyerTotal(subtotal, platformCommissionTotal, settings) {
    if (!settings?.commissionEnabled || platformCommissionTotal <= 0) {
        return subtotal;
    }
    if (settings.commissionChargedTo === 'wholesaler') {
        return Math.round((subtotal + platformCommissionTotal) * 100) / 100;
    }
    return subtotal;
}

function validateCommissionInput({ commissionEnabled, platformFeePercentage }) {
    if (commissionEnabled === false) return null;

    const rate = platformFeePercentage;
    if (rate === undefined || rate === null) return null;

    const num = Number(rate);
    if (Number.isNaN(num)) return 'Commission rate must be a valid number.';
    if (num < 0.1) return 'Commission rate must be at least 0.1% when commission is enabled.';
    if (num > 100) return 'Commission rate cannot exceed 100%.';
    return null;
}

module.exports = {
    DEFAULTS,
    loadCommissionSettings,
    resolveFeePercent,
    calculateItemCommission,
    splitCommission,
    calculateBuyerTotal,
    validateCommissionInput
};
