import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { JOBS } from '../data/jobs';

import StatusBadge from '../components/StatusBadge';
import '../styles/admin.css';

const STATUSES = ['Applied', 'Under Review', 'Shortlisted', 'Rejected', 'Selected'];
const PAGE_SIZE = 8;
const TABS = [
  { id: 'applications', icon: '📋', label: 'Applications' },
  { id: 'jobs', icon: '💼', label: 'Job Listings' },
  { id: 'reports', icon: '📊', label: 'Reports & Export' },
];

/* ── Utility: export CSV ── */
function exportCSV(data) {
  const headers = ['Application ID', 'Applicant Name', 'Email', 'Phone', 'Job Title', 'Department', 'Location', 'Status', 'Applied On'];
  const rows = data.map(a => [
    a.id,
    a.personalInfo?.name || '—',
    a.personalInfo?.email || '—',
    a.personalInfo?.phone || '—',
    a.jobTitle || '—',
    a.department || '—',
    a.location || '—',
    a.status,
    new Date(a.appliedAt).toLocaleDateString('en-IN'),
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new URL('data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `diverse-solutions-applications-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

/* ── Relative time ── */
function timeAgo(iso) {
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d} days ago`;
}

/* ── Utility: Safe open base64 URL in a new tab using Blob ── */
function openBase64InNewTab(base64Data) {
  try {
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
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`<iframe src="${base64Data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    }
  }
}

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('applications');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [jobFilter, setJobFilter] = useState('All');
  const [sortField, setSortField] = useState('appliedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [toast, setToast] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);

  /* ── Load applications ── */
  const refresh = useCallback(async () => {
    if (!user || user.role !== 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    setApiError('');
    try {
      const token = localStorage.getItem('ds_token');
      const res = await fetch('/api/admin/applications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 401 || res.status === 403) {
        setApiError('Unauthorized access to admin API.');
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load applications.');
      }
      setApplications(data);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  /* ── Show toast ── */
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  /* ── Status update handler ── */
  const handleStatusChange = async (appId, newStatus) => {
    try {
      const token = localStorage.getItem('ds_token');
      const res = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: appId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status.');
      }
      refresh();
      showToast(`✅ Status updated to "${newStatus}"`);
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  /* ── Delete handler ── */
  const handleDelete = async (appId, name) => {
    if (!window.confirm(`Delete application from ${name}? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('ds_token');
      const res = await fetch('/api/admin/applications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: appId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete application.');
      }
      refresh();
      showToast(`🗑️ Application deleted`);
    } catch (err) {
      alert(`Error deleting application: ${err.message}`);
    }
  };

  /* ── Sorting ── */
  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  /* ── Filtered + sorted applications ── */
  const filtered = useMemo(() => {
    let list = [...applications];
    const q = search.toLowerCase().trim();
    if (q) list = list.filter(a =>
      (a.personalInfo?.name || '').toLowerCase().includes(q) ||
      (a.personalInfo?.email || '').toLowerCase().includes(q) ||
      (a.jobTitle || '').toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q)
    );
    if (statusFilter !== 'All') list = list.filter(a => a.status === statusFilter);
    if (jobFilter !== 'All') list = list.filter(a => a.jobId === jobFilter);

    list.sort((a, b) => {
      let va = sortField === 'name' ? (a.personalInfo?.name || '') : (a[sortField] || '');
      let vb = sortField === 'name' ? (b.personalInfo?.name || '') : (b[sortField] || '');
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [applications, search, statusFilter, jobFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── Stats ── */
  const stats = useMemo(() => ({
    total: applications.length,
    applied: applications.filter(a => a.status === 'Applied').length,
    review: applications.filter(a => a.status === 'Under Review').length,
    shortlisted: applications.filter(a => a.status === 'Shortlisted').length,
    selected: applications.filter(a => a.status === 'Selected').length,
    rejected: applications.filter(a => a.status === 'Rejected').length,
  }), [applications]);

  /* ── Job applicant counts ── */
  const jobCounts = useMemo(() => {
    const map = {};
    applications.forEach(a => { map[a.jobId] = (map[a.jobId] || 0) + 1; });
    return map;
  }, [applications]);

  const thCls = (f) => sortField === f ? `sort-${sortDir}` : '';

  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-page">
        <div className="container" style={{ paddingTop: '5rem', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-error)', marginBottom: '1rem' }}>
            Access Denied
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
            You do not have administrative privileges to access this page.
          </p>
          <Link to="/" className="btn btn-primary">Go to Home</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="container" style={{ paddingTop: '8rem', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto var(--space-4)' }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">

      {/* ── Admin Header ── */}
      <div className="admin-header">
        <div className="container">
          <div className="admin-header-content">
            <div className="admin-header-left">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
                  <h1 className="admin-title">Admin Panel</h1>
                  <span className="admin-badge">🔐 Admin</span>
                </div>
                <div className="admin-subtitle">Logged in as {user?.name} · {user?.email}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Link to="/" className="btn btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' }}>
                ← Portal Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="admin-tab-nav">
        <div className="container">
          <div className="admin-tab-list" role="tablist" aria-label="Admin sections">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`admin-tab-btn${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => { setActiveTab(tab.id); setPage(1); }}
                role="tab"
                aria-selected={activeTab === tab.id}
                id={`admin-tab-${tab.id}`}
              >
                {tab.icon} {tab.label}
                {tab.id === 'applications' && (
                  <span className="admin-tab-count">{applications.length}</span>
                )}
                {tab.id === 'jobs' && (
                  <span className="admin-tab-count">{JOBS.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-body">
        <div className="container">
          {apiError && (
            <div className="auth-error" style={{ marginBottom: 'var(--space-6)' }} role="alert">
              ❌ {apiError}
            </div>
          )}

          {/* ── Stats Strip (always visible) ── */}
          <div className="admin-stats-strip" role="region" aria-label="Quick stats">
            {[
              { label: 'Total Applications', num: stats.total, color: 'var(--color-navy)' },
              { label: 'New (Applied)', num: stats.applied, color: 'var(--status-applied)' },
              { label: 'Under Review', num: stats.review, color: 'var(--status-review)' },
              { label: 'Shortlisted', num: stats.shortlisted, color: 'var(--status-shortlisted)' },
              { label: 'Selected', num: stats.selected, color: 'var(--status-selected)' },
              { label: 'Rejected', num: stats.rejected, color: 'var(--status-rejected)' },
            ].map(s => (
              <div key={s.label} className="admin-stat" aria-label={`${s.label}: ${s.num}`}>
                <div className="admin-stat-num" style={{ color: s.color }}>{s.num}</div>
                <div className="admin-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ════════════════════════════════════
              TAB 1: APPLICATIONS
          ════════════════════════════════════ */}
          {activeTab === 'applications' && (
            <div role="tabpanel" aria-labelledby="admin-tab-applications">

              {/* Toolbar */}
              <div className="admin-toolbar">
                <div className="admin-search-wrap">
                  <span className="admin-search-icon">🔍</span>
                  <input
                    type="search"
                    className="admin-search"
                    placeholder="Search by name, email, job title, or ID…"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    id="admin-search-input"
                    aria-label="Search applications"
                  />
                </div>

                <select
                  className="admin-filter-select"
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                  id="admin-status-filter"
                  aria-label="Filter by status"
                >
                  <option value="All">All Statuses</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <select
                  className="admin-filter-select"
                  value={jobFilter}
                  onChange={e => { setJobFilter(e.target.value); setPage(1); }}
                  id="admin-job-filter"
                  aria-label="Filter by job"
                >
                  <option value="All">All Jobs</option>
                  {JOBS.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => exportCSV(filtered)}
                  disabled={filtered.length === 0}
                  id="export-csv-btn"
                  aria-label="Export filtered results to CSV"
                >
                  ⬇ Export CSV ({filtered.length})
                </button>
              </div>

              {/* Table */}
              {filtered.length === 0 ? (
                <div className="admin-empty">
                  <div className="admin-empty-icon">🔍</div>
                  <h3>No applications found</h3>
                  <p>Try adjusting your search or filters.</p>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table" role="grid" aria-label="Applications table">
                    <thead>
                      <tr>
                        <th onClick={() => toggleSort('id')} className={thCls('id')} aria-sort={sortField === 'id' ? sortDir : undefined}>#</th>
                        <th onClick={() => toggleSort('name')} className={thCls('name')} aria-sort={sortField === 'name' ? sortDir : undefined}>Applicant</th>
                        <th onClick={() => toggleSort('jobTitle')} className={thCls('jobTitle')} aria-sort={sortField === 'jobTitle' ? sortDir : undefined}>Job Role</th>
                        <th>Location</th>
                        <th onClick={() => toggleSort('appliedAt')} className={thCls('appliedAt')} aria-sort={sortField === 'appliedAt' ? sortDir : undefined}>Applied</th>
                        <th onClick={() => toggleSort('status')} className={thCls('status')} aria-sort={sortField === 'status' ? sortDir : undefined}>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((app, idx) => {
                        const statusCls = app.status.replace(/\s+/g, '-');
                        return (
                          <tr key={app.id} role="row">
                            <td>
                              <span className="admin-app-id">{(page - 1) * PAGE_SIZE + idx + 1}</span>
                            </td>
                            <td>
                              <div className="admin-applicant-cell">
                                {app.photoUrl ? (
                                  <img
                                    src={app.photoUrl}
                                    alt={app.personalInfo?.name || 'Applicant photo'}
                                    className="admin-avatar-thumbnail"
                                    onClick={() => setSelectedApp(app)}
                                  />
                                ) : (
                                  <div className="admin-avatar-thumbnail-placeholder" onClick={() => setSelectedApp(app)}>
                                    {app.personalInfo?.name ? app.personalInfo.name.charAt(0).toUpperCase() : '👤'}
                                  </div>
                                )}
                                <div>
                                  <div className="admin-app-name" onClick={() => setSelectedApp(app)} style={{ cursor: 'pointer' }}>
                                    {app.personalInfo?.name || '—'}
                                  </div>
                                  <div className="admin-app-email">{app.personalInfo?.email || '—'}</div>
                                  {app.personalInfo?.phone && (
                                    <div className="admin-app-email">+91 {app.personalInfo.phone}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 'var(--fw-medium)', color: 'var(--color-navy)', fontSize: 'var(--text-sm)' }}>
                                {app.jobTitle}
                              </div>
                              <div className="admin-app-email">{app.department}</div>
                            </td>
                            <td style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                              {app.location}
                            </td>
                            <td style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                              {timeAgo(app.appliedAt)}
                            </td>
                            <td>
                              <select
                                className={`status-update-select ${statusCls}`}
                                value={app.status}
                                onChange={e => handleStatusChange(app.id, e.target.value)}
                                id={`status-select-${app.id}`}
                                aria-label={`Update status for ${app.personalInfo?.name}`}
                              >
                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => setSelectedApp(app)}
                                  title="View Candidate Details"
                                  aria-label={`View Candidate Details: ${app.personalInfo?.name}`}
                                  style={{ fontSize: 'var(--text-md)', padding: 'var(--space-1) var(--space-2)', cursor: 'pointer' }}
                                >
                                  👁️
                                </button>
                                {app.resumeUrl && (
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => openBase64InNewTab(app.resumeUrl, app.resumeName || 'resume.pdf')}
                                    title={`View Resume: ${app.resumeName || 'resume.pdf'}`}
                                    style={{ fontSize: 'var(--text-md)', padding: 'var(--space-1) var(--space-2)', cursor: 'pointer' }}
                                    aria-label={`View Resume: ${app.resumeName}`}
                                  >
                                    📄
                                  </button>
                                )}
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => handleDelete(app.id, app.personalInfo?.name || 'this applicant')}
                                  id={`delete-app-${app.id}`}
                                  aria-label={`Delete application from ${app.personalInfo?.name}`}
                                  style={{ color: 'var(--color-error)', padding: 'var(--space-1) var(--space-2)', cursor: 'pointer' }}
                                  title="Delete application"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  <div className="admin-pagination">
                    <span>
                      Showing <strong>{Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)}</strong> of <strong>{filtered.length}</strong> application{filtered.length !== 1 ? 's' : ''}
                    </span>
                    <div className="pagination-btns" role="navigation" aria-label="Table pagination">
                      <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1} aria-label="Previous page">‹</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                        .map((p, i, arr) => (
                          <React.Fragment key={p}>
                            {i > 0 && arr[i - 1] !== p - 1 && <span style={{ color: 'var(--color-text-disabled)', fontSize: 'var(--text-sm)' }}>…</span>}
                            <button className={`page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)} aria-label={`Page ${p}`} aria-current={page === p ? 'page' : undefined}>{p}</button>
                          </React.Fragment>
                        ))
                      }
                      <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages} aria-label="Next page">›</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════
              TAB 2: JOB LISTINGS
          ════════════════════════════════════ */}
          {activeTab === 'jobs' && (
            <div role="tabpanel" aria-labelledby="admin-tab-jobs">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--color-navy)' }}>
                    Active Job Listings
                  </h2>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    {JOBS.length} open positions across all departments
                  </p>
                </div>
              </div>

              <div className="admin-jobs-grid">
                {JOBS.map(job => {
                  const count = jobCounts[job.id] || 0;
                  return (
                    <div key={job.id} className="admin-job-card" role="article" aria-label={job.title}>
                      <div className="admin-job-card-header">
                        <div>
                          <div className="admin-job-title">{job.title}</div>
                          <div className="admin-job-dept">{job.department}</div>
                        </div>
                        <span className="badge badge-orange">{job.type}</span>
                      </div>

                      <div className="admin-job-meta">
                        <div className="admin-job-meta-row">📍 {job.location}</div>
                        <div className="admin-job-meta-row">💼 {job.experience}</div>
                        <div className="admin-job-meta-row">💰 {job.salary}</div>
                      </div>

                      {/* Skill tags preview */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                        {job.skills?.slice(0, 3).map(s => (
                          <span key={s} className="badge badge-navy" style={{ fontSize: '10px' }}>{s}</span>
                        ))}
                        {job.skills?.length > 3 && (
                          <span className="badge badge-gray" style={{ fontSize: '10px' }}>+{job.skills.length - 3}</span>
                        )}
                      </div>

                      <div className="admin-job-card-footer">
                        <div className="admin-applicant-count">
                          <span style={{ fontSize: '1.2rem' }}>👥</span>
                          <span>{count} applicant{count !== 1 ? 's' : ''}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => { setJobFilter(job.id); setActiveTab('applications'); }}
                            id={`view-apps-${job.id}`}
                            aria-label={`View applications for ${job.title}`}
                          >
                            View Apps →
                          </button>
                          <Link
                            to={`/apply/${job.id}`}
                            className="btn btn-outline btn-sm"
                            id={`view-listing-${job.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`View public listing for ${job.title}`}
                          >
                            🔗
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
              TAB 3: REPORTS & EXPORT
          ════════════════════════════════════ */}
          {activeTab === 'reports' && (
            <div role="tabpanel" aria-labelledby="admin-tab-reports">
              <div className="admin-reports-grid">

                {/* Status Breakdown Chart */}
                <div className="admin-report-card">
                  <div className="admin-report-title">📊 Application Status Breakdown</div>
                  {[
                    { label: 'Applied', count: stats.applied, color: 'var(--status-applied)', total: stats.total },
                    { label: 'Under Review', count: stats.review, color: 'var(--status-review)', total: stats.total },
                    { label: 'Shortlisted', count: stats.shortlisted, color: 'var(--status-shortlisted)', total: stats.total },
                    { label: 'Selected', count: stats.selected, color: 'var(--status-selected)', total: stats.total },
                    { label: 'Rejected', count: stats.rejected, color: 'var(--status-rejected)', total: stats.total },
                  ].map(s => (
                    <div key={s.label} className="admin-chart-bar-row">
                      <div className="admin-chart-label">{s.label}</div>
                      <div className="admin-chart-bar-wrap">
                        <div className="admin-chart-bar" style={{ width: s.total ? `${(s.count / s.total) * 100}%` : '0%', background: s.color }} />
                      </div>
                      <div className="admin-chart-count">{s.count}</div>
                    </div>
                  ))}
                  {stats.total === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-6) 0' }}>
                      No applications yet. Data will appear here once candidates apply.
                    </p>
                  )}
                </div>

                {/* Jobs Breakdown Chart */}
                <div className="admin-report-card">
                  <div className="admin-report-title">💼 Applications by Role</div>
                  {JOBS.map(j => {
                    const count = jobCounts[j.id] || 0;
                    return (
                      <div key={j.id} className="admin-chart-bar-row">
                        <div className="admin-chart-label" style={{ fontSize: '11px' }} title={j.title}>
                          {j.title.length > 18 ? j.title.slice(0, 16) + '…' : j.title}
                        </div>
                        <div className="admin-chart-bar-wrap">
                          <div className="admin-chart-bar" style={{ width: stats.total ? `${(count / stats.total) * 100}%` : '0%', background: 'var(--color-navy)' }} />
                        </div>
                        <div className="admin-chart-count">{count}</div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Export Section */}
              <div className="export-card">
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📥</div>
                <h3>Export Applications Data</h3>
                <p>
                  Download all application records as a CSV file. Includes applicant name, email, phone, job role, location, status, and applied date. Use this for HR reporting and offline analysis.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => exportCSV(applications)}
                    disabled={applications.length === 0}
                    id="export-all-csv-btn"
                    aria-label="Export all applications to CSV"
                  >
                    ⬇ Download All ({applications.length} records)
                  </button>
                  <button
                    className="btn btn-outline btn-lg"
                    onClick={() => exportCSV(applications.filter(a => a.status === 'Shortlisted'))}
                    disabled={stats.shortlisted === 0}
                    id="export-shortlisted-csv-btn"
                    aria-label="Export shortlisted applications to CSV"
                    style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}
                  >
                    ⭐ Shortlisted Only ({stats.shortlisted})
                  </button>
                  <button
                    className="btn btn-outline btn-lg"
                    onClick={() => exportCSV(applications.filter(a => a.status === 'Selected'))}
                    disabled={stats.selected === 0}
                    id="export-selected-csv-btn"
                    aria-label="Export selected applications to CSV"
                    style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}
                  >
                    🎉 Selected Only ({stats.selected})
                  </button>
                </div>

                {applications.length === 0 && (
                  <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.4)' }}>
                    Export will be available once candidates submit applications.
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Toast Notification ── */}
      {toast && (
        <div className="admin-toast" role="alert" aria-live="polite">
          {toast}
        </div>
      )}

      {/* ── Candidate Details Modal ── */}
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
                          onClick={() => openBase64InNewTab(selectedApp.photoUrl, selectedApp.photoName || 'photo.jpg')}
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
                          onClick={() => openBase64InNewTab(selectedApp.resumeUrl, selectedApp.resumeName || 'resume.pdf')}
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

    </div>
  );
}
