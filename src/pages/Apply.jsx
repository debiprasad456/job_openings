import React, { useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { JOBS } from '../data/jobs';
import DynamicForm from '../components/DynamicForm';

import '../styles/apply.css';

const STEPS = [
  { num: 1, label: 'Personal Info' },
  { num: 2, label: 'Professional Details' },
  { num: 3, label: 'Documents & Submit' },
];

const EMPTY_PERSONAL = { firstName: '', lastName: '', email: '', phone: '', dob: '', gender: '' };

export default function Apply() {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const job = JOBS.find(j => j.id === jobId);

  const [step, setStep] = useState(1);
  const [personal, setPersonal] = useState({
    ...EMPTY_PERSONAL,
    firstName: user?.name?.split(' ')[0] || '',
    lastName:  user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [roleFields, setRoleFields] = useState({});
  const [resume, setResume]   = useState(null);
  const [photo, setPhoto]     = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [appId, setAppId]     = useState('');
  const [apiError, setApiError] = useState('');
  const resumeRef = useRef();
  const photoRef  = useRef();

  const [resumeData, setResumeData] = useState(null);
  const [myApplications, setMyApplications] = useState([]);
  const [fetchingApplied, setFetchingApplied] = useState(true);

  // ── Already applied? ──
  const alreadyApplied = user && job && myApplications.some(a => a.jobId === job.id);

  React.useEffect(() => {
    if (!user) {
      setFetchingApplied(false);
      return;
    }
    const checkApplied = async () => {
      try {
        const token = localStorage.getItem('ds_token');
        const res = await fetch('/api/applications/mine', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const apps = await res.json();
          setMyApplications(apps);
        }
      } catch (err) {
        console.error('Error checking application status:', err);
      } finally {
        setFetchingApplied(false);
      }
    };
    checkApplied();
  }, [user]);

  // ── Job not found ──
  if (!job) {
    return (
      <div className="apply-page">
        <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'var(--text-3xl)', color: 'var(--color-navy)', fontFamily: 'var(--font-heading)' }}>Job Not Found</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: '1rem 0 2rem' }}>This job listing may have been removed or the link is incorrect.</p>
          <Link to="/" className="btn btn-primary">Browse All Jobs</Link>
        </div>
      </div>
    );
  }

  // ── Validate Step 1 ──
  const validatePersonal = () => {
    const e = {};
    if (!personal.firstName.trim()) e.firstName = 'First name is required.';
    if (!personal.lastName.trim())  e.lastName  = 'Last name is required.';
    if (!personal.email.trim() || !/\S+@\S+\.\S+/.test(personal.email)) e.email = 'Valid email is required.';
    if (!personal.phone.trim() || !/^[6-9]\d{9}$/.test(personal.phone)) e.phone = 'Valid 10-digit mobile number required.';
    if (!personal.dob)    e.dob    = 'Date of birth is required.';
    if (!personal.gender) e.gender = 'Gender is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Validate Step 2 (required role fields) ──
  const validateRole = () => {
    const e = {};
    job.formSchema.filter(f => f.required).forEach(f => {
      if (!roleFields[f.fieldName] || !roleFields[f.fieldName].toString().trim()) {
        e[f.fieldName] = `${f.label} is required.`;
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Validate Step 3 ──
  const validateDocuments = () => {
    const e = {};
    if (!resume) e.resume = 'Please upload your resume (PDF).';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    setApiError('');
    if (step === 1 && !validatePersonal()) return;
    if (step === 2 && !validateRole()) return;
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setErrors({});
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { setErrors(prev => ({ ...prev, resume: 'Only PDF files are accepted.' })); return; }
    if (file.size > 5 * 1024 * 1024) { setErrors(prev => ({ ...prev, resume: 'File size must be under 5 MB.' })); return; }
    setResume(file);
    setErrors(prev => ({ ...prev, resume: '' }));

    const reader = new FileReader();
    reader.onload = ev => setResumeData(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!validateDocuments()) return;
    setLoading(true);
    setApiError('');
    try {
      const token = localStorage.getItem('ds_token');
      const res = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId:   user.id,
          jobId:    job.id,
          jobTitle: job.title,
          department: job.department,
          location: job.location,
          personalInfo: {
            name:  `${personal.firstName} ${personal.lastName}`,
            email: personal.email,
            phone: personal.phone,
            dob:   personal.dob,
            gender: personal.gender,
          },
          roleData: roleFields,
          resumeUrl: resumeData,
          photoUrl: photoPreview || '',
          resumeName: resume?.name || '',
          photoName:  photo?.name  || '',
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application.');
      }
      setAppId(data.id);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ──
  if (submitted) {
    return (
      <div className="apply-page">
        <div className="apply-body">
          <div className="container">
            <div className="apply-form-card">
              <div className="apply-success">
                <div className="apply-success-icon">🎉</div>
                <h1 className="apply-success-title">Application Submitted!</h1>
                <p className="apply-success-msg">
                  Congratulations! Your application for <strong>{job.title}</strong> has been received.
                  Our HR team will review your profile and reach out within <strong>7 working days</strong>.
                </p>
                <div className="apply-success-id">📋 Application ID: {appId}</div>
                <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/dashboard" className="btn btn-primary btn-lg">View My Applications</Link>
                  <Link to="/" className="btn btn-outline-navy btn-lg">Browse More Jobs</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="apply-page">

      {/* ── Header ── */}
      <div className="apply-header">
        <div className="container">
          <div className="apply-header-content">
            <nav className="apply-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Jobs</Link>
              <span className="apply-breadcrumb-sep">›</span>
              <span className="apply-breadcrumb-current">Apply — {job.title}</span>
            </nav>

            <div className="apply-job-card">
              <img src="/assets/logo.png" alt="Diverse Solutions" className="apply-job-logo" />
              <div className="apply-job-info">
                <h1 className="apply-job-title">{job.title}</h1>
                <div className="apply-job-company">Diverse Solutions Pvt. Ltd. · {job.department}</div>
                <div className="apply-job-meta">
                  <div className="apply-meta-item">📍 {job.location}</div>
                  <div className="apply-meta-item">💼 {job.experience}</div>
                  <div className="apply-meta-item">💰 {job.salary}</div>
                  <div className="apply-meta-item">
                    <span className="badge badge-orange">{job.type}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Already Applied Banner ── */}
      {alreadyApplied && (
        <div style={{ background: 'var(--color-warning-bg)', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-4) 0' }}>
          <div className="container">
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-warning)', fontWeight: 'var(--fw-semibold)' }}>
              ⚠️ You have already applied for this position.{' '}
              <Link to="/dashboard" style={{ color: 'var(--color-primary)' }}>View your application →</Link>
            </p>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="apply-body">
        <div className="container">
          <div className="apply-grid">

            {/* ── Left: Form ── */}
            <div>
              {/* Step Indicator */}
              <div className="step-indicator" style={{ marginBottom: 'var(--space-12)' }} role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3}>
                {STEPS.map((s, idx) => (
                  <React.Fragment key={s.num}>
                    <div className={`step-item${step === s.num ? ' active' : step > s.num ? ' done' : ''}`}>
                      <div className="step-circle">
                        {step > s.num ? '✓' : s.num}
                      </div>
                      <span className="step-label">{s.label}</span>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className={`step-line${step > s.num ? ' done' : ''}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Form Card */}
              <div className="apply-form-card">

                {apiError && (
                  <div className="auth-error" role="alert" style={{ marginBottom: 'var(--space-5)' }}>
                    ❌ {apiError}
                  </div>
                )}

                {/* ── STEP 1: Personal Info ── */}
                {step === 1 && (
                  <div>
                    <div className="apply-step-header">
                      <div className="apply-step-number">Step 1 of 3 · Personal Details</div>
                      <h2 className="apply-step-title">Tell us about yourself</h2>
                      <p className="apply-step-subtitle">Basic personal information for your application.</p>
                    </div>

                    <div className="form-section">
                      <div className="form-grid-2">
                        {/* First Name */}
                        <div className="form-group">
                          <label className="form-label required" htmlFor="p-fname">First Name</label>
                          <input id="p-fname" type="text" className="form-input" placeholder="Rahul"
                            value={personal.firstName} onChange={e => { setPersonal(p => ({...p, firstName: e.target.value})); setErrors(er => ({...er, firstName:''})); }}
                            style={{ borderColor: errors.firstName ? 'var(--color-error)' : '' }} />
                          {errors.firstName && <span className="form-error">{errors.firstName}</span>}
                        </div>
                        {/* Last Name */}
                        <div className="form-group">
                          <label className="form-label required" htmlFor="p-lname">Last Name</label>
                          <input id="p-lname" type="text" className="form-input" placeholder="Sharma"
                            value={personal.lastName} onChange={e => { setPersonal(p => ({...p, lastName: e.target.value})); setErrors(er => ({...er, lastName:''})); }}
                            style={{ borderColor: errors.lastName ? 'var(--color-error)' : '' }} />
                          {errors.lastName && <span className="form-error">{errors.lastName}</span>}
                        </div>
                        {/* Email */}
                        <div className="form-group">
                          <label className="form-label required" htmlFor="p-email">Email Address</label>
                          <input id="p-email" type="email" className="form-input" placeholder="you@email.com"
                            value={personal.email} onChange={e => { setPersonal(p => ({...p, email: e.target.value})); setErrors(er => ({...er, email:''})); }}
                            style={{ borderColor: errors.email ? 'var(--color-error)' : '' }} />
                          {errors.email && <span className="form-error">{errors.email}</span>}
                        </div>
                        {/* Phone */}
                        <div className="form-group">
                          <label className="form-label required" htmlFor="p-phone">Mobile Number</label>
                          <div style={{ display:'flex', gap:'var(--space-2)' }}>
                            <span style={{ display:'flex',alignItems:'center',padding:'0 10px',background:'var(--color-surface-alt)',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-md)',fontSize:'var(--text-sm)',color:'var(--color-text-secondary)',flexShrink:0 }}>🇮🇳 +91</span>
                            <input id="p-phone" type="tel" className="form-input" placeholder="98765 43210"
                              value={personal.phone} onChange={e => { setPersonal(p => ({...p, phone: e.target.value.replace(/\D/g,'').slice(0,10)})); setErrors(er => ({...er, phone:''})); }}
                              maxLength={10} style={{ borderColor: errors.phone ? 'var(--color-error)' : '' }} />
                          </div>
                          {errors.phone && <span className="form-error">{errors.phone}</span>}
                        </div>
                        {/* DOB */}
                        <div className="form-group">
                          <label className="form-label required" htmlFor="p-dob">Date of Birth</label>
                          <input id="p-dob" type="date" className="form-input"
                            value={personal.dob} onChange={e => { setPersonal(p => ({...p, dob: e.target.value})); setErrors(er => ({...er, dob:''})); }}
                            max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                            style={{ borderColor: errors.dob ? 'var(--color-error)' : '' }} />
                          {errors.dob && <span className="form-error">{errors.dob}</span>}
                        </div>
                        {/* Gender */}
                        <div className="form-group">
                          <label className="form-label required" htmlFor="p-gender">Gender</label>
                          <select id="p-gender" className="form-select"
                            value={personal.gender} onChange={e => { setPersonal(p => ({...p, gender: e.target.value})); setErrors(er => ({...er, gender:''})); }}
                            style={{ borderColor: errors.gender ? 'var(--color-error)' : '', color: personal.gender ? '' : 'var(--color-text-disabled)' }}>
                            <option value="">— Select Gender —</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Non-binary">Non-binary</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                          </select>
                          {errors.gender && <span className="form-error">{errors.gender}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Role-Specific Fields ── */}
                {step === 2 && (
                  <div>
                    <div className="apply-step-header">
                      <div className="apply-step-number">Step 2 of 3 · Professional Details</div>
                      <h2 className="apply-step-title">Role-specific information</h2>
                      <p className="apply-step-subtitle">These fields are tailored specifically for <strong>{job.title}</strong>.</p>
                    </div>
                    <DynamicForm
                      schema={job.formSchema}
                      values={roleFields}
                      onChange={setRoleFields}
                      errors={errors}
                    />
                  </div>
                )}

                {/* ── STEP 3: Documents & Review ── */}
                {step === 3 && (
                  <div>
                    <div className="apply-step-header">
                      <div className="apply-step-number">Step 3 of 3 · Documents & Review</div>
                      <h2 className="apply-step-title">Upload documents & submit</h2>
                      <p className="apply-step-subtitle">Upload your photo and resume, then review your application.</p>
                    </div>

                    {/* Photo Upload */}
                    <div className="form-section" style={{ marginBottom: 'var(--space-6)' }}>
                      <div className="form-section-title">📷 Profile Photo <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--color-text-disabled)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></div>
                      <div className="photo-upload-row">
                        <div className="photo-preview" aria-label="Profile photo preview">
                          {photoPreview
                            ? <img src={photoPreview} alt="Profile preview" />
                            : <span>👤</span>
                          }
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="file-upload-area" style={{ padding: 'var(--space-5)', textAlign: 'left' }}>
                            <input type="file" accept="image/*" className="file-upload-input"
                              ref={photoRef} onChange={handlePhotoChange} id="photo-upload" aria-label="Upload profile photo" />
                            <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)' }}>
                              <span style={{ fontSize: '1.5rem' }}>🖼️</span>
                              <div>
                                <div className="file-upload-title" style={{ fontSize: 'var(--text-sm)' }}>
                                  {photo ? photo.name : 'Click to upload a photo'}
                                </div>
                                <div className="file-upload-hint">JPG, PNG · Max 2MB</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Resume Upload */}
                    <div className="form-section" style={{ marginBottom: 'var(--space-6)' }}>
                      <div className="form-section-title">📄 Resume / CV <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-error)', textTransform: 'none', letterSpacing: 0 }}>*Required</span></div>
                      <div className={`file-upload-area${resume ? ' has-file' : ''}`}>
                        <input type="file" accept=".pdf" className="file-upload-input"
                          ref={resumeRef} onChange={handleResumeChange} id="resume-upload" aria-label="Upload resume PDF" />
                        {resume ? (
                          <>
                            <div className="file-upload-icon">✅</div>
                            <div className="file-upload-title">Resume uploaded!</div>
                            <div className="file-upload-subtitle" style={{ color: 'var(--color-success)' }}>{resume.name}</div>
                            <div className="file-upload-hint">{(resume.size / 1024).toFixed(0)} KB</div>
                          </>
                        ) : (
                          <>
                            <div className="file-upload-icon">📤</div>
                            <div className="file-upload-title">Drag & drop or click to upload your resume</div>
                            <div className="file-upload-subtitle">PDF format only</div>
                            <div className="file-upload-hint">Maximum file size: 5 MB</div>
                          </>
                        )}
                      </div>
                      {resume && (
                        <button className="btn btn-ghost btn-sm" onClick={() => { setResume(null); if(resumeRef.current) resumeRef.current.value=''; }}
                          style={{ marginTop: 'var(--space-2)', color: 'var(--color-error)' }}>
                          ✕ Remove file
                        </button>
                      )}
                      {errors.resume && <span className="form-error">{errors.resume}</span>}
                    </div>

                    {/* Review Summary */}
                    <div>
                      <div className="review-section">
                        <div className="review-section-title">👤 Personal Details</div>
                        <div className="review-grid">
                          {[
                            ['Full Name',   `${personal.firstName} ${personal.lastName}`],
                            ['Email',       personal.email],
                            ['Phone',       `+91 ${personal.phone}`],
                            ['Date of Birth', personal.dob],
                            ['Gender',      personal.gender],
                          ].map(([lbl, val]) => (
                            <div key={lbl} className="review-item">
                              <div className="review-label">{lbl}</div>
                              <div className="review-value">{val || '—'}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="review-section">
                        <div className="review-section-title">🎯 Role: {job.title}</div>
                        <div className="review-grid">
                          {job.formSchema.map(f => (
                            <div key={f.fieldName} className={`review-item${f.type === 'textarea' ? ' form-grid-full' : ''}`}>
                              <div className="review-label">{f.label}</div>
                              <div className="review-value" style={{ whiteSpace: f.type === 'textarea' ? 'pre-wrap' : '' }}>
                                {roleFields[f.fieldName] || <em style={{ color: 'var(--color-text-disabled)', fontStyle: 'italic' }}>Not provided</em>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Navigation Buttons ── */}
                <div className="form-nav">
                  <div className="form-nav-left">
                    {step > 1 && (
                      <button className="btn btn-outline-navy" onClick={handleBack} id="back-btn">
                        ← Back
                      </button>
                    )}
                  </div>
                  <div className="form-nav-right">
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      Step {step} of {STEPS.length}
                    </span>
                    {step < 3 ? (
                      <button className="btn btn-primary" onClick={handleNext} id={`next-step-${step}-btn`}>
                        Continue →
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary btn-lg"
                        onClick={handleSubmit}
                        disabled={loading || alreadyApplied || fetchingApplied}
                        id="submit-application-btn"
                        aria-busy={loading}
                      >
                        {loading
                          ? <><span className="spinner" style={{ width:16,height:16 }} /> Submitting...</>
                          : '🚀 Submit Application'
                        }
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* ── Right Sidebar ── */}
            <aside className="apply-sidebar">
              <div className="apply-sidebar-card">
                <div className="sidebar-card-title">📊 Application Progress</div>
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'var(--space-2)', fontSize:'var(--text-sm)', color:'var(--color-text-secondary)' }}>
                    <span>Completion</span>
                    <strong>{Math.round(((step - 1) / 3) * 100)}%</strong>
                  </div>
                  <div style={{ height:6,background:'var(--color-border)',borderRadius:'var(--radius-full)',overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.round(((step-1)/3)*100)}%`, background:'linear-gradient(90deg,var(--color-primary),var(--color-primary-dark))', borderRadius:'var(--radius-full)', transition:'width 0.4s ease' }} />
                  </div>
                </div>
                {STEPS.map(s => (
                  <div key={s.num} style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', padding:'var(--space-2) 0', fontSize:'var(--text-sm)' }}>
                    <span style={{ width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'bold',
                      background: step > s.num ? 'var(--color-success)' : step === s.num ? 'var(--color-primary)' : 'var(--color-border)',
                      color: step >= s.num ? 'white' : 'var(--color-text-muted)' }}>
                      {step > s.num ? '✓' : s.num}
                    </span>
                    <span style={{ color: step === s.num ? 'var(--color-navy)' : step > s.num ? 'var(--color-success)' : 'var(--color-text-muted)', fontWeight: step === s.num ? 600 : 400 }}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="apply-sidebar-card">
                <div className="sidebar-card-title">💡 Tips for a strong application</div>
                <div className="sidebar-tips">
                  {[
                    { icon: '📄', text: 'Upload your latest resume — ideally updated in the last 3 months.' },
                    { icon: '🎯', text: 'Be specific in open-ended answers. Use numbers and outcomes.' },
                    { icon: '🖼️', text: 'Add a professional photo to improve your profile visibility.' },
                    { icon: '🔗', text: 'Include your LinkedIn URL so our team can learn more about you.' },
                  ].map((tip, i) => (
                    <div key={i} className="sidebar-tip">
                      <span className="sidebar-tip-icon">{tip.icon}</span>
                      <span>{tip.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="apply-sidebar-card" style={{ background: 'var(--color-navy-subtle)', border: '1px solid var(--color-border)' }}>
                <div className="sidebar-card-title" style={{ color: 'var(--color-navy)' }}>📋 Applying for</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--color-navy)', display: 'block', marginBottom: '4px' }}>{job.title}</strong>
                  {job.location} · {job.type}<br />
                  {job.experience} · {job.salary}
                </div>
              </div>
            </aside>

          </div>
        </div>
      </div>
    </div>
  );
}
