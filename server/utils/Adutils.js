// utils/adUtils.js

const MAX_ATTEMPTS_PER_AD = process.env.MAX_ATTEMPTS_PER_AD
  ? parseInt(process.env.MAX_ATTEMPTS_PER_AD)
  : 3; // default fallback

// Helper: can user retry ad creation?
const canRetryAd = (attemptDoc) => {
  if (!attemptDoc) return true;
  return attemptDoc.attemptCount < MAX_ATTEMPTS_PER_AD;
};

module.exports = { canRetryAd };