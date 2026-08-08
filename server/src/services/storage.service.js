const cloudinary = require('../config/cloudinary');

/**
 * Generate download URL for a file using the Cloudinary SDK
 * @param {Object} file - The file document from MongoDB
 * @returns {string} The downloadable URL
 */
const generateDownloadUrl = (file) => {
    const path = require('path');

    // Strip the extension — Cloudinary's URL parser treats dots inside fl_attachment
    // as format specifiers, causing a 400 Bad Request. Cloudinary appends the
    // correct extension automatically from the stored resource.
    const baseName = path.parse(file.originalName || file.fileName || 'download').name;

    // Replace spaces, commas, slashes and any remaining special chars with underscores
    const safeFileName = baseName.replace(/[\s,/\\:*?"<>|]/g, '_');

    const options = {
        resource_type: file.resourceType,
        secure: true,
        // Force browser to download instead of displaying inline
        flags: `attachment:${safeFileName}`,
    };

    // Non-raw types need the format hint so the URL has the correct extension
    if (file.resourceType !== 'raw' && file.format) {
        options.format = file.format;
    }

    return cloudinary.url(file.publicId, options);
};

module.exports = {
    generateDownloadUrl,
};
