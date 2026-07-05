import { getApiBaseUrl } from '@/lib/api';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function parseResponse(res) {
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export async function fetchAdPlans(category = null) {
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/plans${qs}`);
  return parseResponse(res);
}

export async function fetchPricingCenter() {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/admin/pricing/center`, { headers: getAuthHeaders() });
  return parseResponse(res);
}

export async function updatePlanPrice(slug, payload) {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/admin/pricing/plans/${slug}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function fetchAdminDiscounts() {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/admin/pricing/discounts`, { headers: getAuthHeaders() });
  return parseResponse(res);
}

export async function createAdDiscount(payload) {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/admin/pricing/discounts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function updateAdDiscount(id, payload) {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/admin/pricing/discounts/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function toggleAdDiscount(id) {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/admin/pricing/discounts/${id}/toggle`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return parseResponse(res);
}

export async function fetchPricingHistory(limit = 50) {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/admin/pricing/history?limit=${limit}`, { headers: getAuthHeaders() });
  return parseResponse(res);
}

export async function fetchMyCampaigns() {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/mine`, { headers: getAuthHeaders() });
  return parseResponse(res);
}

export async function fetchBillingHistory() {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/billing/history`, { headers: getAuthHeaders() });
  return parseResponse(res);
}

export async function createCampaign(payload) {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function payCampaign(id, paymentMethod = 'platform_wallet') {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/${id}/pay`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ paymentMethod }),
  });
  return parseResponse(res);
}

export async function pauseCampaign(id) {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/${id}/pause`, { method: 'POST', headers: getAuthHeaders() });
  return parseResponse(res);
}

export async function resumeCampaign(id) {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/${id}/resume`, { method: 'POST', headers: getAuthHeaders() });
  return parseResponse(res);
}

export async function cancelCampaign(id) {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/${id}/cancel`, { method: 'POST', headers: getAuthHeaders() });
  return parseResponse(res);
}

export async function deleteCampaign(id) {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  return parseResponse(res);
}

export async function duplicateCampaign(id) {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/${id}/duplicate`, { method: 'POST', headers: getAuthHeaders() });
  return parseResponse(res);
}

export async function fetchCampaignAnalytics(id, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/${id}/analytics?${qs}`, { headers: getAuthHeaders() });
  return parseResponse(res);
}

export async function fetchSponsoredProducts(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const headers = getAuthHeaders();
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/sponsored?${qs}`, { headers });
  return parseResponse(res);
}

export async function fetchRecommendedSponsored(limit = 5) {
  const headers = getAuthHeaders();
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/recommended?limit=${limit}`, { headers });
  return parseResponse(res);
}

export async function trackAdEvent(id, event, body = {}) {
  const headers = getAuthHeaders();
  await fetch(`${getApiBaseUrl()}/api/advertisements/${id}/track/${event}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }).catch(() => {});
}

export async function fetchAdminAdOverview() {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/admin/overview`, { headers: getAuthHeaders() });
  return parseResponse(res);
}

export async function fetchAdminRevenueAnalytics() {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/admin/revenue/analytics`, { headers: getAuthHeaders() });
  return parseResponse(res);
}

export async function fetchAdminAdTransactions(status = 'all', limit = 100) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (status !== 'all') params.set('status', status);
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/admin/revenue/transactions?${params}`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(res);
}

export async function fetchAdminCampaigns(status = 'all') {
  const qs = status !== 'all' ? `?status=${status}` : '';
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/admin/campaigns${qs}`, { headers: getAuthHeaders() });
  return parseResponse(res);
}

export async function approveCampaign(id) {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/${id}/approve`, { method: 'POST', headers: getAuthHeaders() });
  return parseResponse(res);
}

export async function rejectCampaign(id, reason) {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/${id}/reject`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });
  return parseResponse(res);
}

export async function expireCampaign(id) {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/${id}/expire`, { method: 'POST', headers: getAuthHeaders() });
  return parseResponse(res);
}

export async function extendCampaign(id, payload = {}) {
  const res = await fetch(`${getApiBaseUrl()}/api/advertisements/${id}/extend`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export function mapSponsoredItem(item) {
  const product = item.product || item.productId;
  const manufacturer = item.manufacturer || item.manufacturerId;
  return {
    id: product?._id || item.productId,
    adId: item._id || item.advertisementId,
    name: product?.name || 'Product',
    image: product?.image || product?.images?.[0] || null,
    customMedia: item.customMedia || null,
    supplier: manufacturer?.name || 'Manufacturer',
    sellerId: manufacturer?._id,
    location: manufacturer?.city || manufacturer?.businessDetails?.city || 'Pakistan',
    country: manufacturer?.country || manufacturer?.businessDetails?.country || 'Pakistan',
    moq: product?.minimumOrderQuantity || 1,
    price: product?.price || 0,
    bulkUnit: product?.bulkUnit || 'Pack',
    packSize: product?.packSize || 12,
    category: product?.category || 'General',
    verified: manufacturer?.verified ?? manufacturer?.verificationStatus === 'verified',
    sponsored: true,
    rankScore: item.rankScore,
    sellerRole: manufacturer?.role || 'manufacturer'
  };
}
