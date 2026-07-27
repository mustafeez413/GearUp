/**
 * Centralized Category and Subcategory Definitions & Validation
 */

const CATEGORY_SUBCATEGORIES = {
    'Cricket': [
        'Cricket Bat',
        'Tennis Ball Bat',
        'Cricket Ball',
        'Batting Gloves',
        'Wicket Keeping Gloves',
        'Batting Pads',
        'Helmet',
        'Thigh Pad',
        'Arm Guard',
        'Chest Guard',
        'Abdominal Guard',
        'Cricket Shoes',
        'Stumps',
        'Bails',
        'Kit Bag',
        'Cricket Clothing',
        'Training Equipment',
        'Accessories'
    ],
    'Football': [
        'Football',
        'Goalkeeper Gloves',
        'Football Shoes',
        'Shin Guards',
        'Football Jersey',
        'Football Shorts',
        'Football Socks',
        'Training Bibs',
        'Cones',
        'Agility Ladder',
        'Goal Nets',
        'Pump & Needles',
        'Kit Bag',
        'Captain Armband',
        'Accessories'
    ],
    'Protective Gear': [
        'Helmet',
        'Face Guard',
        'Mouth Guard',
        'Chest Protector',
        'Shoulder Pads',
        'Elbow Pads',
        'Knee Pads',
        'Shin Guards',
        'Arm Guard',
        'Thigh Guard',
        'Wrist Guard',
        'Gloves',
        'Protective Vest',
        'Compression Gear',
        'Accessories'
    ]
};

const DEFAULT_SUBCATEGORIES = [
    'General',
    'Equipment',
    'Apparel',
    'Footwear',
    'Accessories'
];

function getSubcategoriesForCategory(category) {
    if (!category) return [];
    const catTrimmed = String(category).trim();
    // Case-insensitive match against key
    const matchKey = Object.keys(CATEGORY_SUBCATEGORIES).find(
        (key) => key.toLowerCase() === catTrimmed.toLowerCase()
    );
    if (matchKey) {
        return CATEGORY_SUBCATEGORIES[matchKey];
    }
    return DEFAULT_SUBCATEGORIES;
}

function isValidCategorySubcategory(category, subcategory) {
    if (!category || !subcategory) return false;
    const allowed = getSubcategoriesForCategory(category);
    const subTrimmed = String(subcategory).trim().toLowerCase();
    return allowed.some((item) => item.toLowerCase() === subTrimmed);
}

module.exports = {
    CATEGORY_SUBCATEGORIES,
    DEFAULT_SUBCATEGORIES,
    getSubcategoriesForCategory,
    isValidCategorySubcategory
};
