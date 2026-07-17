import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import '../styles/navbar.css';

export default function Navbar({ user, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
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
