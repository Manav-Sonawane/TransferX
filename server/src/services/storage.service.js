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
        // 'attachment' (no filename) forces a browser download without specifying a
        // custom name. Cloudinary uses the public_id's own filename, which already
        // includes the correct extension for raw resources. Avoids all fl_attachment
        // parsing errors caused by dots, spaces, or special characters in filenames.
        flags: 'attachment',
    };

    // For image/video resources, append the correct format extension to the URL
    if (file.resourceType !== 'raw' && file.format) {
        options.format = file.format;
    }

    return cloudinary.url(file.publicId, options);
};

module.exports = {
    generateDownloadUrl,
};
