// POST /api/auth/login
// ── MongoDB Atlas integration (Phase 3 API) ──

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../../lib/db.js';
import { setCorsHeaders } from '../../lib/cors-helper.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required.');
}
const SECRET_KEY = JWT_SECRET || 'dev-only-local-secret';

export default async function handler(req, res) {
  setCorsHeaders(req, res, { methods: 'POST, OPTIONS', headers: 'Content-Type' });
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, password, targetPortal } = req.body;

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
        error: 'Database connection error. Please try again later.'
      });
    }

    const users = db.collection('users');

    // ── Auto-seed initial Admin user into MongoDB if not present ──
    if (cleanEmail === 'admin@diversesolutions.com' || cleanEmail === 'admin@diversesolutions.in') {
      const existingUser = await users.findOne({ email: cleanEmail });
      if (!existingUser) {
        const passwordHash = await bcrypt.hash('Admin@1234', 10);
        await users.insertOne({
          name: 'Employer User',
          email: cleanEmail,
          phone: '8260054398',
          role: 'employer',
          passwordHash: passwordHash,
          createdAt: new Date(),
        });
      }
    }

    const user = await users.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // ── Progressive slow-down on repeated failed login attempts ──
    const now = new Date();
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const recentFailures = (user.loginAttempts || []).map(t => new Date(t)).filter(t => t > fifteenMinsAgo);
    const delayMs = recentFailures.length >= 5 ? 10000 : recentFailures.length >= 3 ? 3000 : recentFailures.length >= 1 ? 1000 : 0;
    if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      // Record failed attempt for slow-down tracking
      await users.updateOne({ _id: user._id }, { $push: { loginAttempts: now } }).catch(() => {});
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Successful login — clear failed attempt history
    await users.updateOne({ _id: user._id }, { $unset: { loginAttempts: '' } }).catch(() => {});

    // ── Portal Role Enforcement ──
    const isEmployerRole = user.role === 'employer' || user.role === 'admin';

    if (targetPortal === 'candidate' && isEmployerRole) {
      return res.status(403).json({
        error: 'This is an Employer account. Please sign in via the Employer Portal.'
      });
    }

    if (targetPortal === 'employer' && !isEmployerRole) {
      return res.status(403).json({
        error: 'This is a Candidate account. Please sign in via the Candidate Login.'
      });
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
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
