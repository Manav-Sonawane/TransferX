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

// GET /api/shares/:code/download - Fetch download link/stream of the shared file
router.get('/:code/download', validate(getShareSchema, 'params'), shareController.downloadShare);

module.exports = router;
