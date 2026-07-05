const PLAN_WEIGHTS = {
  starter: 1,
  growth: 2,
  premium: 3
};

function computeCtr(clicks, impressions) {
  if (!impressions || impressions <= 0) return 0;
  return Number(((clicks / impressions) * 100).toFixed(2));
}

function computeProductQualityScore(product, manufacturer) {
  let score = 0;
  if (product?.images?.length) score += 0.5;
  if (product?.description?.length > 50) score += 0.3;
  if (manufacturer?.verificationStatus === 'verified') score += 0.7;
  if ((product?.stock || 0) > 0) score += 0.5;
  return score;
}

function computeRecentActivity(impressions) {
  return Math.min(2, (impressions || 0) / 5000);
}

/**
 * Ad Score = Package Weight + CTR + Recent Activity + Product Quality Score
 */
function computeAdRankScore(ad, product, manufacturer) {
  const packageWeight = PLAN_WEIGHTS[ad.plan] || 1;
  const ctrComponent = computeCtr(ad.clicks, ad.impressions) / 50;
  const recentActivity = computeRecentActivity(ad.impressions);
  const quality = computeProductQualityScore(product, manufacturer);
  return Number((packageWeight + ctrComponent + recentActivity + quality).toFixed(4));
}

module.exports = {
  PLAN_WEIGHTS,
  computeCtr,
  computeAdRankScore,
  computeProductQualityScore
};
