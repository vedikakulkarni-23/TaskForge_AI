const express = require('express');
const router = express.Router();
const { login, verify2FA, resend2FA, verifyAccount } = require('../controllers/authControllers');

// @route   POST /api/auth/login
router.post('/login', login);

// @route   POST /api/auth/verify-2fa
router.post('/verify-2fa', verify2FA);

// @route   POST /api/auth/resend-2fa
router.post('/resend-2fa', resend2FA);

// @route   POST /api/auth/verify-account
router.post('/verify-account', verifyAccount);

module.exports = router;