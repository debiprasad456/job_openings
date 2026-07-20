import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { JOBS } from '../data/jobs';
import '../styles/navbar.css';

export default function Navbar({ user, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedOpen, setSavedOpen] = useState(false);
  const [mobileSavedOpen, setMobileSavedOpen] = useState(false);
  const userMenuRef = useRef(null);
  const savedMenuRef = useRef(null);
  const navigate = useNavigate();

  // Shadow on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Sync saved jobs & listen to custom events
  useEffect(() => {
    const updateSaved = () => {
      try {
        const savedIds = JSON.parse(localStorage.getItem('ds_saved_jobs') || '[]');
        const list = JOBS.filter(j => savedIds.includes(j.id));
        setSavedJobs(list);
      } catch {
        setSavedJobs([]);
      }
    };
    updateSaved();
    window.addEventListener('savedJobsChanged', updateSaved);
    return () => window.removeEventListener('savedJobsChanged', updateSaved);
  }, []);

  // Close saved jobs dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (savedMenuRef.current && !savedMenuRef.current.contains(e.target)) {
        setSavedOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const removeJob = (jobId) => {
    try {
      const savedIds = JSON.parse(localStorage.getItem('ds_saved_jobs') || '[]');
      const filtered = savedIds.filter(id => id !== jobId);
      localStorage.setItem('ds_saved_jobs', JSON.stringify(filtered));
      window.dispatchEvent(new Event('savedJobsChanged'));
    } catch (err) {
      console.error(err);
    }
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [navigate]);

  const handleLogout = () => {
    setUserMenuOpen(false);
    onLogout?.();
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`} role="navigation" aria-label="Main navigation">
        <div className="container">
          <div className="navbar-inner">

            {/* Logo */}
            <Link to="/" className="navbar-logo" aria-label="Diverse Solutions Home">
              <img src="/assets/logo.png" alt="Diverse Solutions Logo" />
              <div className="navbar-logo-text">
                <span className="navbar-logo-name">Diverse Solutions</span>
                <span className="navbar-logo-tagline">Career Portal</span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="navbar-links" role="menubar">
              <NavLink to="/" end className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`} role="menuitem">
                Browse Jobs
              </NavLink>

              <div className="saved-jobs-menu" ref={savedMenuRef} role="menuitem">
                <button
                  className={`navbar-link saved-jobs-trigger ${savedOpen ? 'active' : ''}`}
                  onClick={() => setSavedOpen(!savedOpen)}
                  aria-expanded={savedOpen}
                  aria-haspopup="true"
                  id="saved-jobs-button"
                >
                  🔖 Saved <span className="saved-jobs-badge">{savedJobs.length}</span>
                </button>
                {savedOpen && (
                  <div className="saved-jobs-dropdown" role="menu" aria-labelledby="saved-jobs-button">
                    <div className="saved-jobs-header">🔖 Saved Jobs</div>
                    <div className="saved-jobs-list">
                      {savedJobs.length > 0 ? (
                        savedJobs.map(job => (
                          <div key={job.id} className="saved-job-item">
                            <Link to={`/apply/${job.id}`} className="saved-job-info" onClick={() => setSavedOpen(false)}>
                              <div className="saved-job-title">{job.title}</div>
                              <div className="saved-job-dept">{job.department}</div>
                            </Link>
                            <button
                              className="saved-job-action"
                              onClick={(e) => { e.stopPropagation(); removeJob(job.id); }}
                              aria-label={`Remove ${job.title} from saved jobs`}
                              title="Remove"
                            >
                              ❌
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="saved-jobs-empty">No saved jobs yet.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {user && (
                <NavLink to="/dashboard" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`} role="menuitem">
                  My Applications
                </NavLink>
              )}
              {user?.role === 'admin' && (
                <NavLink to="/admin" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`} role="menuitem">
                  Admin Panel
                </NavLink>
              )}
            </div>

            {/* Desktop Auth */}
            <div className="navbar-auth">
              {user ? (
                <div className={`user-menu${userMenuOpen ? ' open' : ''}`} ref={userMenuRef}>
                  <button
                    className="user-menu-trigger"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    id="user-menu-button"
                  >
                    <div className="user-avatar">{initials}</div>
                    <span className="user-name">{user.name?.split(' ')[0]}</span>
                    <span className="user-chevron">▼</span>
                  </button>

                  {userMenuOpen && (
                    <div className="user-dropdown" role="menu" aria-labelledby="user-menu-button">
                      <div className="user-dropdown-header">
                        <div className="user-dropdown-name">{user.name}</div>
                        <div className="user-dropdown-email">{user.email}</div>
                      </div>
                      <Link to="/dashboard" className="dropdown-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                        📋 My Applications
                      </Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" className="dropdown-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                          ⚙️ Admin Panel
                        </Link>
                      )}
                      <div className="dropdown-divider" />
                      <button className="dropdown-item danger" role="menuitem" onClick={handleLogout}>
                        🚪 Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline-navy btn-sm">Sign In</Link>
                  <Link to="/register" className="btn btn-primary btn-sm">Register Free</Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              className="hamburger"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={mobileOpen}
              id="mobile-menu-toggle"
            >
              <span style={{ transform: mobileOpen ? 'rotate(45deg) translate(5px, 5px)' : '' }} />
              <span style={{ opacity: mobileOpen ? 0 : 1 }} />
              <span style={{ transform: mobileOpen ? 'rotate(-45deg) translate(5px, -5px)' : '' }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu${mobileOpen ? ' open' : ''}`} role="menu" aria-label="Mobile navigation">
        <NavLink to="/" end className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`} onClick={() => setMobileOpen(false)}>
          Browse Jobs
        </NavLink>

        <div className="mobile-saved-jobs">
          <button 
            className="navbar-link" 
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 'var(--space-3) var(--space-4)' }}
            onClick={() => setMobileSavedOpen(!mobileSavedOpen)}
          >
            <span>🔖 Saved Jobs</span>
            <span className="saved-jobs-badge">{savedJobs.length}</span>
          </button>
          {mobileSavedOpen && (
            <div className="mobile-saved-list" style={{ paddingLeft: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {savedJobs.length > 0 ? (
                savedJobs.map(job => (
                  <div key={job.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-4)', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)' }}>
                    <Link to={`/apply/${job.id}`} style={{ flex: 1, textDecoration: 'none', minWidth: 0 }} onClick={() => setMobileOpen(false)}>
                      <div style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{job.department}</div>
                    </Link>
                    <button 
                      className="saved-job-action" 
                      onClick={(e) => { e.stopPropagation(); removeJob(job.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                    >
                      ❌
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>No saved jobs yet.</div>
              )}
            </div>
          )}
        </div>
        {user && (
          <NavLink to="/dashboard" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`} onClick={() => setMobileOpen(false)}>
            My Applications
          </NavLink>
        )}
        {user?.role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`} onClick={() => setMobileOpen(false)}>
            Admin Panel
          </NavLink>
        )}

        <div className="mobile-menu-auth">
          {user ? (
            <>
              <div style={{ padding: '8px 16px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                Signed in as <strong>{user.name}</strong>
              </div>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline-navy" onClick={() => setMobileOpen(false)}>Sign In</Link>
              <Link to="/register" className="btn btn-primary" onClick={() => setMobileOpen(false)}>Register Free</Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
