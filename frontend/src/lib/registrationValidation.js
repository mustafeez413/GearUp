import {
  CITY_PROVINCE_MAP,
  CITY_PROVINCE_MISMATCH_ERROR,
  getCitiesForProvince as getProvinceCities,
  getProvinceForCity as lookupProvinceForCity,
  isLocationVerified as checkLocationVerified,
  LOCATION_VERIFIED_MESSAGE,
  normalizeProvince,
  PAKISTAN_PROVINCES,
  PROVINCE_CITIES_MAP,
  validateCityProvinceRelationship,
} from './pakistanLocations';

export const REGISTRATION_ERRORS = {
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

export {
  CITY_PROVINCE_MAP,
  LOCATION_VERIFIED_MESSAGE,
  PROVINCE_CITIES_MAP,
  PAKISTAN_PROVINCES as REGISTRATION_PROVINCES,
};

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


export function getRegistrationCities() {
  return Object.keys(CITY_PROVINCE_MAP).sort((a, b) => a.localeCompare(b));
}

export function getCitiesForProvince(province) {
  return getProvinceCities(province);
}

export function getProvinceForCity(city) {
  return lookupProvinceForCity(city);
}

export function validateCityProvinceMatch(city, province) {
  const result = validateCityProvinceRelationship(city, province);
  if (result === CITY_PROVINCE_MISMATCH_ERROR) {
    return REGISTRATION_ERRORS.cityProvinceMismatch;
  }
  return '';
}

const DANGEROUS_PATTERNS = [
  /<script\b/i,
  /<\/script>/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /<\/?\w+/i,
  /(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b)\b.*\b(FROM|TABLE|INTO)\b/i,
];


export function isLocationVerified(formData) {
  return checkLocationVerified(formData.city, formData.province);
}

export function isGarbageInput(value) {
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

export function resolveCityLocationErrors(formData) {
  const errors = {};
  const provinceError = validateProvince(formData.province);

  if (provinceError) {
    errors.province = provinceError;
  }

  if (!formData.province) {
    if (formData.city) {
      errors.city = REGISTRATION_ERRORS.provinceFirst;
    }
    return errors;
  }

  const cityError = validateCity(formData.city, formData.province);
  if (cityError) {
    errors.city = cityError;
  }

  if (!cityError && !provinceError && formData.city && formData.province) {
    const mismatchError = validateCityProvinceMatch(formData.city, formData.province);
    if (mismatchError) {
      errors.city = mismatchError;
      errors.province = mismatchError;
    }
  }

  return errors;
}

export function containsDangerousInput(value) {
  if (value == null || value === '') return false;
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(String(value)));
}

export function sanitizeText(value) {
  if (value == null) return '';
  return String(value).replace(/\0/g, '').trim().replace(/\s+/g, ' ');
}

export function normalizeEmail(value) {
  return sanitizeText(value).toLowerCase();
}

export function normalizePhoneInput(value) {
  if (value == null) return '';
  let cleaned = String(value).replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = `+${cleaned.slice(1).replace(/\+/g, '')}`;
  }
  return cleaned;
}

export function validateFullName(value) {
  const name = sanitizeText(value);
  if (!name || name.length < 3 || name.length > 50 || !FULL_NAME_REGEX.test(name)) {
    return REGISTRATION_ERRORS.name;
  }
  if (containsDangerousInput(name)) return REGISTRATION_ERRORS.security;
  return '';
}

export function validateEmail(value) {
  const email = normalizeEmail(value);
  if (!email || !EMAIL_REGEX.test(email) || email.length > 254) {
    return REGISTRATION_ERRORS.email;
  }
  if (containsDangerousInput(email)) return REGISTRATION_ERRORS.security;
  return '';
}

export function validatePassword(value) {
  const password = String(value || '');
  if (
    password.length < 8 ||
    password.length > 50 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    return REGISTRATION_ERRORS.password;
  }
  if (containsDangerousInput(password)) return REGISTRATION_ERRORS.security;
  return '';
}

export function getPasswordStrength(value) {
  const password = String(value || '');
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 3 || password.length < 8) return 'Weak';
  if (score <= 5) return 'Medium';
  return 'Strong';
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return REGISTRATION_ERRORS.confirmPassword;
  if (password !== confirmPassword) return REGISTRATION_ERRORS.confirmPassword;
  return '';
}

export function validateBusinessName(value) {
  const businessName = sanitizeText(value);
  if (
    !businessName ||
    businessName.length < 3 ||
    businessName.length > 100 ||
    !BUSINESS_NAME_REGEX.test(businessName) ||
    !/[A-Za-z0-9]/.test(businessName)
  ) {
    return REGISTRATION_ERRORS.businessName;
  }
  if (containsDangerousInput(businessName)) return REGISTRATION_ERRORS.security;
  return '';
}

export function validatePhone(value) {
  const phone = normalizePhoneInput(value);
  if (!phone || (!PHONE_LOCAL_REGEX.test(phone) && !PHONE_INTL_REGEX.test(phone))) {
    return REGISTRATION_ERRORS.phone;
  }
  return '';
}

export function validateShopNumber(value) {
  const shopNumber = sanitizeText(value);
  if (!shopNumber || shopNumber.length < 2 || shopNumber.length > 50) {
    return REGISTRATION_ERRORS.shopNumber;
  }
  if (!SHOP_NUMBER_FORMAT_REGEX.test(shopNumber)) {
    return REGISTRATION_ERRORS.shopNumber;
  }
  if (containsDangerousInput(shopNumber)) return REGISTRATION_ERRORS.security;
  if (isGarbageInput(shopNumber)) return REGISTRATION_ERRORS.addressInvalid;

  const hasDigit = /\d/.test(shopNumber);
  const hasPrefix = SHOP_PREFIX_REGEX.test(shopNumber);
  const isSimpleNumber = /^[0-9]+[A-Za-z\-]?$/.test(shopNumber);

  if (!hasDigit && !hasPrefix && !isSimpleNumber) {
    return REGISTRATION_ERRORS.shopNumber;
  }

  if (/^[A-Za-z]+$/.test(shopNumber.replace(/\s/g, '')) && shopNumber.replace(/\s/g, '').length >= 8) {
    return REGISTRATION_ERRORS.addressInvalid;
  }

  return '';
}

export function validateStreet(value) {
  const street = sanitizeText(value);
  if (!street || street.length < 3 || street.length > 100) {
    return REGISTRATION_ERRORS.street;
  }
  if (!STREET_FORMAT_REGEX.test(street) || !/[A-Za-z]{2,}/.test(street)) {
    return REGISTRATION_ERRORS.street;
  }
  if (containsDangerousInput(street)) return REGISTRATION_ERRORS.security;
  if (isGarbageInput(street)) return REGISTRATION_ERRORS.addressInvalid;

  const words = street.split(/\s+/).filter(Boolean);
  const hasIndicator = STREET_INDICATOR_REGEX.test(street);
  const isStreetNumber = /^Street\s+\d+$/i.test(street);

  if (!hasIndicator && !isStreetNumber && words.length < 2) {
    return REGISTRATION_ERRORS.street;
  }

  return '';
}

export function validateArea(value) {
  const area = sanitizeText(value);
  if (!area || area.length < 2 || area.length > 100) {
    return REGISTRATION_ERRORS.area;
  }
  if (containsDangerousInput(area)) return REGISTRATION_ERRORS.security;
  return '';
}

export function validateCity(value, province = '') {
  const city = sanitizeText(value);
  const cleanedProvince = normalizeProvince(province);

  if (!cleanedProvince) {
    if (city) return REGISTRATION_ERRORS.provinceFirst;
    return REGISTRATION_ERRORS.city;
  }

  if (!city || city.length < 2 || city.length > 50 || !CITY_REGEX.test(city)) {
    return REGISTRATION_ERRORS.city;
  }
  if (containsDangerousInput(city)) return REGISTRATION_ERRORS.security;

  const relationshipError = validateCityProvinceRelationship(city, cleanedProvince);
  if (relationshipError) {
    if (relationshipError === CITY_PROVINCE_MISMATCH_ERROR) {
      return REGISTRATION_ERRORS.cityProvinceMismatch;
    }
    return relationshipError;
  }

  return '';
}

export function validateProvince(value) {
  const province = normalizeProvince(value);
  if (!province || !PAKISTAN_PROVINCES.includes(province)) {
    return REGISTRATION_ERRORS.province;
  }
  return '';
}

export function validateRole(value) {
  if (value !== 'manufacturer' && value !== 'wholesaler') {
    return REGISTRATION_ERRORS.role;
  }
  return '';
}

export function validateAgreedToTerms(agreed, role) {
  if ((role === 'manufacturer' || role === 'wholesaler') && !agreed) {
    return REGISTRATION_ERRORS.agreedToTerms;
  }
  return '';
}

const FIELD_VALIDATORS = {
  name: (data) => validateFullName(data.name),
  email: (data) => validateEmail(data.email),
  password: (data) => validatePassword(data.password),
  confirmPassword: (data) => validateConfirmPassword(data.password, data.confirmPassword),
  businessName: (data) => validateBusinessName(data.businessName),
  phone: (data) => validatePhone(data.phone),
  shopNumber: (data) => validateShopNumber(data.shopNumber),
  street: (data) => validateStreet(data.street),
  area: (data) => validateArea(data.area),
  city: (data) => validateCity(data.city, data.province),
  province: (data) => validateProvince(data.province),
  role: (data) => validateRole(data.role),
  agreedToTerms: (data) => validateAgreedToTerms(data.agreedToTerms, data.role),
};

export const REGISTRATION_FIELD_ORDER = [
  'role',
  'name',
  'email',
  'password',
  'confirmPassword',
  'businessName',
  'phone',
  'shopNumber',
  'street',
  'area',
  'province',
  'city',
  'agreedToTerms',
];

export function validateRegistrationField(fieldName, formData) {
  const validator = FIELD_VALIDATORS[fieldName];
  return validator ? validator(formData) : '';
}

export function validateRegistrationForm(formData) {
  const errors = {};

  REGISTRATION_FIELD_ORDER.forEach((field) => {
    if (field === 'city' || field === 'province') return;
    const message = validateRegistrationField(field, formData);
    if (message) errors[field] = message;
  });

  Object.assign(errors, resolveCityLocationErrors(formData));

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    sanitized: sanitizeRegistrationPayload(formData),
  };
}

export function sanitizeRegistrationPayload(formData) {
  return {
    name: sanitizeText(formData.name),
    email: normalizeEmail(formData.email),
    password: String(formData.password || ''),
    confirmPassword: String(formData.confirmPassword || ''),
    role: formData.role,
    businessName: sanitizeText(formData.businessName),
    phone: normalizePhoneInput(formData.phone),
    shopNumber: sanitizeText(formData.shopNumber),
    street: sanitizeText(formData.street),
    area: sanitizeText(formData.area),
    city: sanitizeText(formData.city),
    province: normalizeProvince(formData.province),
    agreedToTerms: Boolean(formData.agreedToTerms),
  };
}

export function getFieldBorderClass(fieldName, errors, touched, values) {
  const hasError = Boolean(errors[fieldName]);
  const isTouched = Boolean(touched[fieldName]);
  const hasValue = values[fieldName] !== '' && values[fieldName] != null && values[fieldName] !== false;

  if (hasError && isTouched) {
    return 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500';
  }
  if (isTouched && !hasError && hasValue) {
    return 'border-emerald-400 bg-emerald-50/40 focus:ring-emerald-500 focus:border-emerald-500';
  }
  return 'border-slate-300 focus:ring-emerald-500 focus:border-emerald-500';
}
