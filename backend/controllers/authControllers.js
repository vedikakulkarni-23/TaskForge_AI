const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { send2FACode } = require('../services/emailService');

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const generate2FACode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Same transporter pattern as emailService.js
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });
};

const verifyAccount = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.password = password;
    user.isEmailVerified = true;
    user.accountStatus = 'active';
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: 'Account verified successfully! You can now login.', email: user.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: 'Please verify your email first. Check your inbox for verification link.',
        needsVerification: true
      });
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({ message: 'Your account is not active. Please contact admin.' });
    }

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const twoFactorCode = generate2FACode();
    const twoFactorExpires = Date.now() + 10 * 60 * 1000;
    user.twoFactorCode = twoFactorCode;
    user.twoFactorExpires = twoFactorExpires;
    await user.save();

    await send2FACode(user.email, user.name, twoFactorCode);
    res.json({ message: 'Verification code sent to your email', requires2FA: true, userId: user._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verify2FA = async (req, res) => {
  try {
    const { userId, code } = req.body;
    const user = await User.findById(userId).select('+twoFactorCode +twoFactorExpires');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.twoFactorExpires < Date.now()) {
      return res.status(400).json({ message: 'Verification code expired. Please login again.' });
    }

    if (user.twoFactorCode !== code) {
      return res.status(401).json({ message: 'Invalid verification code' });
    }

    user.twoFactorCode = undefined;
    user.twoFactorExpires = undefined;
    await user.save();

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

const resend2FA = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const twoFactorCode = generate2FACode();
    const twoFactorExpires = Date.now() + 10 * 60 * 1000;
    user.twoFactorCode = twoFactorCode;
    user.twoFactorExpires = twoFactorExpires;
    await user.save();

    await send2FACode(user.email, user.name, twoFactorCode);
    res.json({ message: 'New verification code sent to your email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
    }

    if (!user.isEmailVerified) {
      return res.status(400).json({
        message: 'This account has not been verified yet. Please check your inbox for the original verification email.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"TASKFORGE Team" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Reset your TASKFORGE password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #191919; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .button { display: inline-block; padding: 12px 30px; background: #191919; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>TASKFORGE</h1></div>
            <div class="content">
              <h2>Reset your password</h2>
              <p>Hi ${user.name},</p>
              <p>We received a request to reset your TASKFORGE password. Click the button below to choose a new password.</p>
              <p><strong>This link expires in 1 hour.</strong></p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="background: #fff; padding: 10px; border: 1px solid #ddd; word-break: break-all; font-size: 13px;">${resetUrl}</p>
              <p style="color: #999; font-size: 13px;">If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
            <div class="footer"><p>© 2024 TASKFORGE. All rights reserved.</p></div>
          </div>
        </body>
        </html>
      `
    });

    console.log('Password reset email sent to:', user.email);
    res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({
        message: 'Password reset link is invalid or has expired. Please request a new one.'
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    console.log('Password reset successfully for:', user.email);
    res.json({ message: 'Password reset successfully! You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  verifyAccount,
  login,
  verify2FA,
  resend2FA,
  forgotPassword,
  resetPassword
};