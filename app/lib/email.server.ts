import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { randomBytes } from 'crypto';

const mailgun = new Mailgun(formData);

// Initialize Mailgun client
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
  url: process.env.MAILGUN_API_URL || 'https://api.mailgun.net'
});

const DOMAIN = process.env.MAILGUN_DOMAIN || '';

export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

export async function sendVerificationEmail(
  email: string, 
  username: string, 
  token: string
): Promise<void> {
  if (!process.env.MAILGUN_API_KEY || !DOMAIN) {
    throw new Error('Mailgun is not configured');
  }

  const verificationUrl = `${process.env.APP_URL || 'http://localhost:5173'}/api/auth/verify-email/${token}`;

  const emailData = {
    from: `Tweeter <noreply@${DOMAIN}>`,
    to: email,
    subject: 'Verify your Tweeter account',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1DA1F2; font-size: 32px; margin: 0;">🐦 Tweeter</h1>
        </div>
        
        <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0 0 20px 0;">Welcome to Tweeter, ${username}!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            Thank you for signing up for Tweeter. To complete your registration and start tweeting, 
            please verify your email address by clicking the button below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #1DA1F2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 25px;">
            If the button doesn't work, you can copy and paste this link into your browser:
            <br>
            <a href="${verificationUrl}" style="color: #1DA1F2; word-break: break-all;">${verificationUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>This verification link will expire in 24 hours.</p>
          <p>If you didn't create a Tweeter account, you can safely ignore this email.</p>
        </div>
      </div>
    `,
    text: `
      Welcome to Tweeter, ${username}!
      
      Thank you for signing up for Tweeter. To complete your registration and start tweeting, 
      please verify your email address by visiting the link below:
      
      ${verificationUrl}
      
      This verification link will expire in 24 hours.
      
      If you didn't create a Tweeter account, you can safely ignore this email.
    `
  };

  try {
    await mg.messages.create(DOMAIN, emailData);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

export async function sendPasswordResetEmail(
  email: string, 
  username: string, 
  token: string
): Promise<void> {
  if (!process.env.MAILGUN_API_KEY || !DOMAIN) {
    throw new Error('Mailgun is not configured');
  }

  const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password/${token}`;

  const emailData = {
    from: `Tweeter <noreply@${DOMAIN}>`,
    to: email,
    subject: 'Reset your Tweeter password',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1DA1F2; font-size: 32px; margin: 0;">🐦 Tweeter</h1>
        </div>
        
        <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0 0 20px 0;">Password Reset Request</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            Hello ${username}, we received a request to reset your Tweeter password. 
            Click the button below to create a new password.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 25px;">
            If the button doesn't work, you can copy and paste this link into your browser:
            <br>
            <a href="${resetUrl}" style="color: #dc3545; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>This reset link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      </div>
    `,
    text: `
      Password Reset Request
      
      Hello ${username}, we received a request to reset your Tweeter password. 
      Visit the link below to create a new password:
      
      ${resetUrl}
      
      This reset link will expire in 1 hour.
      
      If you didn't request a password reset, you can safely ignore this email.
    `
  };

  try {
    await mg.messages.create(DOMAIN, emailData);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}