/** Server-side bulk packaging validation — mirrors frontend rules. */

const BULK_UNIT_OPTIONS = ['Dozen', 'Pack', 'Box', 'Carton', 'Unit Set', 'Unit'];

const DOZEN_PACK_SIZE = 12;
const MIN_PACK_SIZE = 1;
const MAX_PACK_SIZE = 999;

const MESSAGES = {
  required: 'Units Per Bulk Pack is required.',
  min: 'Units Per Bulk Pack must be greater than zero.',
  max: `Units Per Bulk Pack cannot exceed ${MAX_PACK_SIZE}.`,
  dozenExact: 'Dozen pack must contain exactly 12 units.',
  invalidUnit: 'Invalid bulk pack unit type.',
};

function isDozenBulkUnit(bulkUnit) {
  return bulkUnit === 'Dozen';
}

function parsePackSize(packSize) {
  if (packSize === '' || packSize === null || packSize === undefined) {
    return null;
  }
  const parsed = Number(packSize);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Validate bulk packaging for create/update payloads.
 * @returns {{ valid: boolean, error?: string, normalizedPackSize?: number }}
 */
function validateBulkPackaging(bulkUnit, packSize) {
  if (bulkUnit && !BULK_UNIT_OPTIONS.includes(bulkUnit)) {
    return { valid: false, error: MESSAGES.invalidUnit };
  }

  const parsed = parsePackSize(packSize);
  if (parsed === null) {
    return { valid: false, error: MESSAGES.required };
  }

  if (isDozenBulkUnit(bulkUnit)) {
    if (parsed !== DOZEN_PACK_SIZE) {
      return { valid: false, error: MESSAGES.dozenExact };
    }
    return { valid: true, normalizedPackSize: DOZEN_PACK_SIZE };
  }

  if (parsed < MIN_PACK_SIZE) {
    return { valid: false, error: MESSAGES.min };
  }

  if (parsed > MAX_PACK_SIZE) {
    return { valid: false, error: MESSAGES.max };
  }

  return { valid: true, normalizedPackSize: parsed };
}

/**
 * Apply validation to a product payload; mutates packSize when valid.
 * @returns {{ valid: boolean, error?: string }}
 */
function applyBulkPackagingToPayload(payload) {
  if (!payload || (payload.bulkUnit === undefined && payload.packSize === undefined)) {
    return { valid: true };
  }

  const bulkUnit = payload.bulkUnit;
  const packSize = payload.packSize;

  if (bulkUnit === undefined && packSize === undefined) {
    return { valid: true };
  }

  const result = validateBulkPackaging(bulkUnit, packSize);
  if (!result.valid) {
    return result;
  }

  if (result.normalizedPackSize !== undefined) {
    payload.packSize = result.normalizedPackSize;
  }

  return { valid: true };
}

module.exports = {
  BULK_UNIT_OPTIONS,
  DOZEN_PACK_SIZE,
  MIN_PACK_SIZE,
  MAX_PACK_SIZE,
  MESSAGES,
  validateBulkPackaging,
  applyBulkPackagingToPayload,
};
