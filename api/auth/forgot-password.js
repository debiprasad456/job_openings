// POST /api/auth/forgot-password
import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';

const MONGODB_URI = process.env.MONGODB_URI;

let client;
async function getDb() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
  }
  return client.db('diverse-solutions');
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const db = await getDb();
    const users = db.collection('users');

    const normalizedEmail = email.toLowerCase().trim();
    const user = await users.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    // Rate Limiting: Max 3 attempts per 15 minutes
    const now = new Date();
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const recentAttempts = (user.otpAttempts || []).map(t => new Date(t)).filter(t => t > fifteenMinsAgo);

    if (recentAttempts.length >= 3) {
      const oldestAttempt = recentAttempts[0];
      const timeRemainingMs = oldestAttempt.getTime() + 15 * 60 * 1000 - now.getTime();
      const minutesRemaining = Math.ceil(timeRemainingMs / (60 * 1000));
      return res.status(429).json({
        error: `Too many OTP requests. Please wait ${minutesRemaining} minute(s) before trying again.`
      });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes expiry

    // Save OTP, Expiry, and updated attempts array to user document
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          resetOtp: otp,
          resetOtpExpires: otpExpiry,
          otpAttempts: [...recentAttempts, now]
        }
      }
    );

    const isProd = process.env.NODE_ENV === 'production';
    console.log(`[FORGOT PASSWORD] Generated OTP for ${normalizedEmail}: ${otp}`);

    // Try to send real email if SMTP credentials are provided
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const mailOptions = {
          from: process.env.SMTP_FROM || `"Diverse Solutions" <${process.env.SMTP_USER}>`,
          to: normalizedEmail,
          subject: 'Your Password Reset OTP - Diverse Solutions',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #003366; text-align: center;">Diverse Solutions Career Portal</h2>
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
              <p>Hello ${user.name},</p>
              <p>We received a request to reset your account password. Please use the following 6-digit One-Time Password (OTP) to complete the verification process:</p>
              <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ff6600; background-color: #f4f6f8; padding: 12px 30px; border-radius: 6px; display: inline-block;">
                  ${otp}
                </span>
              </div>
              <p style="color: #ff3333; font-weight: bold;">Note: This OTP is valid for 10 minutes only.</p>
              <p>If you did not make this request, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
              <p style="font-size: 12px; color: #888888; text-align: center;">
                This is an automated message. Please do not reply directly to this email.
              </p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`[SMTP] Successfully sent password reset email to ${normalizedEmail}`);
      } catch (mailError) {
        console.error(`[SMTP] Failed to send email via SMTP to ${normalizedEmail}:`, mailError);
        // Do not throw/crash: if on localhost/testing, fall back to console log response
      }
    } else {
      console.log('[SMTP] SMTP_USER or SMTP_PASS not set. Skipping real email delivery (fallback to console logging).');
    }

    return res.status(200).json({
      message: 'OTP sent successfully.'
    });
  } catch (err) {
    console.error('[forgot-password]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
