// POST /api/auth/reset-password
import bcrypt from 'bcryptjs';
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
    const { otpToken, password } = req.body;
    if (!otpToken || !password) {
      return res.status(400).json({ error: 'OTP Token and new password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Verify OTP Token
    let decoded;
    try {
      decoded = jwt.verify(otpToken, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ error: 'Reset session has expired or is invalid. Please request a new OTP.' });
    }

    if (!decoded.otpVerified || !decoded.email) {
      return res.status(400).json({ error: 'Invalid reset session.' });
    }

    const db = await getDb();
    const users = db.collection('users');

    const user = await users.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password, clear OTP fields
    await users.updateOne(
      { _id: user._id },
      {
        $set: { passwordHash },
        $unset: { resetOtp: '', resetOtpExpires: '', otpAttempts: '' }
      }
    );

    return res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('[reset-password]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
