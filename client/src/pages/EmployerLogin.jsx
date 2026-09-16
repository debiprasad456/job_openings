import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function EmployerLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    setApiError('');
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Employer email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.password) e.password = 'Password is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, targetPortal: 'employer' }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Server error (${res.status}). Please ensure backend server is running.`);
      }

      if (data.user?.role !== 'employer' && data.user?.role !== 'admin') {
        throw new Error('This account is registered as a Candidate. Please log in using Candidate Login.');
      }

      login(data.user, data.token);
      navigate('/employer', { replace: true });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* ── Left Branding Panel (Employer specific) ── */}
      <div className="auth-panel-left" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }} aria-hidden="true">
        <div className="auth-panel-dots" />
        <div className="auth-panel-content">

          <div className="auth-panel-logo">
            <img src="/assets/logo.png" alt="Diverse Solutions" />
            <div className="auth-panel-logo-text">
              <span className="auth-panel-logo-name">Diverse Solutions</span>
              <span className="auth-panel-logo-tagline">Employer Portal</span>
            </div>
          </div>

          <h2 className="auth-panel-heading">
            Hire Top<br />
            <span style={{ color: '#38bdf8' }}>Verified Talent</span><br />
            Faster Than Ever
          </h2>

          <p className="auth-panel-sub">
            Access 2,200+ active candidates across Odisha & India. Post jobs, review resumes, and shortlist top talent seamlessly.
          </p>

          <div className="auth-features">
            {[
              { icon: '💼', title: 'Unlimited Job Postings', desc: 'Publish open roles and manage candidate workflow' },
              { icon: '👥', title: '2,200+ Database Matches', desc: 'Access pre-screened MBA & graduate candidates' },
              { icon: '📄', title: 'Direct Resume Access', desc: 'View original PDFs and candidate photos instantly' },
              { icon: '⚡', title: 'Instant Candidate Contact', desc: 'Shortlist, review, and contact candidates directly' },
            ].map(f => (
              <div key={f.title} className="auth-feature">
                <div className="auth-feature-icon">{f.icon}</div>
                <div className="auth-feature-text">
                  <div className="auth-feature-title">{f.title}</div>
                  <div className="auth-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Right Form Container (Employer Login) ── */}
      <div className="auth-panel-right">
        <div className="auth-form-card">

          <div className="auth-form-header">
            <span className="auth-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>💼 Recruiter & Employer Access</span>
            <h1 className="auth-form-title">Employer Login</h1>
            <p className="auth-form-sub">
              Sign in to manage your active job postings and candidate applications.
            </p>
          </div>

          {apiError && (
            <div className="auth-error-banner" role="alert">
              ⚠️ {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
              <label className="form-label required" htmlFor="emp-email">Employer Email Address</label>
              <div className="input-with-icon">
                <span className="input-icon" aria-hidden="true">✉️</span>
                <input
                  id="emp-email"
                  type="email"
                  className={`form-input${errors.email ? ' error' : ''}`}
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="form-error-msg">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                <label className="form-label required" htmlFor="emp-password" style={{ marginBottom: 0 }}>Password</label>
                <Link to="/forgot-password" className="auth-forgot-link">Forgot password?</Link>
              </div>
              <div className="input-with-icon">
                <span className="input-icon" aria-hidden="true">🔒</span>
                <input
                  id="emp-password"
                  type={showPwd ? 'text' : 'password'}
                  className={`form-input${errors.password ? ' error' : ''}`}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPwd(!showPwd)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? '👁️' : '🙈'}
                </button>
              </div>
              {errors.password && <span className="form-error-msg">{errors.password}</span>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', marginTop: '0.5rem' }}
            >
              {loading ? (
                <><span className="spinner-sm" aria-hidden="true" /> Signing in to Employer Portal...</>
              ) : (
                'Sign In to Employer Portal'
              )}
            </button>

          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Looking for job opportunities?{' '}
              <Link to="/login" style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--color-primary-navy)' }}>
                Candidate Login ›
              </Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
