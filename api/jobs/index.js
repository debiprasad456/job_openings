// GET /api/jobs — Fetch all active job listings
// POST /api/jobs — Create / Publish a new job opening (Employer/Admin)

import jwt from 'jsonwebtoken';
import { getDb } from '../../lib/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const db = await getDb();
    const jobsCollection = db.collection('jobs');

    // ── GET: Return all active jobs ──
    if (req.method === 'GET') {
      const dbJobs = await jobsCollection.find({ isActive: { $ne: false } }).sort({ createdAt: -1 }).toArray();
      const formattedDbJobs = dbJobs.map(j => ({
        id: j._id.toString(),
        title: j.title,
        company: j.company || 'Diverse Solutions Pvt. Ltd.',
        department: j.department || 'General',
        category: j.category || 'Other',
        location: j.location,
        type: j.type || 'Full Time',
        workType: j.workType || 'Work from office',
        shiftType: j.shiftType || 'Day Shift',
        experience: j.experience || 'Fresher',
        salary: j.salary || 'Best in Industry',
        education: j.education || 'Graduate',
        englishLevel: j.englishLevel || 'Basic English',
        postedDate: j.createdAt ? new Date(j.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        isActive: j.isActive ?? true,
        tags: j.tags || [j.category || 'Job'],
        shortDescription: j.shortDescription || j.description || '',
        description: j.description || '',
        responsibilities: j.responsibilities || [],
        requirements: j.requirements || [],
        interviewDetails: j.interviewDetails || null,
        companySize: j.companySize || '50-100',
        formSchema: j.formSchema || [],
      }));

      return res.status(200).json(formattedDbJobs);
    }

    // ── POST: Publish a new job opening (Employer / Admin) ──
    if (req.method === 'POST') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required to post a job.' });
      }

      const token = authHeader.split(' ')[1];
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (e) {
        return res.status(401).json({ error: 'Invalid or expired authentication token.' });
      }

      if (decoded.role !== 'admin' && decoded.role !== 'employer') {
        return res.status(403).json({ error: 'Only employers and admins can post job openings.' });
      }

      const jobData = req.body;
      if (!jobData.title || !jobData.location) {
        return res.status(400).json({ error: 'Job title and location are mandatory fields.' });
      }

      const newJobDoc = {
        title: jobData.title.trim(),
        company: (jobData.company || 'Diverse Solutions Pvt. Ltd.').trim(),
        department: jobData.department || 'General',
        category: jobData.category || 'Marketing',
        location: jobData.location,
        type: jobData.type || 'Full Time',
        workType: jobData.workType || 'Work from office',
        shiftType: jobData.isNightShift ? 'Night Shift' : 'Day Shift',
        experience: jobData.experience || 'Fresher',
        salary: jobData.salary || 'Negotiable',
        education: jobData.education || 'Graduate',
        englishLevel: jobData.englishLevel || 'Basic English',
        companySize: jobData.companySize || '101-300',
        tags: jobData.tags && jobData.tags.length ? jobData.tags : [jobData.type || 'Full Time', jobData.category || 'General'],
        shortDescription: jobData.shortDescription || `Hiring for ${jobData.title} in ${jobData.location}.`,
        description: jobData.description || `Key responsibilities for ${jobData.title}. Apply now on Diverse Solutions.`,
        responsibilities: jobData.responsibilities || [`Handle ${jobData.title} operational tasks`, 'Collaborate with team members'],
        requirements: jobData.requirements || [`Education: ${jobData.education || 'Graduate'}`, `English: ${jobData.englishLevel || 'Basic'}`],
        interviewDetails: jobData.interviewDetails || null,
        postedBy: decoded.id || 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await jobsCollection.insertOne(newJobDoc);
      return res.status(201).json({
        message: 'Job opening posted successfully!',
        jobId: result.insertedId.toString(),
        job: { id: result.insertedId.toString(), ...newJobDoc }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[api/jobs]', err);
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}
