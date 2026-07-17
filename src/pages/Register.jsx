import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

// ── Password Strength Calculator ──
function getStrength(pwd) {
  if (!pwd) return { score: 0, label: '', cls: '' };
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map = ['', 'weak', 'fair', 'good', 'strong'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[score], cls: map[score] };
}

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', terms: false,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = getStrength(form.password);

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    setApiError('');
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required.';
    if (!form.lastName.trim())  e.lastName  = 'Last name is required.';
    if (!form.email.trim())     e.email     = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.phone.trim())     e.phone     = 'Phone number is required.';
    else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid 10-digit Indian mobile number.';
    if (!form.password)         e.password  = 'Password is required.';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (!form.confirmPassword)  e.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    if (!form.terms)            e.terms = 'You must accept the terms to register.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }
      login(data.user, data.token);
      navigate('/', { replace: true });
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
            Begin Your<br />
            <span className="orange">MBA Career</span><br />
            Journey Today
          </h2>

          <p className="auth-panel-sub">
            Create your profile in 60 seconds and start applying to exclusive MBA openings at Diverse Solutions.
          </p>

          <div className="auth-features">
            {[
              { icon: '🚀', title: 'Quick Application',    desc: 'Apply to multiple jobs with one profile' },
              { icon: '📊', title: 'Track Your Progress',  desc: 'Real-time status updates on every application' },
              { icon: '🎯', title: 'Role-Specific Forms',  desc: 'Tailored application for each position' },
              { icon: '🔒', title: 'Secure & Private',     desc: 'Your data is safe with us' },
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
            <h1 className="auth-form-title">Create your account 🎉</h1>
            <p className="auth-form-subtitle">
              Already registered?{' '}
              <Link to="/login">Sign in →</Link>
            </p>
          </div>

          <div className="auth-card">

            {/* API Error */}
            {apiError && (
              <div className="auth-error" role="alert">
                ❌ {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate id="register-form">

              {/* Name Row */}
              <div className="auth-form-grid-2" style={{ marginBottom: 'var(--space-5)' }}>
                <div className="form-group">
                  <label className="form-label required" htmlFor="reg-fname">First Name</label>
                  <input
                    id="reg-fname"
                    type="text"
                    className="form-input"
                    placeholder="Rahul"
                    value={form.firstName}
                    onChange={e => set('firstName', e.target.value)}
                    autoComplete="given-name"
                    autoFocus
                    style={{ borderColor: errors.firstName ? 'var(--color-error)' : '' }}
                  />
                  {errors.firstName && <span className="form-error">{errors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label required" htmlFor="reg-lname">Last Name</label>
                  <input
                    id="reg-lname"
                    type="text"
                    className="form-input"
                    placeholder="Sharma"
                    value={form.lastName}
                    onChange={e => set('lastName', e.target.value)}
                    autoComplete="family-name"
                    style={{ borderColor: errors.lastName ? 'var(--color-error)' : '' }}
                  />
                  {errors.lastName && <span className="form-error">{errors.lastName}</span>}
                </div>
              </div>

              {/* Email */}
              <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
                <label className="form-label required" htmlFor="reg-email">Email Address</label>
                <input
                  id="reg-email"
                  type="email"
                  className="form-input"
                  placeholder="rahul.sharma@gmail.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  autoComplete="email"
                  style={{ borderColor: errors.email ? 'var(--color-error)' : '' }}
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              {/* Phone */}
              <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
                <label className="form-label required" htmlFor="reg-phone">Mobile Number</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <span style={{
                    display: 'flex', alignItems: 'center', padding: '0 12px',
                    background: 'var(--color-surface-alt)', border: '1.5px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)',
                    flexShrink: 0, fontWeight: 'var(--fw-medium)', whiteSpace: 'nowrap',
                  }}>
                    🇮🇳 +91
                  </span>
                  <input
                    id="reg-phone"
                    type="tel"
                    className="form-input"
                    placeholder="98765 43210"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                    autoComplete="tel"
                    maxLength={10}
                    style={{ borderColor: errors.phone ? 'var(--color-error)' : '' }}
                  />
                </div>
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>

              {/* Password */}
              <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
                <label className="form-label required" htmlFor="reg-password">Create Password</label>
                <div className="password-field">
                  <input
                    id="reg-password"
                    type={showPwd ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    autoComplete="new-password"
                    style={{ borderColor: errors.password ? 'var(--color-error)' : '' }}
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPwd(!showPwd)} tabIndex={-1} aria-label="Toggle password visibility">
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <span className="form-error">{errors.password}</span>}
                {/* Password Strength */}
                {form.password && (
                  <div className="password-strength" aria-label={`Password strength: ${strength.label}`}>
                    <div className="strength-bars">
                      {[1,2,3,4].map(n => (
                        <div key={n} className={`strength-bar${strength.score >= n ? ` filled-${strength.cls}` : ''}`} />
                      ))}
                    </div>
                    <span className={`strength-label ${strength.cls}`}>
                      {strength.label && `Password strength: ${strength.label}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
                <label className="form-label required" htmlFor="reg-confirm">Confirm Password</label>
                <div className="password-field">
                  <input
                    id="reg-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)}
                    autoComplete="new-password"
                    style={{ borderColor: errors.confirmPassword ? 'var(--color-error)' : (form.confirmPassword && form.confirmPassword === form.password ? 'var(--color-success)' : '') }}
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1} aria-label="Toggle confirm password visibility">
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
                {!errors.confirmPassword && form.confirmPassword && form.confirmPassword === form.password && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', marginTop: '4px', display: 'block' }}>✓ Passwords match</span>
                )}
              </div>

              {/* Terms */}
              <div className="terms-row" style={{ marginBottom: errors.terms ? 0 : 'var(--space-5)' }}>
                <input
                  type="checkbox"
                  id="reg-terms"
                  className="terms-checkbox"
                  checked={form.terms}
                  onChange={e => set('terms', e.target.checked)}
                />
                <label htmlFor="reg-terms" className="terms-label">
                  I agree to the{' '}
                  <a href="#" onClick={e => e.preventDefault()}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" onClick={e => e.preventDefault()}>Privacy Policy</a>
                </label>
              </div>
              {errors.terms && <span className="form-error" style={{ marginBottom: 'var(--space-4)', display: 'block' }}>{errors.terms}</span>}

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary auth-submit-btn"
                id="register-submit-btn"
                disabled={loading}
                aria-busy={loading}
                style={{ marginTop: errors.terms ? 'var(--space-4)' : 0 }}
              >
                {loading ? (
                  <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating account...</>
                ) : (
                  '🚀 Create My Account'
                )}
              </button>

            </form>

            <div className="auth-divider">already a member?</div>

            <Link to="/login" className="btn btn-outline-navy auth-submit-btn">
              Sign In Instead
            </Link>

          </div>
        </div>
      </div>
    </div>
  );
}
