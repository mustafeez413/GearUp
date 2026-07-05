/** Shared bulk packaging rules for product create/edit flows. */

export const BULK_UNIT_OPTIONS = ['Dozen', 'Pack', 'Box', 'Carton', 'Unit Set'];

export const DOZEN_PACK_SIZE = 12;
export const MIN_PACK_SIZE = 1;
export const MAX_PACK_SIZE = 999;

export const BULK_PACK_MESSAGES = {
  required: 'Units Per Bulk Pack is required.',
  min: 'Units Per Bulk Pack must be greater than zero.',
  max: `Units Per Bulk Pack cannot exceed ${MAX_PACK_SIZE}.`,
  dozenExact: 'Dozen pack must contain exactly 12 units.',
  dozenHelper: '1 Dozen = 12 Units',
};

export function isDozenBulkUnit(bulkUnit) {
  return bulkUnit === 'Dozen';
}

export function isPackSizeReadOnly(bulkUnit) {
  return isDozenBulkUnit(bulkUnit);
}

/** Returns the pack size to use when bulk unit type changes. */
export function resolvePackSizeForBulkUnit(bulkUnit, currentPackSize) {
  if (isDozenBulkUnit(bulkUnit)) return DOZEN_PACK_SIZE;
  if (currentPackSize === DOZEN_PACK_SIZE) return MIN_PACK_SIZE;
  return currentPackSize;
}

/** Normalize pack size when loading existing product data into the form. */
export function normalizeLoadedPackSize(bulkUnit, packSize) {
  if (isDozenBulkUnit(bulkUnit)) return DOZEN_PACK_SIZE;
  const parsed = Number(packSize);
  if (!Number.isFinite(parsed)) return '';
  return parsed;
}

/**
 * Validate bulk packaging fields.
 * @returns {{ valid: boolean, packSizeError?: string }}
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

  if (parsed < MIN_PACK_SIZE) {
    return { valid: false, packSizeError: BULK_PACK_MESSAGES.min };
  }

  if (parsed > MAX_PACK_SIZE) {
    return { valid: false, packSizeError: BULK_PACK_MESSAGES.max };
  }

  return { valid: true, normalizedPackSize: parsed };
}
