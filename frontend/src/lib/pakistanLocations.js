export const CITY_PROVINCE_MISMATCH_ERROR =
  'Selected city does not belong to the selected province or region.';

export const LOCATION_VERIFIED_MESSAGE = 'Location verified';

export const LEGACY_PROVINCE_ALIASES = {
  KPK: 'Khyber Pakhtunkhwa',
  'Azad Kashmir': 'Azad Jammu & Kashmir',
  'Gilgit-Baltistan': 'Gilgit Baltistan',
  AJK: 'Azad Jammu & Kashmir',
};

export const PROVINCE_CITIES_MAP = {
  Punjab: [
    'Lahore', 'Rawalpindi', 'Faisalabad', 'Multan', 'Sialkot', 'Gujranwala', 'Bahawalpur',
    'Sargodha', 'Gujrat', 'Jhelum', 'Attock', 'Chakwal', 'Kasur', 'Okara', 'Rahim Yar Khan',
    'Dera Ghazi Khan', 'Mianwali', 'Sheikhupura', 'Jhang', 'Sahiwal', 'Wah Cantt', 'Chiniot',
    'Kamoke', 'Muridke', 'Pakpattan', 'Vehari', 'Khanewal', 'Lodhran', 'Narowal', 'Hafizabad',
    'Burewala', 'Khanpur', 'Gojra', 'Mandi Bahauddin', 'Bhakkar', 'Khushab', 'Layyah',
    'Muzaffargarh', 'Rajanpur', 'Bahawalnagar', 'Toba Tek Singh', 'Jaranwala', 'Daska',
    'Wazirabad', 'Talagang', 'Hasilpur', 'Ahmadpur East', 'Taxila', 'Chichawatni',
    'Jalalpur Jattan', 'Jampur', 'Haroonabad', 'Pattoki', 'Kot Addu', 'Kharian', 'Fort Abbas',
    'Chishtian', 'Arifwala', 'Bhalwal', 'Samundri', 'Shakargarh', 'Kabirwala', 'Dina',
    'Pind Dadan Khan', 'Mian Channu', 'Bhera', 'Pasrur', 'Sadiqabad', 'Kamalia', 'Zafarwal',
    'Jatoi', 'Mailsi', 'Taunsa', 'Leiah', 'Kundian', 'Hujra Shah Muqim', 'Dipalpur',
    'Farooqabad', 'Renala Khurd', 'Gujranwala Cantt', 'Sialkot Cantt', 'Sambrial', 'Shujabad',
    'Mian Channun', 'Nankana Sahib', 'Phalia', 'Baddomalhi', 'Dunyapur',
  ],
  Sindh: [
    'Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpur Khas', 'Jacobabad',
    'Thatta', 'Badin', 'Shikarpur', 'Khairpur', 'Ghotki', 'Sanghar', 'Umerkot', 'Dadu',
    'Kamber', 'Shahdadkot', 'Matiari', 'Tando Allahyar', 'Tando Muhammad Khan', 'Jamshoro',
    'Kotri', 'Sehwan', 'Moro', 'Naushahro Feroze', 'Kandhkot', 'Ratodero', 'Hala', 'Mithi',
    'Digri', 'Kunri', 'Mirpur Bathoro', 'Gambat', 'Rohri', 'Shahdadpur', 'Mehrabpur',
  ],
  'Khyber Pakhtunkhwa': [
    'Peshawar', 'Abbottabad', 'Mardan', 'Swat', 'Kohat', 'Bannu', 'Dera Ismail Khan',
    'Mansehra', 'Swabi', 'Nowshera', 'Charsadda', 'Haripur', 'Timergara', 'Tank', 'Hangu',
    'Lakki Marwat', 'Batkhela', 'Mingora', 'Chitral', 'Dir', 'Parachinar', 'Buner',
    'Shangla', 'Malakand', 'Karak', 'Bannu Cantt', 'Kohat Cantt', 'Dera Ismail Khan Cantt',
    'Topi', 'Jehangira', 'Pabbi', 'Takht Bhai', 'Landi Kotal', 'Jamrud', 'Wana', 'Miranshah',
  ],
  Balochistan: [
    'Quetta', 'Gwadar', 'Khuzdar', 'Turbat', 'Sibi', 'Zhob', 'Loralai', 'Chaman',
    'Dera Murad Jamali', 'Hub', 'Panjgur', 'Kalat', 'Mastung', 'Nushki', 'Chagai',
    'Dalbandin', 'Usta Muhammad', 'Gaddani', 'Pasni', 'Ormara', 'Jiwani', 'Awaran',
    'Lasbela', 'Uthal', 'Bela', 'Muslim Bagh', 'Qila Saifullah', 'Kharan', 'Washuk',
  ],
  'Azad Jammu & Kashmir': [
    'Muzaffarabad', 'Mirpur', 'Kotli', 'Rawalakot', 'Palandri', 'Hajira', 'Trarkhel', 'Bagh',
    'Bhimber', 'Forward Kahuta', 'Hattian Bala', 'Athmuqam', 'Dadyal', 'Chakswari', 'Sehnsa',
    'Samahni', 'Plandri', 'Thorar', 'Kel', 'Sharda', 'Neelum', 'Hattian', 'Charhoi',
    'Khuiratta', 'Nakyal', 'Mangla', 'Chakothi', 'Garhi Dupatta', 'Dheerkot', 'Tarar Khal',
  ],
  'Gilgit Baltistan': [
    'Gilgit', 'Skardu', 'Hunza', 'Diamer', 'Ghizer', 'Astore', 'Ghanche', 'Nagar',
    'Khaplu', 'Chilas', 'Gahkuch', 'Yasin', 'Ishkoman', 'Gupis', 'Aliabad', 'Karimabad',
    'Passu', 'Sost', 'Juglot', 'Shigar', 'Roundu', 'Tolti', 'Eidgah', 'Gahkuch Bala',
  ],
  'Islamabad Capital Territory': ['Islamabad'],
};

export const PAKISTAN_PROVINCES = Object.keys(PROVINCE_CITIES_MAP);

export const CITY_PROVINCE_MAP = Object.entries(PROVINCE_CITIES_MAP).reduce((acc, [province, cities]) => {
  cities.forEach((city) => {
    acc[city] = province;
  });
  return acc;
}, {});

function cleanText(value) {
  if (value == null) return '';
  return String(value).replace(/\0/g, '').trim().replace(/\s+/g, ' ');
}

export function normalizeProvince(value) {
  const province = cleanText(value);
  return LEGACY_PROVINCE_ALIASES[province] || province;
}

export function getCitiesForProvince(province) {
  const cleaned = normalizeProvince(province);
  if (!cleaned || !PROVINCE_CITIES_MAP[cleaned]) return [];
  return [...PROVINCE_CITIES_MAP[cleaned]].sort((a, b) => a.localeCompare(b));
}

export function getAllPakistanCities() {
  return Object.keys(CITY_PROVINCE_MAP).sort((a, b) => a.localeCompare(b));
}

export function findCityMatch(city) {
  const cleaned = cleanText(city);
  if (!cleaned) return '';
  const match = Object.keys(CITY_PROVINCE_MAP).find(
    (known) => known.toLowerCase() === cleaned.toLowerCase()
  );
  return match || '';
}

export function getProvinceForCity(city) {
  const match = findCityMatch(city);
  return match ? CITY_PROVINCE_MAP[match] : '';
}

export function isCityInProvince(city, province) {
  const matchedCity = findCityMatch(city);
  if (!matchedCity) return false;
  const cleanedProvince = normalizeProvince(province);
  return CITY_PROVINCE_MAP[matchedCity] === cleanedProvince;
}

export function isRecognizedCity(city) {
  return Boolean(findCityMatch(city));
}

export function filterCitiesBySearch(cities, searchTerm) {
  const query = cleanText(searchTerm).toLowerCase();
  if (!query) return cities;
  return cities.filter((city) => city.toLowerCase().includes(query));
}

export function validateCityProvinceRelationship(city, province) {
  const cleanedCity = cleanText(city);
  const cleanedProvince = normalizeProvince(province);

  if (!cleanedProvince) {
    return cleanedCity ? 'Please select a province first.' : '';
  }

  if (!cleanedCity) {
    return '';
  }

  const matchedCity = findCityMatch(cleanedCity);
  if (!matchedCity) {
    const provinceCities = getCitiesForProvince(cleanedProvince);
    if (provinceCities.length > 0) {
      return `'${cleanedCity}' is not a recognized city for ${cleanedProvince}. Please select from the list.`;
    }
    return 'Please enter a valid city name.';
  }

  if (CITY_PROVINCE_MAP[matchedCity] !== cleanedProvince) {
    return CITY_PROVINCE_MISMATCH_ERROR;
  }

  return '';
}

export function isLocationVerified(city, province) {
  return (
    Boolean(cleanText(city)) &&
    Boolean(normalizeProvince(province)) &&
    validateCityProvinceRelationship(city, province) === ''
  );
}
