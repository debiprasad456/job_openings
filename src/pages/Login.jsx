import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.from || '/';

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
    if (!form.email.trim()) e.email = 'Email is required.';
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
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Server error (${res.status}). Please ensure backend server is running.`);
      }
      login(data.user, data.token);
      const targetPath = (data.user?.role === 'employer' || data.user?.role === 'admin')
        ? '/employer'
        : (returnTo && returnTo !== '/' ? returnTo : '/');
      navigate(targetPath, { replace: true });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* ── Left Branding Panel ── */}
      <div className="auth-panel-left" aria-hidden="true">
        <div className="auth-panel-dots" />
        <div className="auth-panel-content">

          <div className="auth-panel-logo">
            <img src="/assets/logo.png" alt="Diverse Solutions" />
            <div className="auth-panel-logo-text">
              <span className="auth-panel-logo-name">Diverse Solutions</span>
              <span className="auth-panel-logo-tagline">Career Portal</span>
            </div>
          </div>

          <h2 className="auth-panel-heading">
            Your Next Big<br />
            <span className="orange">Career Move</span><br />
            Starts Here
          </h2>

          <p className="auth-panel-sub">
            Join hundreds of MBA professionals who found their dream roles through Diverse Solutions.
          </p>

          <div className="auth-features">
            {[
              { icon: '💼', title: '8+ Open Positions', desc: 'Across Finance, Marketing, HR & more' },
              { icon: '📍', title: '7 Cities in India', desc: 'Mumbai, Delhi, Bengaluru and beyond' },
              { icon: '💰', title: '₹6–18 LPA Packages', desc: 'Competitive compensation for MBA talent' },
              { icon: '⚡', title: 'Fast Hiring Process', desc: 'Get shortlisted within 7 working days' },
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

      {/* ── Right Form Panel ── */}
      <div className="auth-panel-right">
        <div className="auth-form-wrap animate-fade-in-up">

          <div className="auth-form-header">
            <span className="auth-badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>👤 Job Seeker Access</span>
            <h1 className="auth-form-title">Candidate Login 🎓</h1>
            <p className="auth-form-sub">
              Sign in to track your job applications and apply for top opportunities.
            </p>
          </div>

          <div className="auth-card">

            {/* API Error */}
            {apiError && (
              <div className="auth-error" role="alert">
                ❌ {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate id="login-form">

              {/* Email */}
              <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
                <label className="form-label required" htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  className={`form-input${errors.email ? ' error' : ''}`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  autoComplete="email"
                  autoFocus
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  style={{ borderColor: errors.email ? 'var(--color-error)' : '' }}
                />
                {errors.email && <span id="email-error" className="form-error">{errors.email}</span>}
              </div>

              {/* Password */}
              <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <label className="form-label required" htmlFor="login-password" style={{ marginBottom: 0 }}>Password</label>
                  <Link to="/forgot-password" className="forgot-link" tabIndex={-1}>Forgot password?</Link>
                </div>
                <div className="password-field">
                  <input
                    id="login-password"
                    type={showPwd ? 'text' : 'password'}
                    className={`form-input${errors.password ? ' error' : ''}`}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    autoComplete="current-password"
                    aria-describedby={errors.password ? 'pwd-error' : undefined}
                    style={{ borderColor: errors.password ? 'var(--color-error)' : '' }}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPwd(!showPwd)}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <span id="pwd-error" className="form-error">{errors.password}</span>}
              </div>

              <div style={{ marginBottom: 'var(--space-6)' }} />

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary auth-submit-btn"
                id="login-submit-btn"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</>
                ) : (
                  '🔐 Sign In to Portal'
                )}
              </button>

            </form>

            <div className="auth-divider">or</div>

            <div style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              New to Diverse Solutions?{' '}
              <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
                Create a free candidate account
              </Link>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                Are you an Employer or Recruiter?{' '}
                <Link to="/employer-login" style={{ fontWeight: 'var(--fw-semibold)', color: '#0369a1' }}>
                  Employer Login ›
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
