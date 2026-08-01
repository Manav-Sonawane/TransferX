const { AppError } = require('../utils/errors');
const { sendError } = require('../utils/response');

/**
 * Global error handling middleware
 * Must be registered LAST in Express app
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    // Operational errors (our custom AppError subclasses)
    if (err instanceof AppError && err.isOperational) {
        return sendError(res, err.statusCode, err.message, err.errors || null);
    }

    // Mongoose validation errors
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
        return sendError(res, 422, 'Validation failed', errors);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return sendError(res, 409, `${field} already exists`);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return sendError(res, 401, 'Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
        return sendError(res, 401, 'Token expired');
    }

    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 413, 'File size exceeds the allowed limit');
    }

    // Unexpected errors
    console.error('Unexpected Error:', err);
    return sendError(res, 500, 'Internal Server Error');
};

module.exports = { errorHandler };
