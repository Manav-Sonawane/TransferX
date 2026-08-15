const express = require('express');
const router = express.Router();

const downloadController = require('../controllers/download.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// ─── Private Download Routes (Auth Required) ─────────────────

// GET /api/download/private/:fileId - Get file metadata
router.get('/private/:fileId', authenticate, downloadController.getFileMetadata);

// POST /api/download/private/:fileId/validate-access - Validate password, get access token
router.post('/private/:fileId/validate-access', authenticate, downloadController.validateAccess);

// GET /api/download/private/:fileId/download - Download file (302 redirect)
router.get('/private/:fileId/download', authenticate, downloadController.downloadFile);

// GET /api/download/private/:fileId/download-url - Get download URL as JSON
router.get('/private/:fileId/download-url', authenticate, downloadController.getDownloadUrl);

module.exports = router;
