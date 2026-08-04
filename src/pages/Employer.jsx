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
  const [candidateFilter, setCandidateFilter] = useState({
    matchedReq: false,
    hasResume: false,
  });

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
  }, [refreshApplications, refreshJobs]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

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

    // Filter by resume / requirements checkboxes
    if (candidateFilter.hasResume) {
      list = list.filter(a => Boolean(a.resumeUrl));
    }

    return list;
  }, [jobApplications, selectedStatusTab, candidateFilter]);

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

                {/* Left Filter Sidebar */}
                <aside className="candidate-filter-sidebar">
                  <div className="filter-group-header">⚙️ Filters</div>

                  <div className="filter-group">
                    <label className="filter-group-label">Show candidates who</label>
                    <label className="filter-checkbox-item">
                      <input
                        type="checkbox"
                        checked={candidateFilter.matchedReq}
                        onChange={e => setCandidateFilter(prev => ({ ...prev, matchedReq: e.target.checked }))}
                      />
                      Matched to job requirements
                    </label>
                    <label className="filter-checkbox-item">
                      <input
                        type="checkbox"
                        checked={candidateFilter.hasResume}
                        onChange={e => setCandidateFilter(prev => ({ ...prev, hasResume: e.target.checked }))}
                      />
                      Have Resume Attached ({jobApplications.filter(a => Boolean(a.resumeUrl)).length})
                    </label>
                  </div>
                </aside>

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
                <h2>Database Matches & Applications ({applications.length})</h2>
              </div>
              <div className="candidate-cards-list" style={{ marginTop: '1rem' }}>
                {applications.map(app => (
                  <div key={app.id} className="candidate-card">
                    <div className="candidate-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {app.photoUrl ? (
                          <img src={app.photoUrl} alt={app.personalInfo?.name} className="candidate-initials-avatar" style={{ objectFit: 'cover' }} />
                        ) : (
                          <div className="candidate-initials-avatar">
                            {app.personalInfo?.name ? app.personalInfo.name.charAt(0).toUpperCase() : '👤'}
                          </div>
                        )}
                        <div>
                          <h3 style={{ margin: 0, fontSize: '16px' }}>{app.personalInfo?.name || 'Applicant'}</h3>
                          <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0' }}>Applied for: <strong>{app.jobTitle}</strong> ({app.department})</p>
                        </div>
                      </div>
                      <span className={`status-pill ${app.status.toLowerCase().replace(/\s+/g, '-')}`}>{app.status}</span>
                    </div>

                    <div className="candidate-card-actions" style={{ marginTop: '1rem' }}>
                      <button className="btn-action-primary" onClick={() => setSelectedApp(app)}>
                        👁️ View Details
                      </button>
                    </div>
                  </div>
                ))}
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

    </div>
  );
}
