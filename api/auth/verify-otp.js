// POST /api/auth/verify-otp
import jwt from 'jsonwebtoken';
import { getDb } from '../../lib/db.js';

const JWT_SECRET = process.env.JWT_SECRET;
const SECRET_KEY = JWT_SECRET || 'dev-secret-change-in-production';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    const db = await getDb();
    const users = db.collection('users');

    const normalizedEmail = email.toLowerCase().trim();
    const user = await users.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    if (!user.resetOtp || !user.resetOtpExpires) {
      return res.status(400).json({ error: 'No OTP request found for this account.' });
    }

    // Check expiry
    const now = new Date();
    if (now > new Date(user.resetOtpExpires)) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Check matching OTP
    if (user.resetOtp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }

    // Generate a temporary JWT token indicating OTP verification is successful.
    // This token is valid for 15 minutes.
    const otpToken = jwt.sign(
      { email: normalizedEmail, otpVerified: true },
      SECRET_KEY,
      { expiresIn: '15m' }
    );

    return res.status(200).json({
      message: 'OTP verified successfully.',
      otpToken
    });
  } catch (err) {
    console.error('[verify-otp]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
