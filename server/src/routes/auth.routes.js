const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

// POST /api/auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/logout  (optional auth — works even if token is expired)
router.post('/logout', authController.logout);

// POST /api/auth/refresh  (uses httpOnly cookie)
router.post('/refresh', authController.refresh);

// GET /api/auth/me  (requires valid access token)
router.get('/me', authenticate, authController.getMe);

module.exports = router;
