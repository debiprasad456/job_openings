// GET /api/applications/mine
// Returns all applications for the authenticated user.
// Activated when MONGODB_URI env var is set on Vercel.

import jwt from 'jsonwebtoken';
import { getDb } from '../../lib/db.js';
import { setCorsHeaders } from '../../lib/cors-helper.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is missing.');
}
const SECRET_KEY = JWT_SECRET || 'dev-only-local-secret';

export default async function handler(req, res) {
  setCorsHeaders(req, res, { methods: 'GET, OPTIONS', headers: 'Content-Type, Authorization' });
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Verify JWT
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorised' });

  try {
    const decoded = jwt.verify(auth.slice(7), SECRET_KEY);
    const db = await getDb();
    const apps = await db.collection('applications')
      .find({ userId: decoded.id })
      .sort({ appliedAt: -1 })
      .toArray();

    return res.status(200).json(apps.map(a => ({
      id:          a._id.toString(),
      jobId:       a.jobId,
      jobTitle:    a.jobTitle,
      department:  a.department,
      location:    a.location,
      status:      a.status,
      appliedAt:   a.appliedAt,
      resumeUrl:   a.resumeUrl,
      photoUrl:    a.photoUrl,
    })));
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    console.error('[applications/mine]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
