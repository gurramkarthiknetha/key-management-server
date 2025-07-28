const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize nodemailer transporter
   */
  async initializeTransporter() {
    try {
      // Check if SMTP credentials are configured
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ SMTP credentials not configured. Email service will be disabled.');
        this.transporter = null;
        return;
      }

      // Configure nodemailer transporter
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection configuration
      await this.transporter.verify();
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
      this.transporter = null;
    }
  }

  /**
   * Send email using configured transporter
   * @param {Object} mailOptions - Email options
   * @returns {Promise<boolean>} Success status
   */
  async sendEmail(mailOptions) {
    if (!this.transporter) {
      console.warn('⚠️ Email transporter not initialized. Email not sent.');
      return false;
    }

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent successfully: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send OTP email
   * @param {string} email - Recipient email
   * @param {string} otp - OTP code
   * @param {string} purpose - Purpose of OTP
   * @param {string} userName - User's name (optional)
   * @returns {Promise<boolean>} Success status
   */
  async sendOTPEmail(email, otp, purpose = 'login', userName = null) {
    const organizationName = process.env.ORGANIZATION_NAME || 'Key Management System';
    const displayName = userName || email.split('@')[0];
    
    let subject, htmlContent;

    switch (purpose) {
      case 'login':
        subject = `${organizationName} - Login Verification Code`;
        htmlContent = this.getLoginOTPTemplate(displayName, otp, organizationName);
        break;
      case 'registration':
        subject = `${organizationName} - Account Registration Verification`;
        htmlContent = this.getRegistrationOTPTemplate(displayName, otp, organizationName);
        break;
      case 'password_reset':
        subject = `${organizationName} - Password Reset Verification`;
        htmlContent = this.getPasswordResetOTPTemplate(displayName, otp, organizationName);
        break;
      case 'email_verification':
        subject = `${organizationName} - Email Verification`;
        htmlContent = this.getEmailVerificationOTPTemplate(displayName, otp, organizationName);
        break;
      default:
        subject = `${organizationName} - Verification Code`;
        htmlContent = this.getGenericOTPTemplate(displayName, otp, organizationName);
    }

    const mailOptions = {
      from: `"${organizationName}" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html: htmlContent,
      text: `Your verification code is: ${otp}. This code will expire in 5 minutes.`
    };

    return this.sendEmail(mailOptions);
  }

  /**
   * Login OTP email template
   */
  getLoginOTPTemplate(userName, otp, organizationName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login Verification Code</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-box { background: white; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${organizationName}</h1>
                <p>Login Verification Code</p>
            </div>
            <div class="content">
                <h2>Hello ${userName},</h2>
                <p>You have requested to log in to your ${organizationName} account. Please use the verification code below to complete your login:</p>
                
                <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                    <p><strong>This code will expire in 5 minutes</strong></p>
                </div>
                
                <div class="warning">
                    <strong>Security Notice:</strong> If you did not request this login, please ignore this email and ensure your account is secure.
                </div>
                
                <p>For security reasons, please do not share this code with anyone.</p>
                
                <div class="footer">
                    <p>This is an automated message from ${organizationName}.<br>
                    Please do not reply to this email.</p>
                </div>
            </div>
        </div>
    </body>
    </html>`;
  }

  /**
   * Registration OTP email template
   */
  getRegistrationOTPTemplate(userName, otp, organizationName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Registration Verification</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-box { background: white; border: 2px solid #059669; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #059669; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to ${organizationName}</h1>
                <p>Account Registration Verification</p>
            </div>
            <div class="content">
                <h2>Hello ${userName},</h2>
                <p>Welcome! You're almost ready to start using your ${organizationName} account. Please verify your email address using the code below:</p>
                
                <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                    <p><strong>This code will expire in 5 minutes</strong></p>
                </div>
                
                <p>Once verified, you'll have full access to the key management system.</p>
                
                <div class="footer">
                    <p>This is an automated message from ${organizationName}.<br>
                    Please do not reply to this email.</p>
                </div>
            </div>
        </div>
    </body>
    </html>`;
  }

  /**
   * Password reset OTP email template
   */
  getPasswordResetOTPTemplate(userName, otp, organizationName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Verification</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #fef2f2; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-box { background: white; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 8px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${organizationName}</h1>
                <p>Password Reset Verification</p>
            </div>
            <div class="content">
                <h2>Hello ${userName},</h2>
                <p>You have requested to reset your password for your ${organizationName} account. Please use the verification code below:</p>
                
                <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                    <p><strong>This code will expire in 5 minutes</strong></p>
                </div>
                
                <div class="warning">
                    <strong>Security Notice:</strong> If you did not request this password reset, please ignore this email and contact your administrator immediately.
                </div>
                
                <div class="footer">
                    <p>This is an automated message from ${organizationName}.<br>
                    Please do not reply to this email.</p>
                </div>
            </div>
        </div>
    </body>
    </html>`;
  }

  /**
   * Email verification OTP template
   */
  getEmailVerificationOTPTemplate(userName, otp, organizationName) {
    return this.getRegistrationOTPTemplate(userName, otp, organizationName);
  }

  /**
   * Generic OTP email template
   */
  getGenericOTPTemplate(userName, otp, organizationName) {
    return this.getLoginOTPTemplate(userName, otp, organizationName);
  }
}

module.exports = new EmailService();
