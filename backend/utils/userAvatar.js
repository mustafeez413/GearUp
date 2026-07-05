const AVATAR_FIELD_KEYS = ['avatar', 'profileImage', 'profilePicture', 'image', 'photo'];

function extractAvatar(user) {
  if (!user) return '';
  for (const key of AVATAR_FIELD_KEYS) {
    const value = user[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function normalizeAvatarPath(avatar) {
  if (!avatar || typeof avatar !== 'string') return '';
  const trimmed = avatar.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) return trimmed;
  return trimmed.includes('uploads')
    ? `/${trimmed.replace(/^\/+/, '')}`
    : `/uploads/${trimmed}`;
}

function serializeUserForClient(user) {
  if (!user) return user;
  const plain = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete plain.password;
  delete plain.otp;
  delete plain.otpExpires;
  plain.avatar = normalizeAvatarPath(extractAvatar(plain));
  return plain;
}

module.exports = {
  extractAvatar,
  normalizeAvatarPath,
  serializeUserForClient,
};
