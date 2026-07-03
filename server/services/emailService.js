import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT) || 2525,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Smart Task Management" <noreply@taskmind.com>',
      to,
      subject,
      html,
    };

    // If no credentials, log the email and return to prevent failure
    if (!process.env.SMTP_USER && !process.env.SMTP_HOST) {
      console.log('--- EMAIL SIMULATOR (No SMTP credentials configured) ---');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${html}`);
      console.log('-------------------------------------------------------');
      return { messageId: 'simulated-id' };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Email dispatch error: ${error.message}`);
    throw error;
  }
};

// Verification OTP template
export const sendVerificationOTP = async (email, name, otp) => {
  const subject = 'Verify Your Email - Smart Task Management';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
      <h2 style="color: #4f46e5; margin-bottom: 20px;">Welcome to Taskmind, ${name}!</h2>
      <p style="font-size: 16px; color: #3f3f46;">Please verify your email address by using the OTP below:</p>
      <div style="background-color: #f4f4f5; padding: 15px; border-radius: 6px; text-align: center; margin: 25px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #18181b;">${otp}</span>
      </div>
      <p style="font-size: 14px; color: #71717a;">This verification code is valid for 10 minutes. If you did not request this registration, please ignore this email.</p>
    </div>
  `;
  return await sendEmail({ to: email, subject, html });
};

// Reset Password OTP template
export const sendResetPasswordOTP = async (email, name, otp) => {
  const subject = 'Reset Your Password - Smart Task Management';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
      <h2 style="color: #ef4444; margin-bottom: 20px;">Password Reset Request</h2>
      <p style="font-size: 16px; color: #3f3f46;">Hi ${name},</p>
      <p style="font-size: 16px; color: #3f3f46;">We received a request to reset your password. Use the following OTP to proceed:</p>
      <div style="background-color: #f4f4f5; padding: 15px; border-radius: 6px; text-align: center; margin: 25px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #18181b;">${otp}</span>
      </div>
      <p style="font-size: 14px; color: #71717a;">This password reset code is valid for 10 minutes. If you did not make this request, please secure your account.</p>
    </div>
  `;
  return await sendEmail({ to: email, subject, html });
};

// Org Invite Link Template
export const sendOrgInvite = async (email, inviterName, orgName, inviteLink) => {
  const subject = `Invitation to Join ${orgName} - Smart Task Management`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
      <h2 style="color: #4f46e5; margin-bottom: 20px;">Workspace Invitation</h2>
      <p style="font-size: 16px; color: #3f3f46;">Hi,</p>
      <p style="font-size: 16px; color: #3f3f46;"><strong>${inviterName}</strong> has invited you to join the organization <strong>${orgName}</strong> on Taskmind.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteLink}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invitation</a>
      </div>
      <p style="font-size: 14px; color: #71717a;">If the button above does not work, copy and paste this URL into your browser: <br>${inviteLink}</p>
    </div>
  `;
  return await sendEmail({ to: email, subject, html });
};
