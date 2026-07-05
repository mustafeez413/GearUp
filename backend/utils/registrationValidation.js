const {
  CITY_PROVINCE_MAP,
  RECOGNIZED_PROVINCES,
  getCitiesForProvince,
  normalizeProvince,
} = require('./pakistanLocations');

const FULL_NAME_REGEX = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const BUSINESS_NAME_REGEX = /^[A-Za-z0-9]+(?:[ A-Za-z0-9]+)*$/;
const CITY_REGEX = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
const PHONE_LOCAL_REGEX = /^03[0-9]{9}$/;
const PHONE_INTL_REGEX = /^\+923[0-9]{9}$/;
const SHOP_NUMBER_FORMAT_REGEX = /^[A-Za-z0-9#./\-\s]+$/;
const SHOP_PREFIX_REGEX = /^(?:Shop|House|Office|Block|Plot|Building|Flat|Unit|H\.?\s*No\.?)/i;
const STREET_FORMAT_REGEX = /^[A-Za-z0-9][A-Za-z0-9\s\-'.,#/]*$/;
const STREET_INDICATOR_REGEX = /\b(street|st|road|rd|lane|ln|avenue|ave|boulevard|blvd|market|bazaar|highway|hwy|drive|dr|way|circle|chowk|phase|sector|block)\b/i;

const KEYBOARD_SEQUENCES = [
  'qwertyuiop',
  'poiuytrewq',
  'asdfghjkl',
  'lkjhgfdsa',
  'zxcvbnm',
  'mnbvcxz',
  'qwerty',
  'asdfgh',
  'zxcvbn',
  'qazwsx',
  'wsxedc',
  'jsoifjoie',
  'sjvsiop',
];

const DANGEROUS_PATTERNS = [
  /<script\b/i,
  /<\/script>/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /<\/?\w+/i,
  /(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b)\b.*\b(FROM|TABLE|INTO)\b/i,
];

const ERRORS = {
  name: 'Please enter a valid full name.',
  email: 'Please enter a valid email address.',
  password: 'Password must contain uppercase, lowercase, number and special character.',
  confirmPassword: 'Passwords do not match.',
  businessName: 'Please enter a valid business name.',
  phone: 'Please enter a valid Pakistani phone number.',
  shopNumber: 'Please enter a valid shop, house, office, or building number.',
  street: 'Please enter a valid street or road name.',
  area: 'Please enter a valid area or sector.',
  city: 'Please enter a valid city name.',
  province: 'Please select a province.',
  provinceFirst: 'Please select a province first.',
  cityProvinceMismatch: 'Selected city does not belong to the selected province or region.',
  role: 'Please select a business role.',
  agreedToTerms: 'You must agree to the Terms & Conditions.',
  security: 'Invalid characters detected. Please remove scripts or special symbols.',
  addressInvalid: 'This address does not appear to be valid.',
};

function containsDangerousInput(value) {
  if (value == null || value === '') return false;
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(String(value)));
}

function sanitizeText(value) {
  if (value == null) return '';
  return String(value).replace(/\0/g, '').trim().replace(/\s+/g, ' ');
}

function normalizeEmail(value) {
  return sanitizeText(value).toLowerCase();
}

function normalizePhoneInput(value) {
  if (value == null) return '';
  let cleaned = String(value).replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = `+${cleaned.slice(1).replace(/\+/g, '')}`;
  }
  return cleaned;
}

function isGarbageInput(value) {
  const text = sanitizeText(value);
  if (!text) return false;

  if (/^[^a-zA-Z0-9]+$/.test(text)) return true;

  const alpha = text.toLowerCase().replace(/[^a-z]/g, '');
  if (alpha.length >= 4) {
    if (/^(.)\1{3,}$/.test(alpha)) return true;

    for (const seq of KEYBOARD_SEQUENCES) {
      if (alpha.includes(seq)) return true;
    }

    if (alpha.length >= 8) {
      const vowels = (alpha.match(/[aeiou]/g) || []).length;
      if (vowels / alpha.length < 0.15) return true;
    }

    if (alpha.length >= 10 && !/\d/.test(text) && !SHOP_PREFIX_REGEX.test(text) && !STREET_INDICATOR_REGEX.test(text)) {
      const words = text.split(/\s+/).filter(Boolean);
      if (words.length <= 1) return true;
    }
  }

  const lowered = text.toLowerCase();
  if (['qwertyuiop', 'asdfghjkl', 'zxcvbnm', 'qwerty', 'asdfgh', 'zxcvbn'].includes(lowered)) {
    return true;
  }

  return false;
}

function validateFullName(value) {
  const name = sanitizeText(value);
  if (!name || name.length < 3 || name.length > 50 || !FULL_NAME_REGEX.test(name)) {
    return ERRORS.name;
  }
  if (containsDangerousInput(name)) return ERRORS.security;
  return '';
}

function validateEmail(value) {
  const email = normalizeEmail(value);
  if (!email || !EMAIL_REGEX.test(email) || email.length > 254) {
    return ERRORS.email;
  }
  if (containsDangerousInput(email)) return ERRORS.security;
  return '';
}

function validatePassword(value) {
  const password = String(value || '');
  if (
    password.length < 8 ||
    password.length > 50 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    return ERRORS.password;
  }
  if (containsDangerousInput(password)) return ERRORS.security;
  return '';
}

function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword || password !== confirmPassword) return ERRORS.confirmPassword;
  return '';
}

function validateBusinessName(value) {
  const businessName = sanitizeText(value);
  if (
    !businessName ||
    businessName.length < 3 ||
    businessName.length > 100 ||
    !BUSINESS_NAME_REGEX.test(businessName) ||
    !/[A-Za-z0-9]/.test(businessName)
  ) {
    return ERRORS.businessName;
  }
  if (containsDangerousInput(businessName)) return ERRORS.security;
  return '';
}

function validatePhone(value) {
  const phone = normalizePhoneInput(value);
  if (!phone || (!PHONE_LOCAL_REGEX.test(phone) && !PHONE_INTL_REGEX.test(phone))) {
    return ERRORS.phone;
  }
  return '';
}

function validateShopNumber(value) {
  const shopNumber = sanitizeText(value);
  if (!shopNumber || shopNumber.length < 2 || shopNumber.length > 50) {
    return ERRORS.shopNumber;
  }
  if (!SHOP_NUMBER_FORMAT_REGEX.test(shopNumber)) {
    return ERRORS.shopNumber;
  }
  if (containsDangerousInput(shopNumber)) return ERRORS.security;
  if (isGarbageInput(shopNumber)) return ERRORS.addressInvalid;

  const hasDigit = /\d/.test(shopNumber);
  const hasPrefix = SHOP_PREFIX_REGEX.test(shopNumber);
  const isSimpleNumber = /^[0-9]+[A-Za-z\-]?$/.test(shopNumber);

  if (!hasDigit && !hasPrefix && !isSimpleNumber) {
    return ERRORS.shopNumber;
  }

  if (/^[A-Za-z]+$/.test(shopNumber.replace(/\s/g, '')) && shopNumber.replace(/\s/g, '').length >= 8) {
    return ERRORS.addressInvalid;
  }

  return '';
}

function validateStreet(value) {
  const street = sanitizeText(value);
  if (!street || street.length < 3 || street.length > 100) {
    return ERRORS.street;
  }
  if (!STREET_FORMAT_REGEX.test(street) || !/[A-Za-z]{2,}/.test(street)) {
    return ERRORS.street;
  }
  if (containsDangerousInput(street)) return ERRORS.security;
  if (isGarbageInput(street)) return ERRORS.addressInvalid;

  const words = street.split(/\s+/).filter(Boolean);
  const hasIndicator = STREET_INDICATOR_REGEX.test(street);
  const isStreetNumber = /^Street\s+\d+$/i.test(street);

  if (!hasIndicator && !isStreetNumber && words.length < 2) {
    return ERRORS.street;
  }

  return '';
}

function validateArea(value) {
  const area = sanitizeText(value);
  if (!area || area.length < 2 || area.length > 100) {
    return ERRORS.area;
  }
  if (containsDangerousInput(area)) return ERRORS.security;
  return '';
}

function validateCityProvinceMatch(city, province) {
  const cleanedCity = sanitizeText(city);
  const cleanedProvince = normalizeProvince(province);
  if (!cleanedCity || !cleanedProvince) return '';

  const match = Object.keys(CITY_PROVINCE_MAP).find(
    (known) => known.toLowerCase() === cleanedCity.toLowerCase()
  );
  if (!match) return '';

  if (CITY_PROVINCE_MAP[match] !== cleanedProvince) {
    return ERRORS.cityProvinceMismatch;
  }
  return '';
}

function validateCity(value, province = '') {
  const city = sanitizeText(value);
  const cleanedProvince = normalizeProvince(province);

  if (!cleanedProvince) {
    if (city) return ERRORS.provinceFirst;
    return ERRORS.city;
  }

  if (!city || city.length < 2 || city.length > 50 || !CITY_REGEX.test(city)) {
    return ERRORS.city;
  }
  if (containsDangerousInput(city)) return ERRORS.security;

  const provinceCities = getCitiesForProvince(cleanedProvince);
  const cityKnown = provinceCities.some((known) => known.toLowerCase() === city.toLowerCase());
  if (!cityKnown) {
    const knownGlobally = Object.keys(CITY_PROVINCE_MAP).find(
      (known) => known.toLowerCase() === city.toLowerCase()
    );
    if (knownGlobally) {
      return ERRORS.cityProvinceMismatch;
    }
    return `'${city}' is not a recognized city for ${cleanedProvince}. Please select from the list.`;
  }
  return '';
}

function validateProvince(value) {
  const province = normalizeProvince(value);
  if (!province || !RECOGNIZED_PROVINCES.includes(province)) {
    return ERRORS.province;
  }
  return '';
}

function validateRole(value) {
  if (value !== 'manufacturer' && value !== 'wholesaler') {
    return ERRORS.role;
  }
  return '';
}

function validateAgreedToTerms(agreed, role) {
  const accepted = agreed === true || agreed === 'true';
  if ((role === 'manufacturer' || role === 'wholesaler') && !accepted) {
    return ERRORS.agreedToTerms;
  }
  return '';
}

function sanitizeRegistrationPayload(body) {
  const province = normalizeProvince(body.province);
  return {
    name: sanitizeText(body.name),
    email: normalizeEmail(body.email),
    password: String(body.password || ''),
    confirmPassword: String(body.confirmPassword || ''),
    role: body.role,
    businessName: sanitizeText(body.businessName),
    phone: normalizePhoneInput(body.phone),
    shopNumber: sanitizeText(body.shopNumber),
    street: sanitizeText(body.street),
    area: sanitizeText(body.area),
    city: sanitizeText(body.city),
    province,
    agreedToTerms: body.agreedToTerms === true || body.agreedToTerms === 'true',
  };
}

function validateRegistrationPayload(body) {
  const sanitized = sanitizeRegistrationPayload(body);
  const checks = [
    ['name', validateFullName(sanitized.name)],
    ['email', validateEmail(sanitized.email)],
    ['password', validatePassword(sanitized.password)],
    ['confirmPassword', validateConfirmPassword(sanitized.password, sanitized.confirmPassword)],
    ['businessName', validateBusinessName(sanitized.businessName)],
    ['phone', validatePhone(sanitized.phone)],
    ['shopNumber', validateShopNumber(sanitized.shopNumber)],
    ['street', validateStreet(sanitized.street)],
    ['area', validateArea(sanitized.area)],
    ['province', validateProvince(sanitized.province)],
    ['city', validateCity(sanitized.city, sanitized.province)],
    ['role', validateRole(sanitized.role)],
    ['agreedToTerms', validateAgreedToTerms(sanitized.agreedToTerms, sanitized.role)],
  ];

  const errors = {};
  checks.forEach(([field, message]) => {
    if (message) errors[field] = message;
  });

  if (!errors.city && !errors.province && sanitized.city && sanitized.province) {
    const mismatchError = validateCityProvinceMatch(sanitized.city, sanitized.province);
    if (mismatchError) {
      errors.city = mismatchError;
      errors.province = mismatchError;
    }
  }

  const firstError = Object.values(errors)[0] || null;
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    error: firstError,
    sanitized,
  };
}

module.exports = {
  validateRegistrationPayload,
  sanitizeRegistrationPayload,
  ERRORS,
};
