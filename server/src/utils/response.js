/**
 * Standard API Response Helper
 */

/**
 * Send a success response
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {any} data
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
    const response = { success: true, message };
    if (data !== null) response.data = data;
    return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {any} errors
 */
const sendError = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
    const response = { success: false, message };
    if (errors !== null) response.errors = errors;
    return res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };
