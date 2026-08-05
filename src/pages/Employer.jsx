import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { JOBS } from '../data/jobs';
import EmployerJobPosting from '../components/EmployerJobPosting';
import '../styles/admin.css';

const STATUSES = ['Applied', 'Under Review', 'Shortlisted', 'Selected', 'Rejected'];

/* ── Relative time helper ── */
function timeAgo(iso) {
  if (!iso) return 'Today';
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d} days ago`;
}

/* ── Utility: Safe open base64 URL / Blob in a new tab ── */
function openBase64InNewTab(base64Data) {
  try {
    if (!base64Data) return;
    const parts = base64Data.split(';base64,');
    if (parts.length < 2) {
      window.open(base64Data, '_blank');
      return;
    }
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    const blob = new Blob([uInt8Array], { type: contentType });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch (err) {
    console.error('Error opening file:', err);
    window.open(base64Data, '_blank');
  }
}

/* ── 18-Category Advanced Candidate Filter Sidebar ── */
function CandidateFilterSidebar({ dbFilters, setDbFilters, resetDbFilters }) {
  const [openSection, setOpenSection] = useState({
    location: true,
    exp: true,
    education: true,
    personal: true,
    preferences: false,
  });

  const toggleSection = (sec) => setOpenSection(prev => ({ ...prev, [sec]: !prev[sec] }));

  return (
    <aside className="candidate-filter-sidebar">
      <div className="filter-group-header-row">
        <span className="filter-group-header">⚙️ Database Filters</span>
        <button className="btn-reset-filters" onClick={resetDbFilters} title="Reset all filters">
          Clear All
        </button>
      </div>

      {/* 1. Location & Keywords */}
      <div className="filter-accordion">
        <div className="accordion-title" onClick={() => toggleSection('location')}>
          <span>📍 Location & Keywords</span>
          <span className="arrow">{openSection.location ? '▲' : '▼'}</span>
        </div>
        {openSection.location && (
          <div className="accordion-content">
            <div className="filter-input-group">
              <label className="filter-label">Current City / Area</label>
              <input
                type="text"
                placeholder="Search current city/area"
                value={dbFilters.city}
                onChange={e => setDbFilters({ ...dbFilters, city: e.target.value })}
                className="filter-input-text"
              />
            </div>
            <div className="filter-input-group">
              <label className="filter-label">Exclude Keywords</label>
              <input
                type="text"
                placeholder="Keywords to exclude"
                value={dbFilters.excludeKeywords}
                onChange={e => setDbFilters({ ...dbFilters, excludeKeywords: e.target.value })}
                className="filter-input-text"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Experience, Salary & Industry */}
      <div className="filter-accordion">
        <div className="accordion-title" onClick={() => toggleSection('exp')}>
          <span>💼 Experience & Industry</span>
          <span className="arrow">{openSection.exp ? '▲' : '▼'}</span>
        </div>
        {openSection.exp && (
          <div className="accordion-content">
            <div className="filter-grid-2">
              <div>
                <label className="filter-label">Min. Exp</label>
                <select
                  value={dbFilters.minExp}
                  onChange={e => setDbFilters({ ...dbFilters, minExp: e.target.value })}
                  className="filter-select"
                >
                  <option value="">Min Exp</option>
                  <option value="0">0 (Fresher)</option>
                  <option value="1">1 Year</option>
                  <option value="2">2 Years</option>
                  <option value="3">3 Years</option>
                  <option value="5">5 Years</option>
                  <option value="10">10+ Years</option>
                </select>
              </div>
              <div>
                <label className="filter-label">Max. Exp</label>
                <select
                  value={dbFilters.maxExp}
                  onChange={e => setDbFilters({ ...dbFilters, maxExp: e.target.value })}
                  className="filter-select"
                >
                  <option value="">Max Exp</option>
                  <option value="1">1 Year</option>
                  <option value="3">3 Years</option>
                  <option value="5">5 Years</option>
                  <option value="10">10 Years</option>
                  <option value="15">15+ Years</option>
                </select>
              </div>
            </div>

            <div className="filter-input-group" style={{ marginTop: '8px' }}>
              <label className="filter-label">Search Industry</label>
              <input
                type="text"
                placeholder="Search Industry"
                value={dbFilters.industry}
                onChange={e => setDbFilters({ ...dbFilters, industry: e.target.value })}
                className="filter-input-text"
              />
            </div>

            <div className="filter-input-group">
              <label className="filter-label">Current / Previous Company</label>
              <input
                type="text"
                placeholder="Company"
                value={dbFilters.company}
                onChange={e => setDbFilters({ ...dbFilters, company: e.target.value })}
                className="filter-input-text"
              />
            </div>

            <div className="filter-grid-2">
              <div>
                <label className="filter-label">Min Salary (LPA)</label>
                <input
                  type="text"
                  placeholder="Min LPA"
                  value={dbFilters.minSalary}
                  onChange={e => setDbFilters({ ...dbFilters, minSalary: e.target.value })}
                  className="filter-input-text"
                />
              </div>
              <div>
                <label className="filter-label">Max Salary (LPA)</label>
                <input
                  type="text"
                  placeholder="Max LPA"
                  value={dbFilters.maxSalary}
                  onChange={e => setDbFilters({ ...dbFilters, maxSalary: e.target.value })}
                  className="filter-input-text"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Education & Degrees */}
      <div className="filter-accordion">
        <div className="accordion-title" onClick={() => toggleSection('education')}>
          <span>🎓 Education & Degrees</span>
          <span className="arrow">{openSection.education ? '▲' : '▼'}</span>
        </div>
        {openSection.education && (
          <div className="accordion-content">
            <div className="filter-input-group">
              <label className="filter-label">Degrees / Specialization</label>
              <input
                type="text"
                placeholder="Search degree/specialization"
                value={dbFilters.degree}
                onChange={e => setDbFilters({ ...dbFilters, degree: e.target.value })}
                className="filter-input-text"
              />
            </div>

            <div className="filter-input-group">
              <label className="filter-label">Education Filter</label>
              <div className="filter-radio-group">
                <label className="filter-radio-item">
                  <input
                    type="radio"
                    name="eduLevel"
                    checked={dbFilters.educationLevel === 'all'}
                    onChange={() => setDbFilters({ ...dbFilters, educationLevel: 'all' })}
                  /> All
                </label>
                <label className="filter-radio-item">
                  <input
                    type="radio"
                    name="eduLevel"
                    checked={dbFilters.educationLevel === 'graduate'}
                    onChange={() => setDbFilters({ ...dbFilters, educationLevel: 'graduate' })}
                  /> Graduate Only
                </label>
                <label className="filter-radio-item">
                  <input
                    type="radio"
                    name="eduLevel"
                    checked={dbFilters.educationLevel === 'postgraduate'}
                    onChange={() => setDbFilters({ ...dbFilters, educationLevel: 'postgraduate' })}
                  /> Post Graduate Only
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Personal, Age & Languages */}
      <div className="filter-accordion">
        <div className="accordion-title" onClick={() => toggleSection('personal')}>
          <span>👤 Personal & Languages</span>
          <span className="arrow">{openSection.personal ? '▲' : '▼'}</span>
        </div>
        {openSection.personal && (
          <div className="accordion-content">
            <div className="filter-input-group">
              <label className="filter-label">Gender</label>
              <div className="filter-radio-group">
                <label className="filter-radio-item">
                  <input
                    type="radio"
                    name="gender"
                    checked={dbFilters.gender === 'all'}
                    onChange={() => setDbFilters({ ...dbFilters, gender: 'all' })}
                  /> All
                </label>
                <label className="filter-radio-item">
                  <input
                    type="radio"
                    name="gender"
                    checked={dbFilters.gender === 'Male'}
                    onChange={() => setDbFilters({ ...dbFilters, gender: 'Male' })}
                  /> Male
                </label>
                <label className="filter-radio-item">
                  <input
                    type="radio"
                    name="gender"
                    checked={dbFilters.gender === 'Female'}
                    onChange={() => setDbFilters({ ...dbFilters, gender: 'Female' })}
                  /> Female
                </label>
              </div>
            </div>

            <div className="filter-grid-2">
              <div>
                <label className="filter-label">Age From</label>
                <input
                  type="number"
                  placeholder="18 Years"
                  value={dbFilters.minAge}
                  onChange={e => setDbFilters({ ...dbFilters, minAge: e.target.value })}
                  className="filter-input-text"
                />
              </div>
              <div>
                <label className="filter-label">Age To</label>
                <input
                  type="number"
                  placeholder="60 Years"
                  value={dbFilters.maxAge}
                  onChange={e => setDbFilters({ ...dbFilters, maxAge: e.target.value })}
                  className="filter-input-text"
                />
              </div>
            </div>

            <div className="filter-input-group" style={{ marginTop: '8px' }}>
              <label className="filter-label">Languages</label>
              <select
                value={dbFilters.language}
                onChange={e => setDbFilters({ ...dbFilters, language: e.target.value })}
                className="filter-select"
              >
                <option value="">Select Languages</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Odia">Odia</option>
                <option value="Bengali">Bengali</option>
                <option value="Tamil">Tamil</option>
                <option value="Telugu">Telugu</option>
                <option value="Marathi">Marathi</option>
              </select>
            </div>

            <div className="filter-input-group">
              <label className="filter-label">English Fluency Level</label>
              <select
                value={dbFilters.englishFluency}
                onChange={e => setDbFilters({ ...dbFilters, englishFluency: e.target.value })}
                className="filter-select"
              >
                <option value="">Any Fluency</option>
                <option value="Basic">Basic</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Fluent">Fluent / Native</option>
              </select>
            </div>

            <div className="filter-input-group">
              <label className="filter-label">Departments</label>
              <select
                value={dbFilters.department}
                onChange={e => setDbFilters({ ...dbFilters, department: e.target.value })}
                className="filter-select"
              >
                <option value="">Select a job Department</option>
                <option value="Finance & Accounts">Finance & Accounts</option>
                <option value="Sales & Marketing">Sales & Marketing</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Operations & Logistics">Operations & Logistics</option>
                <option value="Software / IT">Software / IT</option>
                <option value="Engineering & Strategy">Engineering & Strategy</option>
              </select>
            </div>

            <div className="filter-input-group">
              <label className="filter-label">Notice Period</label>
              <select
                value={dbFilters.noticePeriod}
                onChange={e => setDbFilters({ ...dbFilters, noticePeriod: e.target.value })}
                className="filter-select"
              >
                <option value="">Any Notice Period</option>
                <option value="Immediate">Immediate / 0 Days</option>
                <option value="15 Days">15 Days</option>
                <option value="30 Days">30 Days</option>
                <option value="60 Days">60+ Days</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 5. Preferences, Assets, Docs & Certs */}
      <div className="filter-accordion">
        <div className="accordion-title" onClick={() => toggleSection('preferences')}>
          <span>⚙️ Preferences, Assets & Docs</span>
          <span className="arrow">{openSection.preferences ? '▲' : '▼'}</span>
        </div>
        {openSection.preferences && (
          <div className="accordion-content">
            <label className="filter-group-label">Candidate Preferences</label>
            <label className="filter-checkbox-item">
              <input
                type="checkbox"
                checked={dbFilters.relocate}
                onChange={e => setDbFilters({ ...dbFilters, relocate: e.target.checked })}
              /> Willing to Relocate
            </label>
            <label className="filter-checkbox-item">
              <input
                type="checkbox"
                checked={dbFilters.nightShift}
                onChange={e => setDbFilters({ ...dbFilters, nightShift: e.target.checked })}
              /> Night / Rotational Shift
            </label>

            <label className="filter-group-label" style={{ marginTop: '10px' }}>Assets</label>
            <label className="filter-checkbox-item">
              <input
                type="checkbox"
                checked={dbFilters.assetLaptop}
                onChange={e => setDbFilters({ ...dbFilters, assetLaptop: e.target.checked })}
              /> Add Assets: Laptop
            </label>
            <label className="filter-checkbox-item">
              <input
                type="checkbox"
                checked={dbFilters.assetBike}
                onChange={e => setDbFilters({ ...dbFilters, assetBike: e.target.checked })}
              /> Add Assets: Two Wheeler / Bike
            </label>

            <label className="filter-group-label" style={{ marginTop: '10px' }}>Documents</label>
            <label className="filter-checkbox-item">
              <input
                type="checkbox"
                checked={dbFilters.docAadhaar}
                onChange={e => setDbFilters({ ...dbFilters, docAadhaar: e.target.checked })}
              /> Add Documents: Aadhaar Card
            </label>
            <label className="filter-checkbox-item">
              <input
                type="checkbox"
                checked={dbFilters.docPan}
                onChange={e => setDbFilters({ ...dbFilters, docPan: e.target.checked })}
              /> Add Documents: PAN Card
            </label>
            <label className="filter-checkbox-item">
              <input
                type="checkbox"
                checked={dbFilters.docPassport}
                onChange={e => setDbFilters({ ...dbFilters, docPassport: e.target.checked })}
              /> Add Documents: Passport
            </label>
            <label className="filter-checkbox-item">
              <input
                type="checkbox"
                checked={dbFilters.docDrivingLicense}
                onChange={e => setDbFilters({ ...dbFilters, docDrivingLicense: e.target.checked })}
              /> Add Documents: Driving License
            </label>

            <div className="filter-input-group" style={{ marginTop: '10px' }}>
              <label className="filter-label">Certificates</label>
              <input
                type="text"
                placeholder="Add Certificates (e.g. NISM, CA)"
                value={dbFilters.certificate}
                onChange={e => setDbFilters({ ...dbFilters, certificate: e.target.value })}
                className="filter-input-text"
              />
            </div>

            <label className="filter-checkbox-item" style={{ marginTop: '10px' }}>
              <input
                type="checkbox"
                checked={dbFilters.hasResume}
                onChange={e => setDbFilters({ ...dbFilters, hasResume: e.target.checked })}
              /> Have Resume Attached
            </label>
          </div>
        )}
      </div>
    </aside>
  );
}

export default function Employer() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'database' | 'reports' | 'credits'
  const [selectedJob, setSelectedJob] = useState(null); // null = All Jobs list, JobObj = specific job view
  const [selectedStatusTab, setSelectedStatusTab] = useState('All');
  const [selectedApp, setSelectedApp] = useState(null); // Candidate Details Modal
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar drawer toggle
  
  // Applications & Jobs state
  const [applications, setApplications] = useState([]);
  const [allJobsList, setAllJobsList] = useState(JOBS);
  const [apiError, setApiError] = useState('');
  const [toast, setToast] = useState('');
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  // 18-Category Advanced Candidate Database Filters
  const initialDbFilters = {
    city: '',
    excludeKeywords: '',
    minExp: '',
    maxExp: '',
    industry: '',
    company: '',
    minSalary: '',
    maxSalary: '',
    degree: '',
    educationLevel: 'all',
    gender: 'all',
    minAge: '18',
    maxAge: '60',
    language: '',
    englishFluency: '',
    department: '',
    noticePeriod: '',
    relocate: false,
    nightShift: false,
    assetLaptop: false,
    assetBike: false,
    docAadhaar: false,
    docPan: false,
    docPassport: false,
    docDrivingLicense: false,
    certificate: '',
    hasResume: false,
  };

  const [dbFilters, setDbFilters] = useState(initialDbFilters);
  const resetDbFilters = () => setDbFilters(initialDbFilters);

  // Resumes state & Upload modal (Multi-File Drag & Drop)
  const [resumesList, setResumesList] = useState([]);
  const [resumesLoading, setResumesLoading] = useState(true);
  const [resumeSearch, setResumeSearch] = useState('');
  const [resumeSourceFilter, setResumeSourceFilter] = useState('all'); // 'all' | 'uploaded' | 'applied'
  const [resumeViewMode, setResumeViewMode] = useState('list'); // 'list' | 'grid'
  const [showUploadResumeModal, setShowUploadResumeModal] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadFilesList, setUploadFilesList] = useState([]); // [{ name, size, type, base64 }]
  const [isDragging, setIsDragging] = useState(false);

  /* ── Process Dragged / Selected Multi-File Batch ── */
  const processFilesBatch = async (files) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    const duplicates = [];
    const uniqueFiles = [];

    // Set of existing file names and candidate names in database & current batch
    const existingFileNames = new Set([
      ...resumesList.map(r => (r.resumeName || '').toLowerCase().trim()),
      ...uploadFilesList.map(f => (f.name || '').toLowerCase().trim())
    ]);

    const existingCandidateNames = new Set([
      ...resumesList.map(r => (r.name || '').toLowerCase().trim())
    ]);

    for (const file of fileArray) {
      const fileNameLower = file.name.toLowerCase().trim();
      const cleanCandidateName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').toLowerCase().trim();

      if (existingFileNames.has(fileNameLower) || (cleanCandidateName && existingCandidateNames.has(cleanCandidateName))) {
        duplicates.push(file.name);
      } else {
        existingFileNames.add(fileNameLower);
        if (cleanCandidateName) existingCandidateNames.add(cleanCandidateName);
        uniqueFiles.push(file);
      }
    }

    if (duplicates.length > 0) {
      alert(`⚠️ Duplicate Resume(s) Skipped:\n\nThe following ${duplicates.length} file(s) already exist in your candidate database or upload list:\n• ${duplicates.join('\n• ')}`);
    }

    if (uniqueFiles.length === 0) return;

    const converted = await Promise.all(
      uniqueFiles.map(file => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            name: file.name,
            size: file.size,
            type: file.type,
            base64: e.target.result,
          });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      }))
    );

    const validFiles = converted.filter(Boolean);
    setUploadFilesList(prev => [...prev, ...validFiles]);
  };

  const handleResumeFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFilesBatch(e.target.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFilesBatch(e.dataTransfer.files);
    }
  };

  const removeFileFromBatch = (index) => {
    setUploadFilesList(prev => prev.filter((_, i) => i !== index));
  };

  /* ── Load Applications from API ── */
  const refreshApplications = useCallback(async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'employer')) {
      return;
    }
    setApiError('');
    try {
      const token = localStorage.getItem('ds_token');
      let res = await fetch('/api/employer/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok && res.status !== 401 && res.status !== 403) {
        res = await fetch('/api/admin/applications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      if (res.status === 401 || res.status === 403) {
        setApiError('Unauthorized access to employer API.');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load applications.');
      setApplications(data);
    } catch (err) {
      setApiError(err.message);
    }
  }, [user]);

  /* ── Load Resumes from API ── */
  const refreshResumes = useCallback(async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'employer')) return;
    setResumesLoading(true);
    try {
      const token = localStorage.getItem('ds_token');
      const res = await fetch('/api/resumes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResumesList(data);
      }
    } catch (e) {
      console.warn('Could not load resumes list', e);
    } finally {
      setResumesLoading(false);
    }
  }, [user]);

  /* ── Upload Resume Handler (Multi-File Batch) ── */
  const handleUploadResumeSubmit = async (e) => {
    e.preventDefault();
    if (uploadFilesList.length === 0) {
      alert('Please select or drag at least one resume file to upload.');
      return;
    }
    setUploadingResume(true);
    try {
      const token = localStorage.getItem('ds_token');
      const payload = uploadFilesList.map(item => {
        const cleanFileName = item.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        return {
          name: cleanFileName || 'Uploaded Student Resume',
          email: '—',
          phone: '—',
          department: 'Uploaded Resume',
          resumeUrl: item.base64,
          resumeName: item.name,
          notes: '',
        };
      });

      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload resumes.');
      
      if (data.skippedCount > 0) {
        showToast(`✅ Uploaded ${data.count} new resume(s). (${data.skippedCount} duplicate file(s) were skipped)`);
      } else {
        showToast(`✅ Successfully uploaded ${data.count || payload.length} student resume(s) to database!`);
      }
      setShowUploadResumeModal(false);
      setUploadFilesList([]);
      refreshResumes();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingResume(false);
    }
  };

  /* ── Delete Uploaded Resume / Job Application ── */
  const handleDeleteResume = async (resumeId, source) => {
    const itemLabel = source === 'applied_candidate' ? 'job application' : 'uploaded resume';
    if (!window.confirm(`Are you sure you want to delete this ${itemLabel}?`)) return;
    try {
      const token = localStorage.getItem('ds_token');
      const res = await fetch('/api/resumes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: resumeId, source }),
      });
      if (res.ok) {
        showToast(`🗑️ ${source === 'applied_candidate' ? 'Job application' : 'Resume'} deleted successfully.`);
        refreshResumes();
        refreshApplications();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete entry.');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  /* ── Load Dynamic Jobs ── */
  const refreshJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const apiJobs = await res.json();
        if (apiJobs && apiJobs.length > 0) {
          const apiJobIds = new Set(apiJobs.map(j => j.id));
          const remainingDefault = JOBS.filter(j => !apiJobIds.has(j.id));
          setAllJobsList([...apiJobs, ...remainingDefault]);
        }
      }
    } catch (e) {
      console.warn('Could not load jobs list', e);
    }
  }, []);

  useEffect(() => {
    refreshApplications();
    refreshJobs();
    refreshResumes();
  }, [refreshApplications, refreshJobs, refreshResumes]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };



  /* ── Filtered Resumes List ── */
  const filteredResumes = useMemo(() => {
    let list = resumesList;
    if (resumeSourceFilter === 'uploaded') {
      list = list.filter(r => r.source === 'uploaded_by_employer');
    } else if (resumeSourceFilter === 'applied') {
      list = list.filter(r => r.source === 'applied_candidate');
    }

    if (resumeSearch.trim()) {
      const q = resumeSearch.toLowerCase().trim();
      list = list.filter(r =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.department && r.department.toLowerCase().includes(q)) ||
        (r.jobTitle && r.jobTitle.toLowerCase().includes(q))
      );
    }
    return list;
  }, [resumesList, resumeSourceFilter, resumeSearch]);

  /* ── Update application status ── */
  const handleStatusChange = async (appId, newStatus) => {
    try {
      const token = localStorage.getItem('ds_token');
      const res = await fetch('/api/employer/applications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: appId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status.');
      refreshApplications();
      showToast(`✅ Status updated to "${newStatus}"`);
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  /* ── Applications for current selected job ── */
  const jobApplications = useMemo(() => {
    if (!selectedJob) return applications;
    return applications.filter(a => a.jobId === selectedJob.id || a.jobTitle === selectedJob.title);
  }, [applications, selectedJob]);

  /* ── Filter Function for Database / Candidates ── */
  const applyDbFilters = useCallback((list) => {
    let result = list;

    if (dbFilters.city.trim()) {
      const q = dbFilters.city.toLowerCase().trim();
      result = result.filter(c => (c.location || '').toLowerCase().includes(q) || (c.personalInfo?.city || '').toLowerCase().includes(q));
    }

    if (dbFilters.excludeKeywords.trim()) {
      const ex = dbFilters.excludeKeywords.toLowerCase().trim();
      result = result.filter(c => {
        const text = `${c.personalInfo?.name} ${c.department} ${c.jobTitle} ${c.location}`.toLowerCase();
        return !text.includes(ex);
      });
    }

    if (dbFilters.minExp !== '') {
      const minE = parseFloat(dbFilters.minExp);
      result = result.filter(c => {
        const expStr = c.experience || c.roleData?.experience || '0';
        const expNum = parseFloat(expStr.match(/\d+(\.\d+)?/)?.[0] || '0');
        return expNum >= minE;
      });
    }

    if (dbFilters.maxExp !== '') {
      const maxE = parseFloat(dbFilters.maxExp);
      result = result.filter(c => {
        const expStr = c.experience || c.roleData?.experience || '0';
        const expNum = parseFloat(expStr.match(/\d+(\.\d+)?/)?.[0] || '0');
        return expNum <= maxE;
      });
    }

    if (dbFilters.industry.trim()) {
      const ind = dbFilters.industry.toLowerCase().trim();
      result = result.filter(c => (c.department || c.industry || '').toLowerCase().includes(ind));
    }

    if (dbFilters.company.trim()) {
      const comp = dbFilters.company.toLowerCase().trim();
      result = result.filter(c => (c.company || c.previousCompany || '').toLowerCase().includes(comp));
    }

    if (dbFilters.degree.trim()) {
      const deg = dbFilters.degree.toLowerCase().trim();
      result = result.filter(c => (c.personalInfo?.education || c.roleData?.mbaCollege || '').toLowerCase().includes(deg));
    }

    if (dbFilters.educationLevel === 'graduate') {
      result = result.filter(c => (c.personalInfo?.education || '').toLowerCase().includes('graduat') || (c.roleData?.mbaCollege || '').length > 0);
    } else if (dbFilters.educationLevel === 'postgraduate') {
      result = result.filter(c => (c.personalInfo?.education || '').toLowerCase().includes('mba') || (c.personalInfo?.education || '').toLowerCase().includes('master') || (c.roleData?.mbaCollege || '').length > 0);
    }

    if (dbFilters.gender !== 'all') {
      result = result.filter(c => (c.personalInfo?.gender || 'Male').toLowerCase() === dbFilters.gender.toLowerCase());
    }

    if (dbFilters.language.trim()) {
      const lang = dbFilters.language.toLowerCase().trim();
      result = result.filter(c => (c.languages || 'English, Hindi, Odia').toLowerCase().includes(lang));
    }

    if (dbFilters.englishFluency.trim()) {
      const ef = dbFilters.englishFluency.toLowerCase().trim();
      result = result.filter(c => (c.englishProficiency || 'Basic').toLowerCase().includes(ef));
    }

    if (dbFilters.department.trim()) {
      const dept = dbFilters.department.toLowerCase().trim();
      result = result.filter(c => (c.department || c.jobTitle || '').toLowerCase().includes(dept));
    }

    if (dbFilters.noticePeriod.trim()) {
      const np = dbFilters.noticePeriod.toLowerCase().trim();
      result = result.filter(c => (c.noticePeriod || 'Immediate').toLowerCase().includes(np));
    }

    if (dbFilters.relocate) {
      result = result.filter(c => c.willingToRelocate !== false);
    }
    if (dbFilters.nightShift) {
      result = result.filter(c => c.shiftPreference !== 'Day only');
    }

    if (dbFilters.hasResume) {
      result = result.filter(c => Boolean(c.resumeUrl));
    }

    return result;
  }, [dbFilters]);

  /* ── Filtered candidates for selected job ── */
  const filteredJobCandidates = useMemo(() => {
    let list = jobApplications;

    // Filter by status tab
    if (selectedStatusTab === 'Under Review') {
      list = list.filter(a => a.status === 'Under Review' || a.status === 'Applied');
    } else if (selectedStatusTab === 'Shortlisted') {
      list = list.filter(a => a.status === 'Shortlisted');
    } else if (selectedStatusTab === 'Selected') {
      list = list.filter(a => a.status === 'Selected');
    } else if (selectedStatusTab === 'Rejected') {
      list = list.filter(a => a.status === 'Rejected');
    }

    return applyDbFilters(list);
  }, [jobApplications, selectedStatusTab, applyDbFilters]);

  /* ── Filtered candidates for Database Matches Search ── */
  const filteredDatabaseCandidates = useMemo(() => {
    return applyDbFilters(applications);
  }, [applications, applyDbFilters]);

  if (!user || (user.role !== 'admin' && user.role !== 'employer')) {
    return (
      <div className="apna-employer-page">
        <div className="container" style={{ paddingTop: '5rem', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-error)', marginBottom: '1rem' }}>
            Access Denied
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
            You do not have employer privileges to access the Employer Portal.
          </p>
          <Link to="/" className="btn btn-primary">Go to Candidate Portal Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="apna-employer-page">

      {/* Backdrop overlay for mobile drawer */}
      {sidebarOpen && (
        <div className="employer-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main Employer Layout: Left Sidebar + Right Content ── */}
      <div className="apna-employer-body">

        {/* ── Left Sidebar Navigation Drawer ── */}
        <aside className={`apna-sidebar${sidebarOpen ? ' mobile-open' : ''}`}>
          <div className="sidebar-mobile-header">
            <div className="sidebar-company-card">
              <div className="company-avatar">D</div>
              <div className="company-info">
                <span className="company-name">Diverse Solutions</span>
                <span className="company-role">Employer</span>
              </div>
            </div>
            <button
              className="sidebar-close-btn"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar menu"
            >
              ✕
            </button>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`sidebar-link ${activeTab === 'jobs' && !selectedJob ? 'active' : ''}`}
              onClick={() => { setActiveTab('jobs'); setSelectedJob(null); setSidebarOpen(false); }}
            >
              <span className="sidebar-icon">💼</span> Jobs
            </button>

            <button
              className={`sidebar-link ${activeTab === 'database' ? 'active' : ''}`}
              onClick={() => { setActiveTab('database'); setSelectedJob(null); setSidebarOpen(false); }}
            >
              <span className="sidebar-icon">👥</span> Database Matches
            </button>

            <button
              className={`sidebar-link ${activeTab === 'resumes' ? 'active' : ''}`}
              onClick={() => { setActiveTab('resumes'); setSelectedJob(null); setSidebarOpen(false); }}
            >
              <span className="sidebar-icon">📄</span> Resumes
            </button>

            <button
              className={`sidebar-link ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => { setActiveTab('reports'); setSelectedJob(null); setSidebarOpen(false); }}
            >
              <span className="sidebar-icon">📊</span> Reports
            </button>

            <button
              className={`sidebar-link ${activeTab === 'credits' ? 'active' : ''}`}
              onClick={() => { setActiveTab('credits'); setSelectedJob(null); setSidebarOpen(false); }}
            >
              <span className="sidebar-icon">💳</span> Credits & usage
            </button>

            <Link to="/" className="sidebar-link portal-switch-link" onClick={() => setSidebarOpen(false)}>
              <span className="sidebar-icon">🌐</span> Candidate Portal
            </Link>
          </nav>

          {/* Credits Box */}
          <div className="sidebar-promo-box">
            <div className="promo-icon">⚠️</div>
            <p><strong>Running low on credits?</strong> Buy credits to contact more candidates.</p>
            <button className="promo-btn">Buy credits</button>
          </div>
        </aside>

        {/* ── Right Content Area ── */}
        <main className="apna-main-content">

          {toast && <div className="apna-toast-banner">{toast}</div>}
          {apiError && <div className="apna-error-banner">❌ {apiError}</div>}

          {/* ══════════════════════════════════════════════════════════
              VIEW A: ALL JOBS LIST (Default Employer View)
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'jobs' && selectedJob === null && (
            <div className="all-jobs-container">
              <div className="all-jobs-header">
                <div className="all-jobs-title-wrap">
                  <button
                    className="employer-sidebar-hamburger"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open sidebar menu"
                    title="Menu"
                  >
                    <span>☰</span>
                  </button>
                  <h2>All Jobs ({allJobsList.length})</h2>
                </div>
                <button className="btn-post-job" onClick={() => setShowPostJobModal(true)}>
                  + Post a new job
                </button>
              </div>

              <div className="jobs-table-list">
                {allJobsList.map(job => {
                  const jobAppsCount = applications.filter(a => a.jobId === job.id || a.jobTitle === job.title).length;
                  const pendingCount = applications.filter(a => (a.jobId === job.id || a.jobTitle === job.title) && (a.status === 'Applied' || a.status === 'Under Review')).length;

                  return (
                    <div key={job.id} className="employer-job-row-card">
                      <div className="job-row-main" onClick={() => setSelectedJob(job)}>
                        <span className="star-icon">⭐</span>
                        <div>
                          <div className="job-row-title-wrap">
                            <h3 className="job-row-title">{job.title}</h3>
                            <span className={`status-pill ${job.isActive !== false ? 'active' : 'expired'}`}>
                              {job.isActive !== false ? 'Active' : 'Expired'}
                            </span>
                          </div>
                          <p className="job-row-meta">
                            {job.location} · Posted on : {job.postedDate || timeAgo(job.createdAt)} · {job.company || 'Diverse Solutions'}
                          </p>
                        </div>
                      </div>

                      <div className="job-row-metrics">
                        <div className="metric-box" onClick={() => setSelectedJob(job)}>
                          <span className="metric-value">{jobAppsCount}</span>
                          <span className="metric-label">{pendingCount > 0 ? `${pendingCount} pending` : 'Applied to job'}</span>
                        </div>
                        <div className="metric-divider" />
                        <div className="metric-box">
                          <span className="metric-value">2,224</span>
                          <span className="metric-label">Database Matches</span>
                        </div>
                      </div>

                      <div className="job-row-actions">
                        <button className="btn-action-outline" onClick={() => setSelectedJob(job)}>
                          View Candidates →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW B: SPECIFIC JOB APPLICANTS DETAILS VIEW
          ══════════════════════════════════════════════════════════ */}
          {selectedJob !== null && (
            <div className="job-details-applicant-view">

              {/* Back & Job Title Bar */}
              <div className="job-details-header-bar">
                <div className="job-details-nav-wrap">
                  <button
                    className="employer-sidebar-hamburger"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open sidebar menu"
                  >
                    <span>☰</span>
                  </button>
                  <button className="btn-back" onClick={() => setSelectedJob(null)}>
                    ← Back to All Jobs
                  </button>
                </div>
                <div className="job-title-meta-wrap">
                  <h2 className="job-detail-title">{selectedJob.title}</h2>
                  <span className="status-pill active">Active</span>
                  <span className="job-detail-location">📍 {selectedJob.location}</span>
                  <button className="btn-edit-job" onClick={() => setShowPostJobModal(true)}>Edit</button>
                </div>
                <div className="db-matches-link">
                  👥 See Database Matches (2,224) ›
                </div>
              </div>

              {/* Status Filter Cards */}
              <div className="status-filter-tabs-row">
                {[
                  { label: 'All candidates', key: 'All', count: jobApplications.length },
                  { label: 'Under Review', key: 'Under Review', count: jobApplications.filter(a => a.status === 'Applied' || a.status === 'Under Review').length },
                  { label: 'Shortlisted', key: 'Shortlisted', count: jobApplications.filter(a => a.status === 'Shortlisted').length },
                  { label: 'Selected', key: 'Selected', count: jobApplications.filter(a => a.status === 'Selected').length },
                  { label: 'Rejected', key: 'Rejected', count: jobApplications.filter(a => a.status === 'Rejected').length },
                ].map(tab => (
                  <button
                    key={tab.key}
                    className={`status-tab-card ${selectedStatusTab === tab.key ? 'selected' : ''}`}
                    onClick={() => setSelectedStatusTab(tab.key)}
                  >
                    <span className="status-tab-count">{tab.count}</span>
                    <span className="status-tab-label">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Grid: Left Filters Sidebar + Right Candidates Cards */}
              <div className="applicant-view-grid">

                {/* 18-Category Advanced Candidate Filter Sidebar */}
                <CandidateFilterSidebar
                  dbFilters={dbFilters}
                  setDbFilters={setDbFilters}
                  resetDbFilters={resetDbFilters}
                />

                {/* Right Candidates Cards List */}
                <div className="candidate-cards-list">

                  <div className="candidate-list-summary">
                    <span>Showing <strong>{filteredJobCandidates.length}</strong> candidates</span>
                    <button className="btn-download-excel" onClick={() => alert('Exporting candidate list...')}>
                      📥 Download Excel
                    </button>
                  </div>

                  {filteredJobCandidates.length > 0 ? (
                    filteredJobCandidates.map(candidate => {
                      const name = candidate.personalInfo?.name || 'Applicant';
                      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

                      return (
                        <div key={candidate.id} className="candidate-card animate-fade-in">
                          <div className="candidate-card-header">
                            <div className="candidate-profile-left">
                              {candidate.photoUrl ? (
                                <img
                                  src={candidate.photoUrl}
                                  alt={name}
                                  className="candidate-initials-avatar"
                                  style={{ objectFit: 'cover', border: '1px solid #cbd5e1' }}
                                />
                              ) : (
                                <div className="candidate-initials-avatar">{initials}</div>
                              )}
                              <div>
                                <div className="candidate-name-row">
                                  <h3 className="candidate-name">{name}</h3>
                                  <button className="btn-full-profile" onClick={() => setSelectedApp(candidate)}>
                                    View full profile ›
                                  </button>
                                </div>
                                <div className="candidate-sub-meta">
                                  <span>👤 {candidate.personalInfo?.gender || 'Male'}, {candidate.personalInfo?.dob ? '24 yr' : '26 yr'}</span>
                                  <span>• {selectedJob.experience || 'Fresher'}</span>
                                  <span>• 📍 {candidate.location || selectedJob.location}</span>
                                </div>
                              </div>
                            </div>
                            <span className="high-match-tag">✦ High Match</span>
                          </div>

                          {/* Requirement Match Pills */}
                          <div className="matching-pills-row">
                            <span className="matching-label">✦ Matching :</span>
                            <span className="match-pill">✓ Education</span>
                            <span className="match-pill">✓ English Proficiency</span>
                            <span className="match-pill">✓ Location</span>
                            <span className="match-pill">✓ Age</span>
                          </div>

                          {/* Candidate Specs */}
                          <div className="candidate-specs-grid">
                            <div><strong>🎓 Education:</strong> {candidate.roleData?.mbaCollege || candidate.personalInfo?.education || 'Graduate / MBA'}</div>
                            <div><strong>🗣️ Language:</strong> English (Basic), Hindi, Odia</div>
                          </div>

                          {/* Action Buttons Bar */}
                          <div className="candidate-card-actions">
                            <button
                              className="btn-action-primary"
                              onClick={() => setSelectedApp(candidate)}
                              title="View candidate details & files"
                            >
                              👁️ View Details
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-candidates-box">
                      <div className="empty-emoji">👥</div>
                      <h3>No candidates in this view yet</h3>
                      <p>Candidates applying for {selectedJob.title} will appear here instantly.</p>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW C: ALL APPLICATIONS / DATABASE
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'database' && (
            <div className="all-jobs-container">
              <div className="all-jobs-title-wrap" style={{ marginBottom: '1.25rem' }}>
                <button
                  className="employer-sidebar-hamburger"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open sidebar menu"
                >
                  <span>☰</span>
                </button>
                <h2>Database Matches & Candidate Search ({filteredDatabaseCandidates.length})</h2>
              </div>

              <div className="applicant-view-grid">
                {/* 18-Category Advanced Candidate Filter Sidebar */}
                <CandidateFilterSidebar
                  dbFilters={dbFilters}
                  setDbFilters={setDbFilters}
                  resetDbFilters={resetDbFilters}
                />

                {/* Candidate Results List */}
                <div className="candidate-cards-list">
                  <div className="candidate-list-summary">
                    <span>Showing <strong>{filteredDatabaseCandidates.length}</strong> matched candidates</span>
                    <button className="btn-download-excel" onClick={() => alert('Exporting candidate database...')}>
                      📥 Download Excel
                    </button>
                  </div>

                  {filteredDatabaseCandidates.length > 0 ? (
                    filteredDatabaseCandidates.map(app => (
                      <div key={app.id} className="candidate-card animate-fade-in">
                        <div className="candidate-card-header">
                          <div className="candidate-profile-left">
                            {app.photoUrl ? (
                              <img src={app.photoUrl} alt={app.personalInfo?.name} className="candidate-initials-avatar" style={{ objectFit: 'cover', border: '1px solid #cbd5e1' }} />
                            ) : (
                              <div className="candidate-initials-avatar">
                                {app.personalInfo?.name ? app.personalInfo.name.charAt(0).toUpperCase() : '👤'}
                              </div>
                            )}
                            <div>
                              <div className="candidate-name-row">
                                <h3 className="candidate-name">{app.personalInfo?.name || 'Applicant'}</h3>
                                <button className="btn-full-profile" onClick={() => setSelectedApp(app)}>
                                  View full profile ›
                                </button>
                              </div>
                              <div className="candidate-sub-meta">
                                <span>👤 {app.personalInfo?.gender || 'Male'}, {app.personalInfo?.dob ? '24 yr' : '26 yr'}</span>
                                <span>• {app.experience || 'Fresher'}</span>
                                <span>• 📍 {app.location || 'Bhubaneswar, Odisha'}</span>
                              </div>
                            </div>
                          </div>
                          <span className="high-match-tag">✦ High Match</span>
                        </div>

                        {/* Requirement Match Pills */}
                        <div className="matching-pills-row">
                          <span className="matching-label">✦ Highlights :</span>
                          <span className="match-pill">✓ Education</span>
                          <span className="match-pill">✓ English Proficiency</span>
                          <span className="match-pill">✓ Location</span>
                          <span className="match-pill">✓ Department: {app.department || app.jobTitle}</span>
                        </div>

                        {/* Candidate Specs */}
                        <div className="candidate-specs-grid">
                          <div><strong>🎓 Education:</strong> {app.roleData?.mbaCollege || app.personalInfo?.education || 'Graduate / MBA'}</div>
                          <div><strong>🗣️ Language:</strong> English (Basic), Hindi, Odia</div>
                        </div>

                        {/* Action Buttons Bar */}
                        <div className="candidate-card-actions">
                          <button
                            className="btn-action-primary"
                            onClick={() => setSelectedApp(app)}
                            title="View candidate details & files"
                          >
                            👁️ View Details
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-candidates-box">
                      <div className="empty-emoji">👥</div>
                      <h3>No candidates matched your search criteria</h3>
                      <p>Try clearing or broadening some filters in the left sidebar.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW RESUMES MANAGEMENT (Uploaded + Applied Candidate Resumes)
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'resumes' && (
            <div className="all-jobs-container">
              <div className="reports-header-row">
                <div className="all-jobs-title-wrap">
                  <button
                    className="employer-sidebar-hamburger"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open sidebar menu"
                  >
                    <span>☰</span>
                  </button>
                  <h2>Student & Candidate Resumes ({filteredResumes.length})</h2>
                </div>
                <button className="btn-post-job" onClick={() => setShowUploadResumeModal(true)}>
                  + Upload Student Resume
                </button>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="resumes-toolbar">
                <div className="resumes-search-wrap">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search by student name, email, department..."
                    value={resumeSearch}
                    onChange={e => setResumeSearch(e.target.value)}
                    className="resumes-search-input"
                  />
                  {resumeSearch && (
                    <button className="search-clear-btn" onClick={() => setResumeSearch('')}>✕</button>
                  )}
                </div>

                <div className="resumes-toolbar-controls">
                  <div className="resumes-source-tabs">
                    <button
                      className={`source-tab-btn ${resumeSourceFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setResumeSourceFilter('all')}
                    >
                      All ({resumesList.length})
                    </button>
                    <button
                      className={`source-tab-btn ${resumeSourceFilter === 'uploaded' ? 'active' : ''}`}
                      onClick={() => setResumeSourceFilter('uploaded')}
                    >
                      📤 Employer Uploaded ({resumesList.filter(r => r.source === 'uploaded_by_employer').length})
                    </button>
                    <button
                      className={`source-tab-btn ${resumeSourceFilter === 'applied' ? 'active' : ''}`}
                      onClick={() => setResumeSourceFilter('applied')}
                    >
                      📋 Job Applications ({resumesList.filter(r => r.source === 'applied_candidate').length})
                    </button>
                  </div>

                  {/* View Switcher Toggle */}
                  <div className="resume-view-toggle">
                    <button
                      className={`view-toggle-btn ${resumeViewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setResumeViewMode('list')}
                      title="List View"
                    >
                      ☰ List View
                    </button>
                    <button
                      className={`view-toggle-btn ${resumeViewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setResumeViewMode('grid')}
                      title="Grid Card View"
                    >
                      🔲 Grid Box
                    </button>
                  </div>
                </div>
              </div>

              {/* Resumes Content (List or Grid View) */}
              <div className="resumes-content-wrap" style={{ marginTop: '1.25rem' }}>
                {resumesLoading ? (
                  resumeViewMode === 'list' ? (
                    <div className="resumes-table-container">
                      <table className="resumes-table">
                        <thead>
                          <tr>
                            <th>Candidate & Student</th>
                            <th>Contact Info</th>
                            <th>Department</th>
                            <th>Source</th>
                            <th>File Attached</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[1, 2, 3, 4, 5].map(i => (
                            <tr key={i} className="resume-table-row">
                              <td>
                                <div className="resume-table-candidate" style={{ gap: '10px' }}>
                                  <div className="resume-skeleton-box resume-skeleton-avatar" />
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '140px' }}>
                                    <div className="resume-skeleton-box resume-skeleton-line" style={{ width: '80%' }} />
                                    <div className="resume-skeleton-box resume-skeleton-line" style={{ width: '50%' }} />
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '120px' }}>
                                  <div className="resume-skeleton-box resume-skeleton-line" style={{ width: '90%' }} />
                                  <div className="resume-skeleton-box resume-skeleton-line" style={{ width: '60%' }} />
                                </div>
                              </td>
                              <td>
                                <div className="resume-skeleton-box resume-skeleton-line" style={{ width: '100px', height: '20px', borderRadius: '6px' }} />
                              </td>
                              <td>
                                <div className="resume-skeleton-box resume-skeleton-line" style={{ width: '110px', height: '18px', borderRadius: '9999px' }} />
                              </td>
                              <td>
                                <div className="resume-skeleton-box resume-skeleton-line" style={{ width: '130px' }} />
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div className="resume-skeleton-box resume-skeleton-line" style={{ width: '80px', height: '28px', borderRadius: '6px', marginLeft: 'auto' }} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="resumes-grid">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="resume-skeleton-card">
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div className="resume-skeleton-box resume-skeleton-avatar" />
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div className="resume-skeleton-box resume-skeleton-line" style={{ width: '70%', height: '14px' }} />
                              <div className="resume-skeleton-box resume-skeleton-line" style={{ width: '50%' }} />
                            </div>
                          </div>
                          <div className="resume-skeleton-box resume-skeleton-line" style={{ width: '90px', height: '18px' }} />
                          <div className="resume-skeleton-box resume-skeleton-line" style={{ width: '100%', height: '36px', borderRadius: '6px' }} />
                        </div>
                      ))}
                    </div>
                  )
                ) : filteredResumes.length === 0 ? (
                  <div className="no-candidates-box">
                    <div className="empty-emoji">📄</div>
                    <h3>No resumes found</h3>
                    <p>Click "+ Upload Student Resume" to add student resumes to your database.</p>
                  </div>
                ) : resumeViewMode === 'list' ? (
                  /* ── LIST / TABLE VIEW ── */
                  <div className="resumes-table-container animate-fade-in">
                    <table className="resumes-table">
                      <thead>
                        <tr>
                          <th>Candidate & Student</th>
                          <th>Contact Info</th>
                          <th>Department</th>
                          <th>Source</th>
                          <th>File Attached</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResumes.map(r => {
                          const initials = (r.name || 'Student').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                          return (
                            <tr key={r.id} className="resume-table-row">
                              <td>
                                <div className="resume-table-candidate">
                                  <div className="resume-avatar-sm">{initials}</div>
                                  <div>
                                    <div className="resume-candidate-name">{r.name}</div>
                                    {r.notes && (
                                      <div className="resume-table-note" title={r.notes}>
                                        💡 {r.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="resume-table-contact">
                                  <div>📧 {r.email}</div>
                                  {r.phone && r.phone !== '—' && <div className="sub-phone">📞 {r.phone}</div>}
                                </div>
                              </td>
                              <td>
                                <span className="resume-dept-tag">🎓 {r.department}</span>
                              </td>
                              <td>
                                <span className={`source-badge ${r.source}`}>
                                  {r.source === 'uploaded_by_employer' ? '📤 Employer Uploaded' : '📋 Applied Candidate'}
                                </span>
                              </td>
                              <td>
                                <span className="resume-file-name-full" title={r.resumeName}>
                                  📄 {r.resumeName}
                                </span>
                              </td>
                              <td>
                                <div className="resume-table-actions">
                                  <a
                                    href={r.resumeUrl}
                                    download={r.resumeName}
                                    className="btn-action-primary btn-sm"
                                    style={{ textDecoration: 'none' }}
                                  >
                                    ⬇️ Download
                                  </a>
                                  {r.canDelete && (
                                    <button
                                      className="btn-delete-icon"
                                      onClick={() => handleDeleteResume(r.id, r.source)}
                                      title={r.source === 'applied_candidate' ? 'Delete candidate job application' : 'Delete uploaded student resume'}
                                    >
                                      🗑️
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* ── GRID / CARD VIEW ── */
                  <div className="resumes-grid">
                    {filteredResumes.map(r => {
                      const initials = (r.name || 'Student').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                      return (
                        <div key={r.id} className="resume-card animate-fade-in">
                          <div className="resume-card-header">
                            <div className="resume-avatar">{initials}</div>
                            <div className="resume-meta-info">
                              <h3 className="resume-candidate-name">{r.name}</h3>
                              <div className="resume-sub-detail">
                                <span>📧 {r.email}</span>
                                {r.phone && r.phone !== '—' && <span> • 📞 {r.phone}</span>}
                              </div>
                              <div className="resume-dept-tag">
                                🎓 {r.department}
                              </div>
                            </div>
                            <span className={`source-badge ${r.source}`}>
                              {r.source === 'uploaded_by_employer' ? '📤 Employer Uploaded' : '📋 Applied Candidate'}
                            </span>
                          </div>

                          {r.notes && (
                            <p className="resume-notes-box">
                              💡 <strong>Notes:</strong> {r.notes}
                            </p>
                          )}

                          <div className="resume-card-footer">
                            <span className="resume-file-name" title={r.resumeName}>
                              📄 {r.resumeName}
                            </span>

                            <div className="resume-actions-group">
                              <a
                                href={r.resumeUrl}
                                download={r.resumeName}
                                className="btn-action-primary"
                                style={{ textDecoration: 'none', padding: '6px 14px', fontSize: '13px' }}
                              >
                                ⬇️ Download
                              </a>
                              {r.canDelete && (
                                <button
                                  className="btn-delete-icon"
                                  onClick={() => handleDeleteResume(r.id, r.source)}
                                  title={r.source === 'applied_candidate' ? 'Delete candidate job application' : 'Delete uploaded student resume'}
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW D: REPORTS & ANALYTICS
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'reports' && (
            <div className="all-jobs-container">
              <div className="reports-header-row">
                <div className="all-jobs-title-wrap">
                  <button
                    className="employer-sidebar-hamburger"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open sidebar menu"
                  >
                    <span>☰</span>
                  </button>
                  <h2>Employer Reports & Analytics</h2>
                </div>
                <div className="reports-action-group">
                  <select className="reports-time-select" defaultValue="30">
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                  </select>
                  <button className="btn-action-primary" onClick={() => alert('Downloading Employer Performance Report...')}>
                    📥 Export Report
                  </button>
                </div>
              </div>

              {/* KPI Stat Cards Grid */}
              <div className="reports-kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-icon-wrap" style={{ background: '#e0f2fe', color: '#0284c7' }}>👥</div>
                  <div className="kpi-content">
                    <span className="kpi-label">Total Applications</span>
                    <div className="kpi-value-row">
                      <span className="kpi-value">{applications.length}</span>
                      <span className="kpi-trend positive">+18% ↑</span>
                    </div>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-icon-wrap" style={{ background: '#dcfce7', color: '#16a34a' }}>💼</div>
                  <div className="kpi-content">
                    <span className="kpi-label">Active Job Openings</span>
                    <div className="kpi-value-row">
                      <span className="kpi-value">{allJobsList.length}</span>
                      <span className="kpi-sub">8 Published</span>
                    </div>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>⭐</div>
                  <div className="kpi-content">
                    <span className="kpi-label">Shortlisted Candidates</span>
                    <div className="kpi-value-row">
                      <span className="kpi-value">
                        {applications.filter(a => a.status === 'Shortlisted' || a.status === 'Selected').length}
                      </span>
                      <span className="kpi-sub">Top Tier</span>
                    </div>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-icon-wrap" style={{ background: '#f3e8ff', color: '#9333ea' }}>⚡</div>
                  <div className="kpi-content">
                    <span className="kpi-label">Avg. Response Time</span>
                    <div className="kpi-value-row">
                      <span className="kpi-value">24 hrs</span>
                      <span className="kpi-trend positive">Top 5%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hiring Funnel & Analytics Grid */}
              <div className="reports-grid-2">

                {/* Hiring Funnel Breakdown */}
                <div className="reports-panel">
                  <h3 className="reports-panel-title">🎯 Hiring Conversion Funnel</h3>
                  <div className="funnel-list">
                    {[
                      { label: 'Applications Received', count: applications.length, percent: 100, color: '#0284c7' },
                      { label: 'Under Review', count: applications.filter(a => a.status === 'Applied' || a.status === 'Under Review').length, percent: 75, color: '#0f766e' },
                      { label: 'Shortlisted', count: applications.filter(a => a.status === 'Shortlisted').length, percent: 35, color: '#d97706' },
                      { label: 'Selected / Hired', count: applications.filter(a => a.status === 'Selected').length, percent: 15, color: '#16a34a' },
                      { label: 'Rejected', count: applications.filter(a => a.status === 'Rejected').length, percent: 10, color: '#dc2626' },
                    ].map(f => (
                      <div key={f.label} className="funnel-item">
                        <div className="funnel-item-header">
                          <span className="funnel-label">{f.label}</span>
                          <span className="funnel-count">{f.count} candidates ({f.percent}%)</span>
                        </div>
                        <div className="funnel-bar-track">
                          <div
                            className="funnel-bar-fill"
                            style={{ width: `${Math.max(f.percent, 8)}%`, background: f.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Job Openings Breakdown */}
                <div className="reports-panel">
                  <h3 className="reports-panel-title">📈 Top Performing Openings</h3>
                  <div className="top-jobs-list">
                    {allJobsList.slice(0, 4).map(j => {
                      const count = applications.filter(a => a.jobId === j.id || a.jobTitle === j.title).length;
                      return (
                        <div key={j.id} className="top-job-item">
                          <div className="top-job-info">
                            <div className="top-job-title">{j.title}</div>
                            <div className="top-job-sub">{j.location} · {j.category || j.department}</div>
                          </div>
                          <div className="top-job-metric">
                            <span className="metric-badge">{count} Applicants</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW E: CREDITS & USAGE
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'credits' && (
            <div className="all-jobs-container">
              <div className="all-jobs-title-wrap" style={{ marginBottom: '1.25rem' }}>
                <button
                  className="employer-sidebar-hamburger"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open sidebar menu"
                >
                  <span>☰</span>
                </button>
                <h2>Credits & Billing Dashboard</h2>
              </div>

              {/* Credit Balance Box */}
              <div className="credit-balance-card">
                <div className="balance-main">
                  <div>
                    <span className="balance-title">Available Candidate Credits</span>
                    <div className="balance-amount">100 <span>Credits</span></div>
                    <p className="balance-sub">Use credits to view candidate contact info and download full resumes.</p>
                  </div>
                  <button className="btn-post-job" onClick={() => showToast('Redirecting to recharge gateway...')}>
                    + Buy Extra Credits
                  </button>
                </div>
              </div>

              {/* Recharge Packages Grid */}
              <div className="credit-packages-grid">
                <div className="package-card">
                  <div className="package-name">Starter Pack</div>
                  <div className="package-price">₹999</div>
                  <div className="package-credits">50 Candidate Credits</div>
                  <ul className="package-features">
                    <li>✓ Direct Resume Access</li>
                    <li>✓ Candidate Contact Details</li>
                    <li>✓ Valid for 90 Days</li>
                  </ul>
                  <button className="btn-action-outline" style={{ width: '100%', marginTop: '1rem' }}>Select Pack</button>
                </div>

                <div className="package-card featured">
                  <div className="featured-badge">MOST POPULAR</div>
                  <div className="package-name">Growth Pack</div>
                  <div className="package-price">₹3,999</div>
                  <div className="package-credits">250 Candidate Credits</div>
                  <ul className="package-features">
                    <li>✓ Unlimited Database Search</li>
                    <li>✓ WhatsApp Direct Contact</li>
                    <li>✓ Priority Resume Download</li>
                    <li>✓ Valid for 365 Days</li>
                  </ul>
                  <button className="btn-action-primary" style={{ width: '100%', marginTop: '1rem' }}>Buy Growth Pack</button>
                </div>

                <div className="package-card">
                  <div className="package-name">Enterprise Pack</div>
                  <div className="package-price">₹9,999 <span style={{ fontSize: '12px', fontWeight: 400 }}>/mo</span></div>
                  <div className="package-credits">Unlimited Credits</div>
                  <ul className="package-features">
                    <li>✓ Dedicated Account Manager</li>
                    <li>✓ Custom Assessment Filters</li>
                    <li>✓ Guaranteed Candidates</li>
                  </ul>
                  <button className="btn-action-outline" style={{ width: '100%', marginTop: '1rem' }}>Contact Sales</button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── Candidate Full Details Modal ── */}
      {selectedApp && (
        <div className="admin-modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setSelectedApp(null)} aria-label="Close modal">✕</button>

            <div className="admin-modal-header">
              <div className="admin-modal-profile">
                {selectedApp.photoUrl ? (
                  <img
                    src={selectedApp.photoUrl}
                    alt={selectedApp.personalInfo?.name || 'Candidate'}
                    className="admin-modal-avatar"
                  />
                ) : (
                  <div className="admin-modal-avatar-placeholder">
                    {selectedApp.personalInfo?.name ? selectedApp.personalInfo.name.charAt(0).toUpperCase() : '👤'}
                  </div>
                )}
                <div>
                  <h2 className="admin-modal-name">{selectedApp.personalInfo?.name || '—'}</h2>
                  <p className="admin-modal-subtitle">
                    Applied for <strong>{selectedApp.jobTitle}</strong> ({selectedApp.department})
                  </p>
                </div>
              </div>
              <div className="admin-modal-status-section">
                <select
                  className={`status-update-select ${selectedApp.status.replace(/\s+/g, '-')}`}
                  value={selectedApp.status}
                  onChange={e => {
                    handleStatusChange(selectedApp.id, e.target.value);
                    setSelectedApp(prev => ({ ...prev, status: e.target.value }));
                  }}
                  aria-label="Update candidate status"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="admin-modal-body">
              <div className="admin-modal-section">
                <h3 className="admin-modal-section-title">👤 Personal Information</h3>
                <div className="admin-modal-info-grid">
                  <div className="admin-modal-info-item">
                    <span className="info-label">Email</span>
                    <span className="info-value">{selectedApp.personalInfo?.email || '—'}</span>
                  </div>
                  <div className="admin-modal-info-item">
                    <span className="info-label">Phone</span>
                    <span className="info-value">{selectedApp.personalInfo?.phone ? `+91 ${selectedApp.personalInfo.phone}` : '—'}</span>
                  </div>
                  <div className="admin-modal-info-item">
                    <span className="info-label">Date of Birth</span>
                    <span className="info-value">{selectedApp.personalInfo?.dob || '—'}</span>
                  </div>
                  <div className="admin-modal-info-item">
                    <span className="info-label">Gender</span>
                    <span className="info-value">{selectedApp.personalInfo?.gender || '—'}</span>
                  </div>
                  <div className="admin-modal-info-item">
                    <span className="info-label">Location</span>
                    <span className="info-value">{selectedApp.location || '—'}</span>
                  </div>
                  <div className="admin-modal-info-item">
                    <span className="info-label">Applied Date</span>
                    <span className="info-value">{new Date(selectedApp.appliedAt).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {selectedApp.roleData && Object.keys(selectedApp.roleData).length > 0 && (
                <div className="admin-modal-section">
                  <h3 className="admin-modal-section-title">🎯 Professional / Role Details</h3>
                  <div className="admin-modal-role-grid">
                    {Object.entries(selectedApp.roleData).map(([key, val]) => (
                      <div key={key} className="admin-modal-role-item">
                        <span className="role-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                        <span className="role-value" style={{ whiteSpace: 'pre-wrap' }}>{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="admin-modal-section">
                <h3 className="admin-modal-section-title">📁 Candidate Files</h3>
                <div className="admin-modal-files-list">
                  {selectedApp.photoUrl && (
                    <div className="admin-modal-file-card">
                      <div className="file-card-preview-wrap">
                        <img src={selectedApp.photoUrl} alt="Preview" className="file-card-img-preview" />
                      </div>
                      <div className="file-card-details">
                        <div className="file-card-name" title={selectedApp.photoName || 'Profile Photo'}>
                          🖼️ {selectedApp.photoName || 'Profile Photo.jpg'}
                        </div>
                        <div className="file-card-meta">Profile Photo (Image)</div>
                      </div>
                      <div className="file-card-actions">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => openBase64InNewTab(selectedApp.photoUrl)}
                          style={{ cursor: 'pointer' }}
                        >
                          👁️ View Full
                        </button>
                        <a
                          href={selectedApp.photoUrl}
                          download={selectedApp.photoName || 'photo.jpg'}
                          className="btn btn-primary btn-sm"
                          style={{ textDecoration: 'none' }}
                        >
                          ⬇️ Download
                        </a>
                      </div>
                    </div>
                  )}

                  {selectedApp.resumeUrl && (
                    <div className="admin-modal-file-card">
                      <div className="file-card-preview-wrap document-icon-wrap">
                        <span className="document-large-icon">📄</span>
                      </div>
                      <div className="file-card-details">
                        <div className="file-card-name" title={selectedApp.resumeName || 'Resume.pdf'}>
                          📄 {selectedApp.resumeName || 'Resume.pdf'}
                        </div>
                        <div className="file-card-meta">Candidate Resume (PDF)</div>
                      </div>
                      <div className="file-card-actions">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => openBase64InNewTab(selectedApp.resumeUrl)}
                          style={{ cursor: 'pointer' }}
                        >
                          👁️ View PDF
                        </button>
                        <a
                          href={selectedApp.resumeUrl}
                          download={selectedApp.resumeName || 'resume.pdf'}
                          className="btn btn-primary btn-sm"
                          style={{ textDecoration: 'none' }}
                        >
                          ⬇️ Download
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Post New Job Modal (Apna Employer Wizard) ── */}
      {showPostJobModal && (
        <div className="admin-modal-overlay" onClick={() => setShowPostJobModal(false)}>
          <div className="admin-modal-content" style={{ maxWidth: '850px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowPostJobModal(false)} aria-label="Close modal">✕</button>
            <EmployerJobPosting
              onJobCreated={(newJob) => {
                refreshJobs();
                showToast(`✅ Job "${newJob.title}" Published Successfully!`);
              }}
              onClose={() => setShowPostJobModal(false)}
            />
          </div>
        </div>
      )}

      {/* ── Upload Student Resume Modal (Multi-File Drag & Drop) ── */}
      {showUploadResumeModal && (
        <div className="admin-modal-overlay" onClick={() => setShowUploadResumeModal(false)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px', padding: '1.75rem' }}>
            <div className="admin-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>📤 Upload Student Resumes</h3>
              <button className="admin-modal-close" onClick={() => setShowUploadResumeModal(false)} aria-label="Close modal">✕</button>
            </div>

            <form onSubmit={handleUploadResumeSubmit}>
              {/* Drag & Drop Zone Box */}
              <div
                className={`resume-dropzone-box ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: isDragging ? '2px dashed #168a67' : '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  background: isDragging ? '#dcfce7' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ fontSize: '2.8rem', marginBottom: '8px' }}>📁</div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
                  Drag & Drop Multiple Resumes Here
                </h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>
                  Select multiple PDF, DOCX, PNG, JPG files at once (Batch Upload)
                </p>

                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleResumeFileChange}
                  style={{ display: 'none' }}
                  id="resume-file-input-multi"
                />

                <label htmlFor="resume-file-input-multi" className="btn-action-primary" style={{ cursor: 'pointer', display: 'inline-block', padding: '8px 22px' }}>
                  📁 Browse Files (Multiple)
                </label>
              </div>

              {/* Selected Files Batch List */}
              {uploadFilesList.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                      Selected Files ({uploadFilesList.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setUploadFilesList([])}
                      style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Clear All
                    </button>
                  </div>

                  <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
                    {uploadFilesList.map((fileItem, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 12px',
                          background: '#f1f5f9',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <span>📄</span>
                          <span style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                            {fileItem.name}
                          </span>
                          <span style={{ color: '#64748b', fontSize: '11px' }}>
                            ({(fileItem.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFileFromBatch(idx)}
                          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', padding: '0 4px' }}
                          title="Remove file"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-actions-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-action-outline" onClick={() => setShowUploadResumeModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-post-job" disabled={uploadingResume || uploadFilesList.length === 0}>
                  {uploadingResume
                    ? `Uploading ${uploadFilesList.length} Resume(s)...`
                    : `💾 Upload ${uploadFilesList.length > 0 ? `${uploadFilesList.length} Resume(s)` : 'Resumes'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
