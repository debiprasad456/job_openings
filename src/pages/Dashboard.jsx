import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import '../styles/dashboard.css';

const STATUS_FILTERS = ['All', 'Applied', 'Under Review', 'Shortlisted', 'Rejected', 'Selected'];

// ── Application status timeline steps ──
function getTimeline(status) {
  const isRejected = status === 'Rejected';
  const isSelected = status === 'Selected';

  const steps = [
    { key: 'Applied',      label: 'Application Submitted', sub: 'Your application is received' },
    { key: 'Under Review', label: 'Under Review',           sub: 'HR team is reviewing your profile' },
    { key: 'Shortlisted',  label: 'Shortlisted',            sub: 'You have been shortlisted!' },
    isSelected
      ? { key: 'Selected',   label: 'Selected!',             sub: 'Congratulations! You have been selected for this position!' }
      : { key: 'Rejected',   label: 'Decision Made',          sub: 'Application not selected this time' }
  ];

  const order = { Applied: 0, 'Under Review': 1, Shortlisted: 2, Rejected: 2, Selected: 3 };
  const currentIdx = order[status] ?? 0;

  return steps.slice(0, isRejected ? 2 : 4).map((s, i) => {
    const isReject = isRejected && i === 1;
    const done   = i < currentIdx;
    const active = i === currentIdx;
    return { ...s, done, active, isReject };
  }).concat(isRejected ? [{ ...steps[3], done: false, active: true, isReject: true }] : []);
}

// ── Relative time ──
function timeAgo(isoStr) {
  const ms = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60)    return `${mins || 1} min${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)     return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)     return `${days} day${days !== 1 ? 's' : ''} ago`;
  return new Date(isoStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Initials from name ──
function initials(name) {
  return name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U';
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeFilter, setActiveFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [allApplications, setAllApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchApplications = async () => {
      try {
        const token = localStorage.getItem('ds_token');
        const res = await fetch('/api/applications/mine', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.status === 401) {
          logout();
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch applications.');
        }
        setAllApplications(data);
      } catch (err) {
        setApiError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [user, logout]);

  const filtered = useMemo(
    () => activeFilter === 'All' ? allApplications : allApplications.filter(a => a.status === activeFilter),
    [allApplications, activeFilter]
  );

  // ── Stats ──
  const stats = useMemo(() => ({
    total:       allApplications.length,
    review:      allApplications.filter(a => a.status === 'Under Review').length,
    shortlisted: allApplications.filter(a => a.status === 'Shortlisted').length,
    rejected:    allApplications.filter(a => a.status === 'Rejected').length,
    selected:    allApplications.filter(a => a.status === 'Selected').length,
  }), [allApplications]);

  if (!user) {
    return (
      <div className="dashboard-page">
        <div className="container" style={{ paddingTop: '5rem', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-navy)', marginBottom: '1rem' }}>
            Please sign in to view your dashboard.
          </h2>
          <Link to="/login" className="btn btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="container" style={{ paddingTop: '8rem', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto var(--space-4)' }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      {/* ── Header ── */}
      <div className="dashboard-header">
        <div className="container">
          <div className="dashboard-header-content">
            <div className="dashboard-user-info">
              <div className="dashboard-avatar" aria-label={`Avatar for ${user.name}`}>
                {user.photoPreview
                  ? <img src={user.photoPreview} alt={user.name} />
                  : initials(user.name)
                }
              </div>
              <div>
                <div className="dashboard-welcome">Welcome back,</div>
                <div className="dashboard-name">{user.name} 👋</div>
                <div className="dashboard-email">{user.email}</div>
              </div>
            </div>
            <div className="dashboard-header-actions">
              <Link to="/" className="btn btn-outline-navy" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                id="browse-jobs-btn" aria-label="Browse more jobs">
                🔍 Browse Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-body">
        <div className="container">
          {apiError && (
            <div className="auth-error" style={{ marginBottom: 'var(--space-6)' }} role="alert">
              ❌ {apiError}
            </div>
          )}

          {/* ── Stats Row ── */}
          <div className="dashboard-stats" role="region" aria-label="Application statistics">
            {[
              { icon: '📋', iconCls: 'stat-icon-blue',   num: stats.total,       label: 'Total Applied' },
              { icon: '🔍', iconCls: 'stat-icon-yellow',  num: stats.review,      label: 'Under Review' },
              { icon: '⭐', iconCls: 'stat-icon-green',   num: stats.shortlisted, label: 'Shortlisted' },
              { icon: '🎉', iconCls: 'stat-icon-purple',  num: stats.selected,    label: 'Selected' },
              { icon: '❌', iconCls: 'stat-icon-navy',    num: stats.rejected,    label: 'Not Selected' },
            ].map(s => (
              <div key={s.label} className="stat-card" aria-label={`${s.label}: ${s.num}`}>
                <div className={`stat-icon ${s.iconCls}`}>{s.icon}</div>
                <div>
                  <div className="stat-number">{s.num}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-grid">

            {/* ── Applications Panel ── */}
            <div className="applications-panel">
              <div className="panel-header">
                <h2 className="panel-title">My Applications</h2>
                <div className="panel-filter-tabs" role="group" aria-label="Filter by status">
                  {STATUS_FILTERS.map(f => (
                    <button
                      key={f}
                      className={`filter-tab${activeFilter === f ? ' active' : ''}`}
                      onClick={() => setActiveFilter(f)}
                      id={`filter-${f.replace(' ', '-')}-btn`}
                      aria-pressed={activeFilter === f}
                    >
                      {f} {f !== 'All' && allApplications.filter(a => a.status === f).length > 0
                        ? `(${allApplications.filter(a => a.status === f).length})` : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Empty State */}
              {filtered.length === 0 ? (
                <div className="dashboard-empty" role="status">
                  <div className="dashboard-empty-icon">
                    {activeFilter === 'All' ? '📭' : '🔍'}
                  </div>
                  <h3>{activeFilter === 'All' ? "No applications yet" : `No ${activeFilter} applications`}</h3>
                  <p>
                    {activeFilter === 'All'
                      ? "Start your career journey by applying to one of our MBA openings."
                      : `You don't have any applications with status "${activeFilter}" yet.`
                    }
                  </p>
                  {activeFilter === 'All' && (
                    <Link to="/" className="btn btn-primary" id="start-applying-btn">
                      🚀 Browse Open Positions
                    </Link>
                  )}
                </div>
              ) : (
                <div role="list" aria-label="Your applications">
                  {filtered.map(app => {
                    const isExpanded = expandedId === app.id;
                    const statusCls  = app.status.replace(/\s+/g, '-');

                    return (
                      <article
                        key={app.id}
                        className={`application-card status-${statusCls} animate-fade-in-up`}
                        role="listitem"
                        aria-label={`Application for ${app.jobTitle}`}
                      >
                        {/* Header */}
                        <div className="app-card-header">
                          <img src="/assets/logo.png" alt="Diverse Solutions" className="app-card-logo"
                            onError={e => e.target.style.display='none'} />
                          <div className="app-card-info">
                            <div className="app-card-title">{app.jobTitle}</div>
                            <div className="app-card-company">Diverse Solutions Pvt. Ltd. · {app.department}</div>
                          </div>
                          <StatusBadge status={app.status} />
                        </div>

                        {/* Meta */}
                        <div className="app-card-meta">
                          <div className="app-meta-item">📍 {app.location}</div>
                          {app.personalInfo?.name && <div className="app-meta-item">👤 {app.personalInfo.name}</div>}
                        </div>

                        {/* Application Progress Timeline (collapsible) */}
                        {isExpanded && (
                          <div className="app-timeline" aria-label="Application timeline">
                            {getTimeline(app.status).map((step, i) => (
                              <div key={i} className="timeline-item">
                                <div className={`timeline-dot${step.done ? ' done' : step.active ? ' active' : ''}`}>
                                  {step.done ? '✓' : step.active ? (step.isReject ? '✕' : '●') : '○'}
                                </div>
                                <div className="timeline-text">
                                  <div className="timeline-label" style={{ color: step.active ? (step.isReject ? 'var(--color-error)' : 'var(--color-primary)') : step.done ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                                    {step.label}
                                  </div>
                                  <div className="timeline-sub">{step.sub}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="app-card-footer">
                          <div style={{ display:'flex', gap:'var(--space-4)', flexWrap:'wrap' }}>
                            <span className="app-card-date">🕐 Applied {timeAgo(app.appliedAt)}</span>
                            <span className="app-card-id">ID: {app.id}</span>
                          </div>
                          <div style={{ display:'flex', gap:'var(--space-3)' }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setExpandedId(isExpanded ? null : app.id)}
                              id={`toggle-timeline-${app.id}`}
                              aria-expanded={isExpanded}
                              aria-label={isExpanded ? 'Collapse timeline' : 'View application timeline'}
                            >
                              {isExpanded ? '▲ Hide Timeline' : '▼ View Timeline'}
                            </button>
                            <Link
                              to={`/apply/${app.jobId}`}
                              className="btn btn-outline btn-sm"
                              id={`view-job-${app.jobId}`}
                              aria-label={`View job listing for ${app.jobTitle}`}
                            >
                              View Job →
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Right Sidebar ── */}
            <aside className="dashboard-sidebar">

              {/* Profile Card */}
              <div className="dashboard-sidebar-card">
                <div className="sidebar-section-title">👤 My Profile</div>
                {[
                  ['Name',   user.name],
                  ['Email',  user.email],
                  ['Phone',  user.phone ? `+91 ${user.phone}` : '—'],
                  ['Role',   'Candidate'],
                  ['Member since', (() => {
                    try {
                      const stored = localStorage.getItem('ds_user');
                      const u = stored ? JSON.parse(stored) : null;
                      return u?.createdAt
                        ? new Date(u.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                        : 'Recently joined';
                    } catch { return 'Recently joined'; }
                  })()],
                ].map(([lbl, val]) => (
                  <div key={lbl} className="profile-field">
                    <div className="profile-field-label">{lbl}</div>
                    <div className="profile-field-value">{val || '—'}</div>
                  </div>
                ))}
              </div>

              {/* Quick Stats Card */}
              <div className="dashboard-sidebar-card" style={{ background: 'var(--color-navy-subtle)' }}>
                <div className="sidebar-section-title">📊 Application Summary</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-3)' }}>
                  {[
                    { label: 'Applied',      count: stats.total,       color: 'var(--status-applied)' },
                    { label: 'Under Review', count: stats.review,      color: 'var(--status-review)' },
                    { label: 'Shortlisted',  count: stats.shortlisted, color: 'var(--status-shortlisted)' },
                    { label: 'Selected',     count: stats.selected,    color: 'var(--status-selected)' },
                    { label: 'Not Selected', count: stats.rejected,    color: 'var(--status-rejected)' },
                  ].map(s => (
                    <div key={s.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'var(--space-3)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'var(--space-2)', fontSize:'var(--text-sm)', color:'var(--color-text-secondary)' }}>
                        <span style={{ width:8, height:8, borderRadius:'50%', background:s.color, flexShrink:0 }} />
                        {s.label}
                      </div>
                      <span style={{ fontWeight:'var(--fw-bold)', color:'var(--color-navy)', fontSize:'var(--text-sm)' }}>{s.count}</span>
                    </div>
                  ))}
                  {/* Progress bar */}
                  {stats.total > 0 && (
                    <div style={{ marginTop:'var(--space-3)' }}>
                      <div style={{ height:6, background:'var(--color-border)', borderRadius:'var(--radius-full)', overflow:'hidden', display:'flex' }}>
                        {stats.selected > 0    && <div style={{ width:`${(stats.selected/stats.total)*100}%`,       background:'var(--status-selected)', transition:'width 0.5s ease' }} />}
                        {stats.shortlisted > 0 && <div style={{ width:`${(stats.shortlisted/stats.total)*100}%`, background:'var(--color-success)', transition:'width 0.5s ease' }} />}
                        {stats.review > 0      && <div style={{ width:`${(stats.review/stats.total)*100}%`,      background:'var(--color-warning)' }} />}
                        {stats.rejected > 0    && <div style={{ width:`${(stats.rejected/stats.total)*100}%`,    background:'var(--color-error)' }} />}
                      </div>
                      <div style={{ fontSize:'var(--text-xs)', color:'var(--color-text-muted)', marginTop:'var(--space-2)' }}>
                        {stats.total} application{stats.total !== 1 ? 's' : ''} total
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="dashboard-sidebar-card" style={{ textAlign:'center', background:'linear-gradient(135deg,var(--color-navy-dark),var(--color-navy))', border:'none' }}>
                <div style={{ fontSize:'2rem', marginBottom:'var(--space-3)' }}>🚀</div>
                <div style={{ fontFamily:'var(--font-heading)', fontSize:'var(--text-base)', fontWeight:'var(--fw-bold)', color:'white', marginBottom:'var(--space-2)' }}>
                  Apply to More Roles
                </div>
                <div style={{ fontSize:'var(--text-xs)', color:'rgba(255,255,255,0.6)', marginBottom:'var(--space-4)' }}>
                  We have {8 - stats.total > 0 ? 8 - stats.total : 0} more positions you haven't applied to yet.
                </div>
                <Link to="/" className="btn btn-primary btn-sm" id="apply-more-btn" style={{ width:'100%', justifyContent:'center' }}>
                  Browse All Jobs
                </Link>
              </div>

            </aside>
          </div>

        </div>
      </div>
    </div>
  );
}
