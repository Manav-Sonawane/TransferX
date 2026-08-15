const cloudinary = require('../config/cloudinary');

/**
 * Generate a Cloudinary download URL that forces the browser to save the file.
 *
 * Uses fl_attachment transformation to force download (not inline viewing).
 * Uses signed URLs with 10-minute expiry for security.
 *
 * @param {Object} file - MongoDB file document
 *   Expected: { publicId, resourceType, format, originalName }
 * @returns {string} Cloudinary download URL
 */
const generateDownloadUrl = (file) => {
    const options = {
        resource_type: file.resourceType,
        secure: true,
        // Sign the URL so Cloudinary serves it regardless of account delivery restrictions.
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        // Force download via fl_attachment transformation
        flags: 'attachment',
    };

    // Pin the format so Cloudinary doesn't transcode images/videos on download.
    // Raw files shouldn't have a format in the URL builder because it's baked into their publicId.
    if (file.resourceType !== 'raw' && file.format) {
        options.format = file.format;
    }

    return cloudinary.url(file.publicId, options);
};

module.exports = { generateDownloadUrl };

