/**
 * Minimum Order Quantity (MOQ) Utility
 * 
 * Platform Policy:
 * - Fixed MOQ: 50 units for all products
 * - Manufacturers cannot set MOQ above 50 units
 * - Orders below 50 units are blocked
 */

export const PLATFORM_MOQ = 50;
export const DOZEN_UNITS_PER_PACK = 12;

function pluralizeBulkUnit(unit, qty) {
    if (qty === 1) return unit;
    if (unit.endsWith('s')) return unit;
    if (unit === 'Box') return 'Boxes';
    return `${unit}s`;
}

/**
 * Format MOQ for display — uses minimumOrderQuantity, not stock.
 * @returns {{ primary: string, secondary: string|null, compact: string }}
 */
export function formatMoqDisplay(moq, bulkUnit = 'Unit', packSize = DOZEN_UNITS_PER_PACK) {
    const qty = Math.max(1, Number(moq) || 1);
    const unit = bulkUnit || 'Unit';

    const unitLabel = pluralizeBulkUnit(unit, qty);
    const primary = `${qty} ${unitLabel}`;
    let secondary = null;
    
    if (unit !== 'Unit') {
        let effectivePackSize = Number(packSize) || 1;
        if (unit === 'Dozen' && effectivePackSize === 1) {
            effectivePackSize = DOZEN_UNITS_PER_PACK;
        }
        const totalUnits = qty * effectivePackSize;
        secondary = `(${totalUnits} Units)`;
    }

    return {
        primary,
        secondary,
        compact: primary,
    };
}

/**
 * Validate order quantity against MOQ
 * @param {number} quantity - Requested order quantity
 * @param {number} productMOQ - Product's MOQ (should not exceed platform MOQ)
 * @returns {Object} Validation result
 */
export function formatStockWithUnit(stock, bulkUnit = 'Unit', moq = 1) {
    const qty = Math.max(0, Number(stock) || 0);
    const unit = bulkUnit || 'Unit';
    const unitLabel = pluralizeBulkUnit(unit, qty);
    const moqLabel = formatMoqDisplay(moq, unit).primary;
    return {
        stockLabel: `${qty.toLocaleString()} ${unitLabel}`,
        moqLabel,
        unit,
    };
}

export const validateMOQ = (quantity, productMOQ = PLATFORM_MOQ) => {
    const effectiveMOQ = Math.min(productMOQ, PLATFORM_MOQ);

    if (quantity < effectiveMOQ) {
        return {
            valid: false,
            error: `Minimum order quantity is ${effectiveMOQ} units.`,
            minQuantity: effectiveMOQ
        };
    }

    return {
        valid: true,
        error: null,
        minQuantity: effectiveMOQ
    };
};

/**
 * Get valid order quantities for display
 * @param {number} productMOQ - Product's MOQ
 * @returns {number[]} Array of suggested quantities
 */
export const getSuggestedQuantities = (productMOQ = PLATFORM_MOQ) => {
    const effectiveMOQ = Math.min(productMOQ, PLATFORM_MOQ);
    return [
        effectiveMOQ,
        effectiveMOQ * 2,
        effectiveMOQ * 5,
        effectiveMOQ * 10
    ];
};

/**
 * Format MOQ message for UI
 * @param {number} productMOQ - Product's MOQ
 * @returns {string} Formatted message
 */
export const getMOQMessage = (productMOQ = PLATFORM_MOQ) => {
    const effectiveMOQ = Math.min(productMOQ, PLATFORM_MOQ);
    return `Minimum order quantity is ${effectiveMOQ} units.`;
};
