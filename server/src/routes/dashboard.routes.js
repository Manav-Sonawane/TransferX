const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// GET /api/dashboard
router.get('/', authenticate, dashboardController.getDashboardStats);

module.exports = router;
