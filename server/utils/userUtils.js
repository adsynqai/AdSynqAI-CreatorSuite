// utils/userUtils.js
function normalizeUserId(userId) {
  return userId.trim().toLowerCase().replace(/\s+/g, '_');
}
module.exports = { normalizeUserId };