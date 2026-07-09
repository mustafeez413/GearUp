const path = require('path');
const multer = require('multer');
const crypto = require('crypto');

const storage = multer.memoryStorage();

// Allowed MIME types
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Allowed: JPG, JPEG, PNG, WEBP'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

module.exports = upload;
