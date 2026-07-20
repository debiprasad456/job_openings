// GET /api/admin/applications — Admin: list all applications
// PATCH /api/admin/applications — Admin: update status

import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is missing.');
}
const SECRET_KEY = JWT_SECRET || 'dev-secret-change-in-production';

let client;
async function getDb() {
  if (!client) { client = new MongoClient(MONGODB_URI); await client.connect(); }
  return client.db('diverse-solutions');
}

function verifyAdmin(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    const err = new Error('Unauthorised');
    err.status = 401;
    throw err;
  }
  try {
    const decoded = jwt.verify(auth.slice(7), SECRET_KEY);
    if (decoded.role !== 'admin') {
      const err = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
    return decoded;
  } catch (err) {
    if (err.message === 'Forbidden') throw err;
    const authErr = new Error('Invalid or expired token');
    authErr.status = 401;
    throw authErr;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    verifyAdmin(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  try {
    const db   = await getDb();
    const apps = db.collection('applications');

    // GET — list all applications with optional filters
    if (req.method === 'GET') {
      const { status, jobId, q } = req.query;
      const filter = {};
      if (status && status !== 'All') filter.status = status;
      if (jobId  && jobId  !== 'All') filter.jobId  = jobId;
      if (q) {
        filter.$or = [
          { 'personalInfo.name':  { $regex: q, $options: 'i' } },
          { 'personalInfo.email': { $regex: q, $options: 'i' } },
          { jobTitle:             { $regex: q, $options: 'i' } },
        ];
      }
      const list = await apps.find(filter).sort({ appliedAt: -1 }).toArray();
      return res.status(200).json(list.map(a => ({ ...a, id: a._id.toString(), _id: undefined })));
    }

    // PATCH — update application status
    if (req.method === 'PATCH') {
      const { id, status } = req.body;
      const validStatuses = ['Applied', 'Under Review', 'Shortlisted', 'Rejected', 'Selected'];
      if (!id || !validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid id or status.' });
      if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid application ID format.' });
      await apps.updateOne({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date() } });
      return res.status(200).json({ success: true });
    }

    // DELETE — remove an application
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Application ID required.' });
      if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid application ID format.' });
      await apps.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[admin/applications]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
