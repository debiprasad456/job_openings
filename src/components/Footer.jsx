import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-grid">

          {/* Brand Column */}
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/assets/logo.png" alt="Diverse Solutions Logo" style={{ height: '36px', width: 'auto' }} />
              <span className="footer-logo-text" style={{ color: '#ffffff', fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-bold)' }}>Diverse Solutions</span>
            </div>
            <p className="footer-tagline">
              Connecting talented MBA professionals with top companies across India.
              Your next big career move starts here.
            </p>
            <div className="footer-social" aria-label="Social media links">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="LinkedIn" title="LinkedIn">in</a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="Twitter" title="Twitter">𝕏</a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="Facebook" title="Facebook">f</a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="Instagram" title="Instagram">📷</a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h3 className="footer-col-title">Quick Links</h3>
            <nav className="footer-links" aria-label="Quick links">
              <Link to="/" className="footer-link">Browse All Jobs</Link>
              <Link to="/login" className="footer-link">Sign In</Link>
              <Link to="/register" className="footer-link">Create Account</Link>
              <Link to="/dashboard" className="footer-link">My Applications</Link>
            </nav>
          </div>

          {/* Job Categories */}
          <div className="footer-col">
            <h3 className="footer-col-title">Job Categories</h3>
            <nav className="footer-links" aria-label="Job categories">
              <Link to="/?category=Finance" className="footer-link">Finance & Accounts</Link>
              <Link to="/?category=Marketing" className="footer-link">Sales & Marketing</Link>
              <Link to="/?category=HR" className="footer-link">Human Resources</Link>
              <Link to="/?category=Operations" className="footer-link">Operations & SCM</Link>
              <Link to="/?category=Strategy" className="footer-link">Strategy & Consulting</Link>
              <Link to="/?category=Analytics" className="footer-link">Business Analytics</Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h3 className="footer-col-title">Contact Us</h3>
            <div className="footer-links">
              <div className="footer-contact-item">
                <span className="footer-contact-icon">📍</span>
                <span>Diverse Solutions Pvt. Ltd.<br />Ground floor, Plot, Palasuni, Rasulgarh, Bhubaneswar, Odisha 751025</span>
              </div>
              <div className="footer-contact-item">
                <span className="footer-contact-icon">✉️</span>
                <span>careers@diversesolutions.in</span>
              </div>
              <div className="footer-contact-item">
                <span className="footer-contact-icon">📞</span>
                <a href="https://wa.me/918260054398?text=Hello%20Diverse%20Solutions%2C%20I%20have%20an%20inquiry%20regarding%20job%20openings." target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                  +91 8260054398 (WhatsApp)
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <span>© {year} Diverse Solutions Pvt. Ltd. All rights reserved.</span>
          <div className="footer-bottom-links">
            <a href="#" className="footer-bottom-link">Privacy Policy</a>
            <a href="#" className="footer-bottom-link">Terms of Service</a>
            <a href="#" className="footer-bottom-link">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
