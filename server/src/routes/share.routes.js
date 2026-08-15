const express = require('express');
const router = express.Router();

const shareController = require('../controllers/share.controller');
const { validate } = require('../middlewares/validate.middleware');
const { createShareSchema, getShareSchema } = require('../validators/share.validator');
const { optionalAuth } = require('../middlewares/auth.middleware');

// POST /api/shares - Create a share link
router.post('/', optionalAuth, validate(createShareSchema), shareController.createShare);

// GET /api/shares/:code - Get public metadata of a share
router.get('/:code', validate(getShareSchema, 'params'), shareController.getShare);

// GET /api/shares/:code/download - Fetch download URL as JSON response
router.get('/:code/download', validate(getShareSchema, 'params'), shareController.downloadShare);

// GET /api/shares/:code/redirect - HTTP 302 redirect directly to Cloudinary
// This is the preferred method for browsers — preserves correct MIME types
router.get('/:code/redirect', validate(getShareSchema, 'params'), shareController.redirectDownload);

module.exports = router;

