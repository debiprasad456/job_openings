// POST /api/auth/register
// ── MongoDB Atlas integration (Phase 3 API) ──
// Connect MONGODB_URI in Vercel environment variables to activate.

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../../lib/db.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is missing.');
}
const SECRET_KEY = JWT_SECRET || 'dev-secret-change-in-production';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, email, phone, password } = req.body;

    // Validate
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    let db;
    try {
      db = await getDb();
    } catch (dbErr) {
      console.error('[register db error]', dbErr.message);
      if (dbErr.message.includes('bad auth') || dbErr.code === 8000) {
        return res.status(500).json({
          error: 'MongoDB Atlas authentication failed. Please check your MONGODB_URI in .env.'
        });
      }
      return res.status(500).json({
        error: `Database connection error: ${dbErr.message}`
      });
    }

    const users = db.collection('users');

    // Check duplicate email
    const existing = await users.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await users.insertOne({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      passwordHash,
      role: 'candidate',
      createdAt: new Date(),
    });

    const user = { id: result.insertedId.toString(), name: name.trim(), email: email.toLowerCase(), phone, role: 'candidate' };

    // Sign JWT
    const token = jwt.sign(user, SECRET_KEY, { expiresIn: '7d' });

    return res.status(201).json({ user, token });
  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
}
