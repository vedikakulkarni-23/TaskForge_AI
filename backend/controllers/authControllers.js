const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { send2FACode } = require('../services/emailService');

// Email validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate 6-digit 2FA code
const generate2FACode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Verify account and set password
// @route   POST /api/auth/verify-account
// @access  Public
const verifyAccount = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Find user by verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Set password and verify email
    user.password = password;
    user.isEmailVerified = true;
    user.accountStatus = 'active';
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ 
      message: 'Account verified successfully! You can now login.',
      email: user.email
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login step 1 - Check credentials and send 2FA code
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        message: 'Please verify your email first. Check your inbox for verification link.',
        needsVerification: true
      });
    }

    // Check if account is active
    if (user.accountStatus !== 'active') {
      return res.status(403).json({ message: 'Your account is not active. Please contact admin.' });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate and send 2FA code
    const twoFactorCode = generate2FACode();
    const twoFactorExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.twoFactorCode = twoFactorCode;
    user.twoFactorExpires = twoFactorExpires;
    await user.save();

    // Send 2FA code via email
    await send2FACode(user.email, user.name, twoFactorCode);

    res.json({
      message: 'Verification code sent to your email',
      requires2FA: true,
      userId: user._id
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login step 2 - Verify 2FA code and complete login
// @route   POST /api/auth/verify-2fa
// @access  Public
const verify2FA = async (req, res) => {
  try {
    const { userId, code } = req.body;

    const user = await User.findById(userId).select('+twoFactorCode +twoFactorExpires');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if code is expired
    if (user.twoFactorExpires < Date.now()) {
      return res.status(400).json({ message: 'Verification code expired. Please login again.' });
    }

    // Verify code
    if (user.twoFactorCode !== code) {
      return res.status(401).json({ message: 'Invalid verification code' });
    }

    // Clear 2FA code
    user.twoFactorCode = undefined;
    user.twoFactorExpires = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      teamId: user.teamId,
      points: user.points,
      badges: user.badges,
      credits: user.credits
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resend 2FA code
// @route   POST /api/auth/resend-2fa
// @access  Public
const resend2FA = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new 2FA code
    const twoFactorCode = generate2FACode();
    const twoFactorExpires = Date.now() + 10 * 60 * 1000;

    user.twoFactorCode = twoFactorCode;
    user.twoFactorExpires = twoFactorExpires;
    await user.save();

    // Send new code
    await send2FACode(user.email, user.name, twoFactorCode);

    res.json({ message: 'New verification code sent to your email' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  verifyAccount,
  login,
  verify2FA,
  resend2FA
};