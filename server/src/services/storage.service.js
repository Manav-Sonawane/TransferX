const cloudinary = require('../config/cloudinary');

/**
 * Generate download URL for a file using the Cloudinary SDK
 * @param {Object} file - The file document from MongoDB
 * @returns {string} The downloadable URL
 */
const generateDownloadUrl = (file) => {
    // Sanitize the filename for use in the Content-Disposition header (remove commas, slashes)
    const safeFileName = (file.originalName || file.fileName || 'download').replace(/[,/\\]/g, '_');

    const options = {
        resource_type: file.resourceType,
        secure: true,
        // Force browser to download instead of opening inline for all types
        flags: `attachment:${safeFileName}`,
    };

    // Non-raw types need the format hint for correct extension in the URL
    if (file.resourceType !== 'raw' && file.format) {
        options.format = file.format;
    }

    return cloudinary.url(file.publicId, options);
};

module.exports = {
    generateDownloadUrl,
};
