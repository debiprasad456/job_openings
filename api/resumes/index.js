// GET /api/resumes — Fetch combined candidate & uploaded student resumes from MongoDB Atlas
// POST /api/resumes — Employer: Upload a student resume to MongoDB Atlas
// DELETE /api/resumes — Employer: Delete an uploaded resume

import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { getDb } from '../../lib/db.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is missing.');
}
const SECRET_KEY = JWT_SECRET || 'dev-secret-change-in-production';

function verifyEmployer(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  try {
    const decoded = jwt.verify(auth.slice(7), SECRET_KEY);
    if (decoded.role !== 'admin' && decoded.role !== 'employer') {
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let currentUser;
  try {
    currentUser = verifyEmployer(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  try {
    const db = await getDb();
    const resumesCollection = db.collection('resumes');
    const appsCollection = db.collection('applications');

    // GET — Fetch combined resumes (Applications + Employer Uploads)
    if (req.method === 'GET') {
      const uploadedList = await resumesCollection.find({}).sort({ uploadedAt: -1 }).toArray();
      const appsList = await appsCollection.find({ resumeUrl: { $exists: true, $ne: '' } }).sort({ appliedAt: -1 }).toArray();

      const mappedUploaded = uploadedList.map(r => ({
        id: r._id.toString(),
        name: r.name,
        email: r.email,
        phone: r.phone,
        department: r.department || 'General',
        resumeUrl: r.resumeUrl,
        resumeName: r.resumeName || 'Student_Resume.pdf',
        source: 'uploaded_by_employer',
        sourceLabel: 'Uploaded by Employer',
        date: r.uploadedAt || r.createdAt,
        notes: r.notes || '',
        canDelete: true,
      }));

      const mappedApps = appsList.map(a => ({
        id: a._id.toString(),
        name: a.personalInfo?.name || 'Candidate',
        email: a.personalInfo?.email || '—',
        phone: a.personalInfo?.phone || '—',
        department: a.department || a.jobTitle || 'Applied Candidate',
        jobTitle: a.jobTitle,
        resumeUrl: a.resumeUrl,
        resumeName: a.resumeName || 'Resume.pdf',
        source: 'applied_candidate',
        sourceLabel: `Applied for ${a.jobTitle}`,
        date: a.appliedAt,
        notes: `Application Status: ${a.status}`,
        canDelete: false,
      }));

      const allResumes = [...mappedUploaded, ...mappedApps].sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.status(200).json(allResumes);
    }

    // POST — Employer upload student resume(s) (supports single or batch multi-file array)
    if (req.method === 'POST') {
      const items = Array.isArray(req.body) ? req.body : [req.body];
      if (items.length === 0) {
        return res.status(400).json({ error: 'At least one resume file is required.' });
      }

      const docsToInsert = [];
      for (const item of items) {
        const { name, email, phone, department, resumeUrl, resumeName, notes } = item;
        if (!resumeUrl) continue;

        const cleanFileName = (resumeName || 'Resume.pdf').replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        const derivedName = name && name.trim() ? name.trim() : (cleanFileName || 'Uploaded Resume');

        docsToInsert.push({
          name: derivedName,
          email: email ? email.toLowerCase().trim() : '—',
          phone: phone ? phone.trim() : '—',
          department: department ? department.trim() : 'Uploaded Resume',
          resumeUrl: resumeUrl,
          resumeName: resumeName || 'Resume.pdf',
          notes: notes ? notes.trim() : '',
          source: 'uploaded_by_employer',
          uploadedBy: currentUser.email,
          uploadedAt: new Date(),
        });
      }

      if (docsToInsert.length === 0) {
        return res.status(400).json({ error: 'No valid resume files provided.' });
      }

      const result = await resumesCollection.insertMany(docsToInsert);
      return res.status(201).json({
        success: true,
        count: docsToInsert.length,
        insertedIds: result.insertedIds,
      });
    }

    // DELETE — Delete an employer-uploaded resume
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id || !ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Valid resume ID required.' });
      }
      await resumesCollection.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[resumes API error]', err);
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}
