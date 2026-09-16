// POST /api/auth/verify-otp
import jwt from 'jsonwebtoken';
import { getDb } from '../../lib/db.js';
import { setCorsHeaders } from '../../lib/cors-helper.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required.');
}
const SECRET_KEY = JWT_SECRET || 'dev-only-local-secret';

export default async function handler(req, res) {
  // CORS
  setCorsHeaders(req, res, { methods: 'POST, OPTIONS', headers: 'Content-Type' });
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

    // Brute-force protection: max 5 OTP guess attempts
    const guessCount = user.otpGuessCount || 0;
    if (guessCount >= 5) {
      // Invalidate the OTP to force user to request a new one
      await users.updateOne({ _id: user._id }, { $unset: { resetOtp: '', resetOtpExpires: '', otpGuessCount: '' } });
      return res.status(429).json({ error: 'Too many incorrect OTP attempts. Please request a new OTP.' });
    }

    // Check matching OTP
    if (user.resetOtp !== otp.trim()) {
      await users.updateOne({ _id: user._id }, { $inc: { otpGuessCount: 1 } });
      const attemptsLeft = 4 - guessCount;
      return res.status(400).json({ error: `Invalid OTP. ${attemptsLeft} attempt(s) remaining.` });
    }

    // Generate a temporary JWT token indicating OTP verification is successful.
    // This token is valid for 15 minutes.
    const otpToken = jwt.sign(
      { email: normalizedEmail, otpVerified: true },
      SECRET_KEY,
      { expiresIn: '15m' }
    );

    // Clear OTP and guess counter on successful verification
    await users.updateOne({ _id: user._id }, { $unset: { otpGuessCount: '' } });

    return res.status(200).json({
      message: 'OTP verified successfully.',
      otpToken
    });
  } catch (err) {
    console.error('[verify-otp]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
