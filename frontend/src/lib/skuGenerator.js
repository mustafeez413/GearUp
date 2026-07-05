/**
 * Product SKU generator
 * Format: {CATEGORY_PREFIX}-{BRAND_CODE}-{PRODUCT_CODE}-{UNIQUE_NUMBER}
 * Example: BAT-CA-15000-1001
 */

export const SKU_FORMAT_EXAMPLE = 'BAT-CA-15000-1001';

export const CATEGORY_SKU_PREFIX = {
  Cricket: 'BAT',
  Football: 'FB',
  'Protective Gear': 'PGR',
  Apparel: 'APP',
  'Training Equipment': 'TRN',
  Accessories: 'ACC',
};

const STOP_WORDS = new Set([
  'pro',
  'grade',
  'premium',
  'professional',
  'official',
  'the',
  'and',
  'for',
  'with',
  'bat',
  'bats',
]);

const SKU_PATTERN = /^([A-Z0-9]+)-([A-Z0-9]+)-([A-Z0-9]+)-(\d+)$/;

export function getCategorySkuPrefix(category) {
  return CATEGORY_SKU_PREFIX[category] || 'PRD';
}

export function brandCodeFromName(brand) {
  const cleaned = String(brand || '')
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '');
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (!words.length) return '';

  if (words[0].length <= 4) {
    return words[0].toUpperCase();
  }

  const compact = cleaned.replace(/\s/g, '').toUpperCase();
  if (compact.length <= 6) return compact;

  if (words.length > 1) {
    return words.map((word) => word[0]).join('').toUpperCase().slice(0, 6);
  }

  return compact.slice(0, 6);
}

export function productCodeFromName(productName) {
  const cleaned = String(productName || '')
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '');
  const words = cleaned.split(/\s+/).filter((word) => word && !STOP_WORDS.has(word.toLowerCase()));

  const numericTokens = words.filter((word) => /\d/.test(word));
  if (numericTokens.length) {
    return numericTokens.sort((a, b) => b.length - a.length)[0].toUpperCase().slice(0, 8);
  }

  if (words.length === 0) {
    const fallback = cleaned.replace(/\s/g, '');
    return fallback ? fallback.toUpperCase().slice(0, 8) : '';
  }

  if (words.length === 1) {
    return words[0].toUpperCase().slice(0, 8);
  }

  return words
    .slice(0, 2)
    .map((word) => word.slice(0, 4))
    .join('')
    .toUpperCase()
    .slice(0, 8);
}

export function generateUniqueSkuSuffix() {
  return String(1001 + Math.floor(Math.random() * 8999));
}

export function buildProductSku({
  category,
  brand,
  productName,
  uniqueSuffix,
  existingSkus = [],
}) {
  const categoryPrefix = getCategorySkuPrefix(category);
  const brandCode = brandCodeFromName(brand);
  const productCode = productCodeFromName(productName);

  if (!brandCode || !productCode) {
    return { sku: '', brandCode: '', productCode: '', categoryPrefix, uniqueSuffix: uniqueSuffix || '' };
  }

  const normalizedExisting = (existingSkus || [])
    .map((sku) => String(sku || '').trim().toUpperCase())
    .filter(Boolean);

  let suffix = uniqueSuffix ? String(uniqueSuffix) : generateUniqueSkuSuffix();
  let sku = `${categoryPrefix}-${brandCode}-${productCode}-${suffix}`.toUpperCase();
  let attempts = 0;

  while (normalizedExisting.includes(sku) && attempts < 100) {
    suffix = generateUniqueSkuSuffix();
    sku = `${categoryPrefix}-${brandCode}-${productCode}-${suffix}`.toUpperCase();
    attempts += 1;
  }

  return {
    sku,
    brandCode,
    productCode,
    categoryPrefix,
    uniqueSuffix: suffix,
  };
}

export function parseProductSku(sku) {
  const match = SKU_PATTERN.exec(String(sku || '').trim().toUpperCase());
  if (!match) return null;

  return {
    categoryPrefix: match[1],
    brandCode: match[2],
    productCode: match[3],
    uniqueSuffix: match[4],
  };
}

export function isSkuTaken(sku, existingSkus = [], excludeSku = '') {
  const normalized = String(sku || '').trim().toUpperCase();
  const excluded = String(excludeSku || '').trim().toUpperCase();
  if (!normalized || normalized === excluded) return false;

  return (existingSkus || []).some(
    (existing) => String(existing || '').trim().toUpperCase() === normalized
  );
}

export function describeSkuPreview({ category, brand, productName, uniqueSuffix, existingSkus = [] }) {
  const built = buildProductSku({ category, brand, productName, uniqueSuffix, existingSkus });
  if (!built.sku) {
    return {
      ...built,
      ready: false,
      message: 'Enter brand and product name to generate SKU preview.',
    };
  }

  return {
    ...built,
    ready: true,
    message: `${built.categoryPrefix} · ${built.brandCode} · ${built.productCode} · ${built.uniqueSuffix}`,
  };
}
