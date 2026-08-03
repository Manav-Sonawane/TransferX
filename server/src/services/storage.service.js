const cloudinary = require('../config/cloudinary');

/**
 * Generate download URL for a file using the Cloudinary SDK
 * @param {Object} file - The file document from MongoDB
 * @returns {string} The downloadable URL
 */
const generateDownloadUrl = (file) => {
    const options = {
        resource_type: file.resourceType,
        secure: true,
        flags: 'attachment',
    };

    if (file.resourceType !== 'raw') {
        options.format = file.format;
    }

    return cloudinary.url(file.publicId, options);
};

module.exports = {
    generateDownloadUrl,
};
