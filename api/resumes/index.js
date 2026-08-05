// GET /api/resumes — Fetch combined candidate & uploaded student resumes from MongoDB Atlas
// POST /api/resumes — Employer: Upload a student resume to MongoDB Atlas
// DELETE /api/resumes — Employer: Delete an uploaded resume

import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { getDb } from '../../lib/db.js';
import { setCorsHeaders } from '../../lib/cors-helper.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required.');
}
const SECRET_KEY = JWT_SECRET || 'dev-only-local-secret';

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
  setCorsHeaders(req, res, { methods: 'GET, POST, DELETE, OPTIONS', headers: 'Content-Type, Authorization' });
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
      const uploadedList = await resumesCollection.find({}).toArray();
      const appsList = await appsCollection.find({ resumeUrl: { $exists: true, $ne: '' } }).toArray();

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
        canDelete: true,
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

      // Fetch existing resume records to prevent duplicate uploads
      const existingUploaded = await resumesCollection.find({}, { projection: { resumeName: 1, resumeUrl: 1 } }).toArray();
      const existingApps = await appsCollection.find({ resumeUrl: { $exists: true, $ne: '' } }, { projection: { resumeName: 1, resumeUrl: 1 } }).toArray();

      const existingResumeNames = new Set([
        ...existingUploaded.map(r => (r.resumeName || '').toLowerCase().trim()),
        ...existingApps.map(a => (a.resumeName || '').toLowerCase().trim())
      ].filter(Boolean));

      const existingUrls = new Set([
        ...existingUploaded.map(r => (r.resumeUrl || '').trim()),
        ...existingApps.map(a => (a.resumeUrl || '').trim())
      ].filter(Boolean));

      const docsToInsert = [];
      const skippedDuplicates = [];
      const invalidFiles = [];

      for (const item of items) {
        const { name, email, phone, department, resumeUrl, resumeName, notes } = item;
        if (!resumeUrl || typeof resumeUrl !== 'string') {
          invalidFiles.push(resumeName || name || 'Unknown file');
          continue;
        }

        // Validate resumeUrl (supports base64 data: URIs, http://, and https://)
        const isDataUrl = resumeUrl.startsWith('data:');
        const isHttpUrl = resumeUrl.startsWith('http://') || resumeUrl.startsWith('https://');
        if (!isDataUrl && !isHttpUrl) {
          invalidFiles.push(resumeName || name || 'Invalid URL');
          continue;
        }

        // Basic field length validation
        if (name && name.length > 200) continue;
        if (notes && notes.length > 2000) continue;

        const fileNameLower = (resumeName || '').toLowerCase().trim();
        const cleanFileName = (resumeName || 'Resume.pdf').replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        const derivedName = name && name.trim() ? name.trim() : (cleanFileName || 'Uploaded Resume');

        // Prevent duplicate file name or identical resumeUrl (only for http/https URLs)
        const isDuplicateFile = Boolean(fileNameLower && existingResumeNames.has(fileNameLower));
        const isDuplicateUrl = Boolean(isHttpUrl && existingUrls.has(resumeUrl.trim()));

        if (isDuplicateFile || isDuplicateUrl) {
          skippedDuplicates.push(resumeName || derivedName);
          continue;
        }

        if (fileNameLower) existingResumeNames.add(fileNameLower);
        if (isHttpUrl) existingUrls.add(resumeUrl.trim());

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
        if (skippedDuplicates.length > 0) {
          return res.status(400).json({
            error: `Duplicate Resume Alert: The selected resume file(s) already exist in your database (${skippedDuplicates.join(', ')}). No duplicate entries were created.`
          });
        }
        if (invalidFiles.length > 0) {
          return res.status(400).json({
            error: `Upload Error: The selected file(s) contain invalid or unsupported formats (${invalidFiles.join(', ')}).`
          });
        }
        return res.status(400).json({ error: 'No valid resume files were provided for upload.' });
      }

      const result = await resumesCollection.insertMany(docsToInsert);
      return res.status(201).json({
        success: true,
        count: docsToInsert.length,
        skippedCount: skippedDuplicates.length,
        skippedFiles: skippedDuplicates,
        insertedIds: result.insertedIds,
      });
    }

    // DELETE — Delete an employer-uploaded resume or a job application
    if (req.method === 'DELETE') {
      const { id, source } = req.body;
      if (!id || !ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Valid resume or application ID required.' });
      }

      if (source === 'applied_candidate') {
        await appsCollection.deleteOne({ _id: new ObjectId(id) });
      } else {
        const resDel = await resumesCollection.deleteOne({ _id: new ObjectId(id) });
        if (resDel.deletedCount === 0) {
          await appsCollection.deleteOne({ _id: new ObjectId(id) });
        }
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[resumes API error]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
