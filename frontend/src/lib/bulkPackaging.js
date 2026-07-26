/** Shared bulk packaging rules for product create/edit flows. */

export const BULK_UNIT_OPTIONS = ['Dozen', 'Pack', 'Box', 'Carton'];

export const UNIT_DEFAULT_PACK_SIZES = {
  Dozen: 12,
  Pack: 6,
  Box: 3,
  Carton: 24,
};

export const DOZEN_PACK_SIZE = 12;
export const MIN_PACK_SIZE = 1;
export const MAX_PACK_SIZE = 999;
export const DEFAULT_MOQ = 3;

export const BULK_PACK_MESSAGES = {
  required: 'Units Per Bulk Pack is required.',
  min: 'Units Per Bulk Pack must be greater than zero.',
  minDefault: 'Value cannot be less than the default quantity for this unit.',
  max: `Units Per Bulk Pack cannot exceed ${MAX_PACK_SIZE}.`,
  dozenExact: 'Dozen pack must contain exactly 12 units.',
  dozenHelper: '1 Dozen = 12 Units (Fixed)',
};

export function isDozenBulkUnit(bulkUnit) {
  return bulkUnit === 'Dozen';
}

export function isPackSizeReadOnly(bulkUnit) {
  return isDozenBulkUnit(bulkUnit);
}

export function getDefaultPackSize(bulkUnit) {
  return UNIT_DEFAULT_PACK_SIZES[bulkUnit] || 6;
}

/** Returns the default pack size to set when bulk unit type changes. */
export function resolvePackSizeForBulkUnit(bulkUnit) {
  return UNIT_DEFAULT_PACK_SIZES[bulkUnit] || 6;
}

/** Normalize pack size when loading existing product data into the form. */
export function normalizeLoadedPackSize(bulkUnit, packSize) {
  if (isDozenBulkUnit(bulkUnit)) return DOZEN_PACK_SIZE;
  const parsed = Number(packSize);
  const defaultVal = getDefaultPackSize(bulkUnit);
  if (!Number.isFinite(parsed) || parsed < defaultVal) return defaultVal;
  return parsed;
}

/**
 * Validate bulk packaging fields.
 * @returns {{ valid: boolean, packSizeError?: string, normalizedPackSize?: number }}
 */
export function validateBulkPackaging(bulkUnit, packSize) {
  if (packSize === '' || packSize === null || packSize === undefined) {
    return { valid: false, packSizeError: BULK_PACK_MESSAGES.required };
  }

  const parsed = Number(packSize);
  if (!Number.isFinite(parsed)) {
    return { valid: false, packSizeError: BULK_PACK_MESSAGES.required };
  }

  if (isDozenBulkUnit(bulkUnit)) {
    if (parsed !== DOZEN_PACK_SIZE) {
      return { valid: false, packSizeError: BULK_PACK_MESSAGES.dozenExact };
    }
    return { valid: true, normalizedPackSize: DOZEN_PACK_SIZE };
  }

  const defaultMin = getDefaultPackSize(bulkUnit);
  if (parsed < defaultMin) {
    return { valid: false, packSizeError: BULK_PACK_MESSAGES.minDefault };
  }

  if (parsed > MAX_PACK_SIZE) {
    return { valid: false, packSizeError: BULK_PACK_MESSAGES.max };
  }

  return { valid: true, normalizedPackSize: parsed };
}
