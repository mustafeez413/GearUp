/**
 * GearUp Commission Calculation Utility
 * 
 * Commission rates are fixed by platform policy:
 * - Cricket items: 3%
 * - Football items: 3%
 * - Protective gear: 2.5%
 */

export const COMMISSION_RATES = {
    cricket: 0.03,      // 3%
    football: 0.03,     // 3%
    'protective gear': 0.025,  // 2.5%
    'sports equipment': 0.03, // 3%
    default: 0.03       // 3% default
};

/**
 * Calculate commission amount for a product
 * @param {number} price - Base price per unit
 * @param {string} category - Product category (cricket, football, protective)
 * @returns {number} Commission amount
 */
export const calculateCommission = (price, category) => {
    const cat = category?.toLowerCase();
    const rate = COMMISSION_RATES[cat] || COMMISSION_RATES.default;
    return Math.round(price * rate * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate final price including commission
 * @param {number} price - Base price per unit
 * @param {string} category - Product category
 * @returns {number} Final price including commission
 */
export const calculateFinalPrice = (price, category) => {
    return price + calculateCommission(price, category);
};

/**
 * Calculate commission for bulk order
 * @param {number} price - Base price per unit
 * @param {number} quantity - Order quantity
 * @param {string} category - Product category
 * @returns {Object} Commission breakdown
 */
export const calculateBulkCommission = (price, quantity, category) => {
    const unitCommission = calculateCommission(price, category);
    const totalCommission = unitCommission * quantity;
    const unitFinalPrice = calculateFinalPrice(price, category);
    const totalAmount = unitFinalPrice * quantity;
    const baseAmount = price * quantity;

    return {
        unitPrice: price,
        unitCommission,
        unitFinalPrice,
        quantity,
        baseAmount,
        totalCommission,
        totalAmount
    };
};

/**
 * Get commission rate as percentage for display
 * @param {string} category - Product category
 * @returns {number} Commission rate as percentage
 */
export const getCommissionRate = (category) => {
    const cat = category?.toLowerCase();
    const rate = COMMISSION_RATES[cat] || COMMISSION_RATES.default;
    return rate * 100;
};
