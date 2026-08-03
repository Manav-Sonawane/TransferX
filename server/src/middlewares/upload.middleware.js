const multer = require('multer');
const { AppError } = require('../utils/errors');

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 100 * 1024 * 1024; // 100 MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Optionally restrict some mime types, e.g., executables
    if (file.mimetype === 'application/x-msdownload' || file.mimetype === 'application/exe') {
        return cb(new AppError('Executables are not allowed', 400), false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
    fileFilter,
});

module.exports = upload;
