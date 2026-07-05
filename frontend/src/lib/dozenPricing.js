/** UI-only dozen pricing helpers — stored API field remains pricePerBulkUnit. */

export const DOZEN_UNIT_COUNT = 12;

export const DOZEN_PRICING_MESSAGES = {
  singleRequired: 'Single Bat Price is required.',
  singlePositive: 'Single Bat Price must be greater than zero.',
  singleInteger: 'Single Bat Price must be a whole number (PKR).',
  singleNegative: 'Single Bat Price cannot be negative.',
  dozenHelper: 'Price Per Dozen is automatically calculated from the single unit price.',
};

export function deriveSinglePriceFromDozen(dozenPrice) {
  const parsed = Number(dozenPrice);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return Math.round(parsed / DOZEN_UNIT_COUNT);
}

export function calculateDozenPriceFromSingle(singlePrice) {
  if (singlePrice === '' || singlePrice === null || singlePrice === undefined) {
    return '';
  }

  const raw = String(singlePrice).trim();
  if (raw.includes('.')) return '';

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return '';
  return parsed * DOZEN_UNIT_COUNT;
}

export function validateSingleBatPrice(value) {
  if (value === '' || value === null || value === undefined) {
    return { valid: false, error: DOZEN_PRICING_MESSAGES.singleRequired };
  }

  const raw = String(value).trim();
  if (raw.includes('.')) {
    return { valid: false, error: DOZEN_PRICING_MESSAGES.singleInteger };
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return { valid: false, error: DOZEN_PRICING_MESSAGES.singleRequired };
  }

  if (parsed < 0) {
    return { valid: false, error: DOZEN_PRICING_MESSAGES.singleNegative };
  }

  if (!Number.isInteger(parsed)) {
    return { valid: false, error: DOZEN_PRICING_MESSAGES.singleInteger };
  }

  if (parsed <= 0) {
    return { valid: false, error: DOZEN_PRICING_MESSAGES.singlePositive };
  }

  return {
    valid: true,
    normalizedSingle: parsed,
    normalizedDozen: parsed * DOZEN_UNIT_COUNT,
  };
}

export function isDozenPricingMode(bulkUnit) {
  return bulkUnit === 'Dozen';
}
