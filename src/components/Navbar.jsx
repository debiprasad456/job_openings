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
  const userMenuRef = useRef(null);
  const savedMenuRef = useRef(null);
  const navigate = useNavigate();

  // Shadow on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [navigate]);

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

  const handleLogout = () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
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

            {/* Left section: Top-Left Hamburger + Logo */}
            <div className="navbar-brand-wrapper">
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

              <Link to="/" className="navbar-logo" aria-label="Diverse Solutions Home" onClick={() => setMobileOpen(false)}>
                <img src="/assets/logo.png" alt="Diverse Solutions Logo" />
                <div className="navbar-logo-text">
                  <span className="navbar-logo-name">Diverse Solutions</span>
                  <span className="navbar-logo-tagline">Career Portal</span>
                </div>
              </Link>
            </div>

            {/* Desktop Nav Links */}
            <div className="navbar-links" role="menubar">
              {user?.role !== 'employer' && user?.role !== 'admin' && (
                <>
                  <NavLink to="/" end className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`} role="menuitem">
                    Browse Jobs
                  </NavLink>

                  {user && (
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
                  )}

                  {user && (
                    <NavLink to="/dashboard" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`} role="menuitem">
                      My Applications
                    </NavLink>
                  )}
                </>
              )}

              {(user?.role === 'admin' || user?.role === 'employer') && (
                <NavLink to="/employer" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`} role="menuitem">
                  Employer Portal
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
                      {user.role !== 'employer' && user.role !== 'admin' && (
                        <Link to="/dashboard" className="dropdown-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                          📋 My Applications
                        </Link>
                      )}
                      {(user.role === 'admin' || user.role === 'employer') && (
                        <Link to="/employer" className="dropdown-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                          💼 Employer Portal
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
                  <Link to="/employer-login" className="employer-login-link">Employer Login</Link>
                  <Link to="/login" className="btn btn-primary candidate-login-btn">Candidate Login</Link>
                </>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="mobile-menu-backdrop" onClick={() => setMobileOpen(false)} />
      )}
      <div className={`mobile-menu${mobileOpen ? ' open' : ''}`} role="menu" aria-label="Mobile navigation">
        <div className="mobile-menu-content">
          {!user ? (
            <div className="mobile-auth-options">
              <Link
                to="/employer-login"
                className="mobile-auth-card employer"
                onClick={() => setMobileOpen(false)}
              >
                <div className="mobile-auth-card-icon">💼</div>
                <div className="mobile-auth-card-text">
                  <div className="mobile-auth-card-title">Employer Login</div>
                  <div className="mobile-auth-card-sub">Post jobs & hire candidates</div>
                </div>
              </Link>

              <Link
                to="/login"
                className="mobile-auth-card candidate"
                onClick={() => setMobileOpen(false)}
              >
                <div className="mobile-auth-card-icon">👤</div>
                <div className="mobile-auth-card-text">
                  <div className="mobile-auth-card-title">Candidate Login</div>
                  <div className="mobile-auth-card-sub">Find & apply for jobs</div>
                </div>
              </Link>
            </div>
          ) : (
            <div className="mobile-user-card">
              <div className="user-avatar">{initials}</div>
              <div className="mobile-user-info">
                <div className="user-dropdown-name">{user.name}</div>
                <div className="user-dropdown-email">{user.email}</div>
              </div>
            </div>
          )}

          <div className="mobile-menu-divider" />

          <div className="mobile-menu-links">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `mobile-menu-item${isActive ? ' active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span>🔍 Browse Jobs</span>
            </NavLink>

            {user && user.role !== 'employer' && user.role !== 'admin' && (
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `mobile-menu-item${isActive ? ' active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span>📋 My Applications</span>
              </NavLink>
            )}

            {user && (user.role === 'admin' || user.role === 'employer') && (
              <NavLink
                to="/employer"
                className={({ isActive }) => `mobile-menu-item${isActive ? ' active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span>💼 Employer Portal</span>
              </NavLink>
            )}
          </div>

          {user && (
            <div className="mobile-menu-footer">
              <button className="mobile-signout-btn" onClick={handleLogout}>
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
