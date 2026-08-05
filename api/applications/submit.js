// POST /api/applications/submit
// Saves application to MongoDB. Activated when MONGODB_URI env var is set.

import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { getDb } from '../../lib/db.js';
import { setCorsHeaders } from '../../lib/cors-helper.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is missing.');
}
const SECRET_KEY = JWT_SECRET || 'dev-only-local-secret';

export default async function handler(req, res) {
  setCorsHeaders(req, res, { methods: 'POST, OPTIONS', headers: 'Content-Type, Authorization' });
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  try {
    const decoded = jwt.verify(auth.slice(7), SECRET_KEY);
    const { userId, jobId, jobTitle, department, location, personalInfo, roleData, resumeUrl, photoUrl, resumeName, photoName } = req.body;
    if (!userId || !jobId || !personalInfo || !resumeUrl) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    if (decoded.id !== userId) {
      return res.status(403).json({ error: 'Forbidden: You cannot apply on behalf of another user.' });
    }

    const db = await getDb();
    const apps = db.collection('applications');

    const exists = await apps.findOne({ userId, jobId });
    if (exists) return res.status(409).json({ error: 'You have already applied for this position.' });

    const result = await apps.insertOne({
      userId, jobId, jobTitle, department, location,
      personalInfo, roleData,
      resumeUrl, photoUrl,
      resumeName: resumeName || '',
      photoName: photoName || '',
      status: 'Applied',
      appliedAt: new Date(),
    });

    return res.status(201).json({ id: result.insertedId.toString(), status: 'Applied' });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
    console.error('[submit-application]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
