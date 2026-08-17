import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    if (env.SMTP_HOST.includes('gmail.com')) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: env.SMTP_HOST || 'smtp.gmail.com',
        port: env.SMTP_PORT || 587,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }
  }
  return transporter;
}

export async function sendOtpEmail(toEmail: string, otp: string): Promise<boolean> {
  const subject = `🔑 Your PosterCraft Verification Code: ${otp}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 20px; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
        <div style="display: inline-block; padding: 12px; border-radius: 12px; background-color: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); margin-bottom: 16px;">
          <h1 style="color: #6366f1; margin: 0; font-size: 24px; font-weight: 800;">PosterCraft</h1>
        </div>
        <h2 style="color: #ffffff; margin-top: 10px; font-size: 20px; font-weight: 700;">Account Verification Code</h2>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.5;">Use the following 6-digit OTP code to complete your registration or login. This code is valid for <strong>60 seconds</strong>.</p>
        
        <div style="margin: 28px 0; padding: 18px; background-color: #0f172a; border-radius: 12px; border: 1px dashed #6366f1; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #818cf8;">
          ${otp}
        </div>

        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">If you did not request this verification code, please ignore this email.</p>
      </div>
    </div>
  `;

  console.log(`📧 [EMAIL SERVICE] Dispatching OTP email to ${toEmail}...`);

  if (env.SMTP_USER && env.SMTP_PASS) {
    try {
      const transport = getTransporter();
      await transport.sendMail({
        from: env.SMTP_FROM || `"PosterCraft" <${env.SMTP_USER}>`,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`✅ [EMAIL SERVICE] OTP Email successfully delivered to ${toEmail}`);
      return true;
    } catch (err: any) {
      console.error(`❌ [EMAIL SERVICE ERROR] Failed to send email to ${toEmail}:`, err.message);
      return false;
    }
  } else {
    console.log(`⚠️ [EMAIL SERVICE] SMTP credentials not set in .env. Code logged for dev: ${otp}`);
    return true;
  }
}

export async function sendAdminRequestNotification(
  superAdminEmail: string,
  applicantName: string,
  applicantEmail: string,
  applicantPhone?: string
): Promise<boolean> {
  const subject = `🔔 New Admin Registration Request: ${applicantName}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 20px; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155;">
        <h2 style="color: #6366f1; margin-top: 0;">New Admin Registration Request</h2>
        <p style="color: #94a3b8; font-size: 14px;">A new user has submitted a registration request for Admin Portal access:</p>
        <div style="text-align: left; background-color: #0f172a; padding: 16px; border-radius: 12px; margin: 20px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          <strong>Name:</strong> ${applicantName}<br/>
          <strong>Email:</strong> ${applicantEmail}<br/>
          ${applicantPhone ? `<strong>Phone:</strong> ${applicantPhone}<br/>` : ''}
          <strong>Status:</strong> <span style="color: #f59e0b;">Pending Super Admin Approval</span>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">Log in to your PosterCraft Super Admin dashboard to Approve or Reject this request.</p>
      </div>
    </div>
  `;

  if (env.SMTP_USER && env.SMTP_PASS) {
    try {
      const transport = getTransporter();
      await transport.sendMail({
        from: env.SMTP_FROM || `"PosterCraft" <${env.SMTP_USER}>`,
        to: superAdminEmail,
        subject,
        html: htmlContent,
      });
      console.log(`✅ [EMAIL SERVICE] Admin request notification sent to Super Admin: ${superAdminEmail}`);
      return true;
    } catch (err: any) {
      console.error(`❌ [EMAIL SERVICE ERROR] Failed to notify Super Admin:`, err.message);
      return false;
    }
  }
  return true;
}

export async function sendAdminApprovalNotification(toEmail: string, name: string): Promise<boolean> {
  const subject = `🎉 Admin Registration Approved! Welcome to PosterCraft`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 20px; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155;">
        <h2 style="color: #10b981; margin-top: 0;">Registration Approved!</h2>
        <p style="color: #94a3b8; font-size: 14px;">Hello <strong>${name}</strong>,</p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Your admin registration request has been approved by the Super Admin! You now have full access to the PosterCraft Admin Portal.</p>
        <div style="margin-top: 24px;">
          <a href="${env.CLIENT_URL}/login" style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 12px 24px; border-radius: 10px; font-weight: bold; text-decoration: none;">Log In to Admin Portal</a>
        </div>
      </div>
    </div>
  `;

  if (env.SMTP_USER && env.SMTP_PASS) {
    try {
      const transport = getTransporter();
      await transport.sendMail({
        from: env.SMTP_FROM || `"PosterCraft" <${env.SMTP_USER}>`,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`✅ [EMAIL SERVICE] Approval email sent to ${toEmail}`);
      return true;
    } catch (err: any) {
      console.error(`❌ [EMAIL SERVICE ERROR] Failed to send approval email:`, err.message);
      return false;
    }
  }
  return true;
}

export async function sendAdminRejectionNotification(toEmail: string, name: string): Promise<boolean> {
  const subject = `Notice regarding your PosterCraft Admin Registration Request`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 20px; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155;">
        <h2 style="color: #ef4444; margin-top: 0;">Request Status Update</h2>
        <p style="color: #94a3b8; font-size: 14px;">Hello <strong>${name}</strong>,</p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">We regret to inform you that your request for Admin Portal access has been declined by the Super Admin.</p>
      </div>
    </div>
  `;

  if (env.SMTP_USER && env.SMTP_PASS) {
    try {
      const transport = getTransporter();
      await transport.sendMail({
        from: env.SMTP_FROM || `"PosterCraft" <${env.SMTP_USER}>`,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`✅ [EMAIL SERVICE] Rejection email sent to ${toEmail}`);
      return true;
    } catch (err: any) {
      console.error(`❌ [EMAIL SERVICE ERROR] Failed to send rejection email:`, err.message);
      return false;
    }
  }
  return true;
}
