import { getApiBaseUrl } from '@/lib/api';
import { resolveAvatarUrl as resolveAvatarUrlFromUtils } from '@/lib/avatarUtils';
import { fetchSponsoredProducts } from '@/lib/advertisingApi';
import { formatMoqDisplay } from '@/utils/moq';

export const PRODUCT_PLACEHOLDER = '/images/gearup-product-placeholder.svg';

const HERO_GRADIENTS = [
  'from-slate-950 via-[#0B2C1A] to-slate-950',
  'from-slate-950 via-[#0D223B] to-slate-950',
  'from-slate-950 via-[#27153D] to-slate-950',
];

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isVerifiedManufacturer(user) {
  if (!user) return false;
  return (
    user.verificationStatus === 'approved' ||
    user.verificationStatus === 'verified' ||
    user.businessDetails?.isVerified === true
  );
}

export function resolveProductImageUrl(image) {
  if (!image) return PRODUCT_PLACEHOLDER;
  
  // Handle case where image is an array (e.g. product.images)
  if (Array.isArray(image)) {
    if (image.length === 0 || !image[0]) return PRODUCT_PLACEHOLDER;
    image = image[0];
  }

  // Handle case where image is an object or invalid type
  if (typeof image !== 'string') {
    return PRODUCT_PLACEHOLDER;
  }

  if (image.startsWith('http') || image.startsWith('data:')) return image;
  
  // Next.js public assets — do not prefix with API origin
  if (image.startsWith('/images/')) return image;
  
  // Ensure the image path starts with a slash before prepending API base URL
  const separator = image.startsWith('/') ? '' : '/';
  return `${getApiBaseUrl()}${separator}${image}`;
}

export function resolveAvatarUrl(avatar) {
  return resolveAvatarUrlFromUtils(avatar);
}

function getSellerId(product) {
  return String(product.seller?._id || product.seller || product.manufacturer?._id || product.manufacturer || '');
}

export async function fetchMarketplaceManufacturers({ verified = false, role = 'manufacturer' } = {}) {
  const params = new URLSearchParams();
  if (verified) params.set('verified', 'true');
  if (role) params.set('role', role);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${getApiBaseUrl()}/api/auth/manufacturers${qs}`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load manufacturers');
  return data.data || [];
}

export async function fetchMarketplaceProducts() {
  const res = await fetch(`${getApiBaseUrl()}/api/products`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load products');
  return data.data || [];
}

export async function fetchMarketplaceCategories() {
  const res = await fetch(`${getApiBaseUrl()}/api/products/categories`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load categories');
  return data.data || [];
}

export async function fetchSponsoredManufacturerIds() {
  try {
    const res = await fetchSponsoredProducts({ limit: 50, placement: 'marketplace' });
    const ids = new Set();
    (res.data || []).forEach((item) => {
      const id = item.manufacturer?._id || item.manufacturerId?._id || item.manufacturerId;
      if (id) ids.add(String(id));
    });
    return ids;
  } catch {
    return new Set();
  }
}

export function buildManufacturerProductIndex(products) {
  const byManufacturer = new Map();
  products.forEach((product) => {
    const sellerId = getSellerId(product);
    if (!sellerId) return;
    if (!byManufacturer.has(sellerId)) byManufacturer.set(sellerId, []);
    byManufacturer.get(sellerId).push(product);
  });
  return byManufacturer;
}

export function getManufacturerTopCategory(products = []) {
  if (!products.length) return 'Sports Equipment';
  const counts = {};
  products.forEach((p) => {
    const cat = (p.category || 'General').trim();
    counts[cat] = (counts[cat] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export function getManufacturerMinMoqLabel(products = []) {
  if (!products.length) return 'Contact for MOQ';
  const sorted = [...products].sort(
    (a, b) => (a.minimumOrderQuantity || 1) - (b.minimumOrderQuantity || 1)
  );
  const p = sorted[0];
  return formatMoqDisplay(p.minimumOrderQuantity, p.bulkUnit, p.packSize).compact;
}

export function getManufacturerPreviewImages(products = [], limit = 3) {
  const images = [];
  products.forEach((p) => {
    const raw = p.images?.[0] || p.image;
    if (raw) images.push(resolveProductImageUrl(raw));
  });
  while (images.length < limit) images.push(PRODUCT_PLACEHOLDER);
  return images.slice(0, limit);
}

export function formatJoinedDate(dateValue) {
  if (!dateValue) return 'Recently joined';
  return new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

export function mapManufacturerToFeaturedCard(manufacturer, products = []) {
  const topCategory = getManufacturerTopCategory(products);
  return {
    id: manufacturer._id,
    name: manufacturer.businessDetails?.businessName || manufacturer.name,
    tag: topCategory,
    city: manufacturer.businessDetails?.city || 'Pakistan',
    verified: isVerifiedManufacturer(manufacturer),
    specialization: topCategory,
    moq: getManufacturerMinMoqLabel(products),
    productCount: products.length,
    joinedDate: formatJoinedDate(manufacturer.createdAt),
    avatar: resolveAvatarUrl(manufacturer.avatar),
    images: getManufacturerPreviewImages(products),
  };
}

const PLAN_LABELS = {
  starter: 'Starter Package',
  growth: 'Growth Package',
  premium: 'Premium Package',
};

export function mapSponsoredToHeroSlide(item, index = 0) {
  const product = item.product || item.productId || {};
  const manufacturer = item.manufacturer || item.manufacturerId || {};
  const moq = product.minimumOrderQuantity || 1;
  const bulkUnit = product.bulkUnit || 'Units';
  const category = product.category || 'General';
  const city = manufacturer.city || manufacturer.businessDetails?.city || 'Pakistan';

  return {
    id: String(item._id || item.advertisementId || item.campaignId || index),
    manufacturer: manufacturer.name || 'Manufacturer',
    tagline: product.name || product.description || 'Featured sponsored listing',
    industry: category,
    location: `${city}, Pakistan`,
    moq: formatMoqDisplay(moq, bulkUnit, product.packSize).compact,
    verified: manufacturer.verified ?? isVerifiedManufacturer(manufacturer),
    productImage: resolveProductImageUrl(product.image || product.images?.[0]),
    promoFeature: PLAN_LABELS[item.plan] || `${String(item.plan || 'premium').replace(/^./, (c) => c.toUpperCase())} Package`,
    categoryFilter: category.toLowerCase(),
    gradient: HERO_GRADIENTS[index % HERO_GRADIENTS.length],
    adId: item._id || item.advertisementId,
    manufacturerId: manufacturer._id,
  };
}

export function mapBannerToHeroSlide(banner, index = 0) {
  return {
    id: String(banner._id || index),
    manufacturer: banner.title || 'Featured Partner',
    tagline: banner.link ? 'Explore promoted marketplace listings' : 'Verified B2B sports manufacturing partner',
    industry: 'Sports Equipment',
    location: 'Pakistan',
    moq: 'Contact for MOQ',
    verified: true,
    productImage: resolveProductImageUrl(banner.image),
    promoFeature: 'Platform Promotion',
    categoryFilter: 'all',
    gradient: HERO_GRADIENTS[index % HERO_GRADIENTS.length],
    link: banner.link || null,
  };
}

export async function fetchHeroCarouselSlides() {
  try {
    const featuredRes = await fetchSponsoredProducts({ placement: 'homepage_featured', limit: 6 });
    const featured = (featuredRes.data || []).map((item, i) => mapSponsoredToHeroSlide(item, i));
    if (featured.length) return featured;
  } catch {
    // fall through
  }

  try {
    const sponsoredRes = await fetchSponsoredProducts({ placement: 'marketplace', limit: 6 });
    const sponsored = (sponsoredRes.data || []).map((item, i) => mapSponsoredToHeroSlide(item, i));
    if (sponsored.length) return sponsored;
  } catch {
    // fall through
  }

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/banners`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (data.success && data.data?.length) {
      return data.data.map((banner, i) => mapBannerToHeroSlide(banner, i));
    }
  } catch {
    // fall through
  }

  return [];
}

function scoreManufacturer(manufacturer, products, sponsoredIds, selectedCategory) {
  let score = 0;
  const reasons = [];
  const mfgId = String(manufacturer._id);
  const publishedProducts = products.filter((p) => getSellerId(p) === mfgId && p.status !== 'draft');

  if (selectedCategory && selectedCategory !== 'all') {
    const cat = selectedCategory.toLowerCase();
    const hasCategory = publishedProducts.some((p) => (p.category || '').toLowerCase().includes(cat));
    if (!hasCategory) return null;
  }

  if (isVerifiedManufacturer(manufacturer)) {
    score += 40;
    reasons.push('Verified Manufacturer');
  }
  if (sponsoredIds.has(mfgId)) {
    score += 30;
    reasons.push('Active Advertisement');
  }

  const productCount = publishedProducts.length;
  if (productCount > 0) {
    score += 15;
    reasons.push('Top Selling Category');
  }

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const hasRecentListing = publishedProducts.some((p) => new Date(p.updatedAt || p.createdAt).getTime() >= thirtyDaysAgo);
  if (hasRecentListing) {
    score += 10;
    reasons.push('Recently Updated Catalog');
  }

  const activityDate = manufacturer.updatedAt || manufacturer.verificationReviewedAt || manufacturer.createdAt;
  if (activityDate && new Date(activityDate).getTime() >= thirtyDaysAgo) {
    score += 5;
    reasons.push('Recommended For Sports Equipment');
  }

  if (!reasons.length) {
    reasons.push('Recommended For Sports Equipment');
  }

  const topCategory = getManufacturerTopCategory(publishedProducts);
  return {
    id: mfgId,
    name: manufacturer.businessDetails?.businessName || manufacturer.name,
    specialized: topCategory,
    location: manufacturer.businessDetails?.city || 'Pakistan',
    score,
    reasons,
    verified: isVerifiedManufacturer(manufacturer),
  };
}

export function buildMarketplaceRecommendations(manufacturers, products, sponsoredIds, selectedCategory = 'all') {
  const scored = manufacturers
    .map((mfg) => scoreManufacturer(mfg, products, sponsoredIds, selectedCategory))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (!scored.length) return [];

  const maxScore = scored[0].score || 1;
  return scored.map((item, index) => {
    const normalized = Math.round(84 + (item.score / maxScore) * 14);
    const matchScore = `${Math.max(84, Math.min(98, normalized - index))}%`;
    return {
      id: item.id,
      name: item.name,
      specialized: item.specialized,
      location: item.location,
      matchScore,
      reason: item.reasons[0],
      verified: item.verified,
    };
  });
}

export function normalizeCategoryValue(category) {
  return String(category || '').trim().toLowerCase();
}

export function formatCategoryLabel(category) {
  const value = String(category || '').trim();
  if (!value) return 'General';
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}
