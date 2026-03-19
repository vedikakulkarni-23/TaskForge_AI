const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password (NOT your regular password!)
    }
  });
};

// Send account creation email to new user
const sendAccountCreationEmail = async (userEmail, userName, verificationToken) => {
  const transporter = createTransporter();
  
  // Fix: Ensure FRONTEND_URL is defined, fallback to localhost
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verificationUrl = `${frontendUrl}/verify-account/${verificationToken}`;
  
  console.log('📧 Sending verification email to:', userEmail);
  console.log('🔗 Verification URL:', verificationUrl);
  
  const mailOptions = {
    from: `"TASKFORGE Team" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: 'Welcome to TASKFORGE - Verify Your Account',
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
          <div class="header">
            <h1>🚀 TASKFORGE</h1>
          </div>
          <div class="content">
            <h2>Welcome, ${userName}!</h2>
            <p>An administrator has created an account for you on TASKFORGE.</p>
            <p>To activate your account and set your password, please click the button below:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Account & Set Password</a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="background: #fff; padding: 10px; border: 1px solid #ddd; word-break: break-all;">
              ${verificationUrl}
            </p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't expect this email, please ignore it.</p>
          </div>
          <div class="footer">
            <p>© 2024 TASKFORGE. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send 2FA code email
const send2FACode = async (userEmail, userName, code) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"TASKFORGE Team" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: 'Your TASKFORGE Login Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #191919; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
          .code { font-size: 32px; font-weight: bold; text-align: center; background: white; padding: 20px; border-radius: 5px; letter-spacing: 5px; color: #191919; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 TASKFORGE</h1>
          </div>
          <div class="content">
            <h2>Hello, ${userName}!</h2>
            <p>Your two-factor authentication code is:</p>
            <div class="code">${code}</div>
            <p><strong>This code will expire in 10 minutes.</strong></p>
            <p>If you didn't request this code, please ignore this email and ensure your account is secure.</p>
          </div>
          <div class="footer">
            <p>© 2024 TASKFORGE. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('2FA code sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending 2FA code:', error);
    throw new Error('Failed to send 2FA code');
  }
};

module.exports = {
  sendAccountCreationEmail,
  send2FACode
};