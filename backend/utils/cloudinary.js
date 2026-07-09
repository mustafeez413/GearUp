const cloudinary = require('cloudinary').v2;

// Configure Cloudinary using existing environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a file buffer to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer from multer memoryStorage
 * @param {string} folder - Target folder in Cloudinary
 * @returns {Promise<object>} Cloudinary upload response object
 */
const uploadToCloudinary = (fileBuffer, folder = 'gearup') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folder, resource_type: 'auto' },
      (error, result) => {
        if (error) {
          console.error('[CLOUDINARY] Upload stream error:', error);
          return reject(error);
        }
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

/**
 * Extracts the public ID from a Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} The public ID or null
 */
const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('res.cloudinary.com')) return null;

  const parts = url.split('/upload/');
  if (parts.length < 2) return null;

  const afterUpload = parts[1];
  const pathParts = afterUpload.split('/');
  
  // Remove version prefix if exists (e.g. 'v12345678/')
  if (pathParts[0].startsWith('v') && !isNaN(pathParts[0].substring(1))) {
    pathParts.shift();
  }

  const pathWithoutVersion = pathParts.join('/');
  const lastDotIndex = pathWithoutVersion.lastIndexOf('.');
  if (lastDotIndex !== -1) {
    return pathWithoutVersion.substring(0, lastDotIndex);
  }
  return pathWithoutVersion;
};

/**
 * Extracts the resource type from a Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} 'image', 'video', or 'raw'
 */
const getResourceTypeFromUrl = (url) => {
  if (!url || typeof url !== 'string') return 'image';
  if (url.includes('/video/upload/')) return 'video';
  if (url.includes('/raw/upload/')) return 'raw';
  return 'image';
};

/**
 * Deletes a file from Cloudinary given its URL
 * @param {string} url - The full Cloudinary URL
 * @returns {Promise<object|null>} Cloudinary destruction result or null
 */
const deleteFromUrl = async (url) => {
  try {
    const publicId = getPublicIdFromUrl(url);
    if (!publicId) {
      console.log('[CLOUDINARY] Non-Cloudinary or invalid URL, skipping deletion:', url);
      return null;
    }
    const resourceType = getResourceTypeFromUrl(url);
    console.log(`[CLOUDINARY] Deleting resource: ${publicId} (${resourceType})`);
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    console.error('[CLOUDINARY] Failed to delete from Cloudinary:', error.message);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  getPublicIdFromUrl,
  getResourceTypeFromUrl,
  deleteFromUrl
};
