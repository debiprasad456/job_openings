// POST /api/auth/login
// ── MongoDB Atlas integration (Phase 3 API) ──

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../../lib/db.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is missing.');
}
const SECRET_KEY = JWT_SECRET || 'dev-secret-change-in-production';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    let db;
    try {
      db = await getDb();
    } catch (dbErr) {
      console.error('[login db error]', dbErr.message);
      if (dbErr.message.includes('bad auth') || dbErr.code === 8000) {
        return res.status(500).json({
          error: 'MongoDB Atlas authentication failed. Please check the database username and password in your .env file (MONGODB_URI).'
        });
      }
      return res.status(500).json({
        error: `Database connection error: ${dbErr.message}`
      });
    }

    const users = db.collection('users');

    // ── Auto-seed initial Admin user into MongoDB if not present ──
    if (cleanEmail === 'admin@diversesolutions.com') {
      const existingAdmin = await users.findOne({ email: cleanEmail });
      if (!existingAdmin) {
        const passwordHash = await bcrypt.hash('Admin@1234', 10);
        await users.insertOne({
          name: 'Admin User',
          email: cleanEmail,
          phone: '9000000000',
          role: 'admin',
          passwordHash: passwordHash,
          createdAt: new Date(),
        });
      }
    }

    const user = await users.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const safeUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    const token = jwt.sign(safeUser, SECRET_KEY, { expiresIn: '7d' });

    return res.status(200).json({ user: safeUser, token });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
}
