const express = require('express');
const router = express.Router();

const fileController = require('../controllers/file.controller');
const upload = require('../middlewares/upload.middleware');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');

// POST /api/files/upload
// Uses optionalAuth so both guests and logged-in users can upload
// upload.single('file') handles multipart/form-data
router.post('/upload', optionalAuth, upload.single('file'), fileController.uploadFile);

// GET /api/files (Authenticated users only)
router.get('/', authenticate, fileController.getUserFiles);

// DELETE /api/files/:id (Authenticated users only)
router.delete('/:id', authenticate, fileController.deleteFile);

module.exports = router;
