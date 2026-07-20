import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/auth.css';

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Step 1: 'request' | Step 2: 'verify' | Step 3: 'reset'
  const [step, setStep] = useState('request'); 
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [otpToken, setOtpToken] = useState(''); // Received after OTP verification
  const [showPwd, setShowPwd] = useState(false);

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Validate Step 1 (Email)
  const validateEmail = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Validate Step 2 (OTP)
  const validateOtp = () => {
    const e = {};
    if (!otp.trim()) e.otp = 'OTP is required.';
    else if (!/^\d{6}$/.test(otp.trim())) e.otp = 'OTP must be a 6-digit number.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Validate Step 3 (Passwords)
  const validatePasswords = () => {
    const e = {};
    if (!password) e.password = 'Password is required.';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    
    if (!confirmPassword) e.confirmPassword = 'Confirm your password.';
    else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match.';
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Handle Step 1 Submit: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setLoading(true);
    setApiError('');
    setApiSuccess('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request OTP.');
      }
      setApiSuccess(`OTP sent successfully to ${email}. Check your inbox!`);
      setStep('verify');
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2 Submit: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!validateOtp()) return;

    setLoading(true);
    setApiError('');
    setApiSuccess('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP.');
      }

      setOtpToken(data.otpToken);
      setApiSuccess('OTP verified successfully! Create your new password.');
      setStep('reset');
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 3 Submit: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validatePasswords()) return;

    setLoading(true);
    setApiError('');
    setApiSuccess('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpToken, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setApiSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2500);
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
            Reset Your<br />
            <span className="orange">Password</span><br />
            Securely
          </h2>

          <p className="auth-panel-sub">
            Verify your email with a one-time code to recover access to your career dashboard.
          </p>

          <div className="auth-features">
            {[
              { icon: '🔒', title: 'Secure Verification', desc: 'Protected by encrypted OTP authentication' },
              { icon: '⚡', title: 'Instant Recovery', desc: 'Reset your password in under 2 minutes' },
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
            <h1 className="auth-form-title">Reset password 🔑</h1>
            <p className="auth-form-subtitle">
              Remembered your credentials?{' '}
              <Link to="/login">Sign in here →</Link>
            </p>
          </div>

          <div className="auth-card">
            {/* Success Alert */}
            {apiSuccess && (
              <div className="auth-success" style={{ padding: '12px', background: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: '500' }}>
                ✅ {apiSuccess}
              </div>
            )}

            {/* Error Alert */}
            {apiError && (
              <div className="auth-error" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
                ❌ {apiError}
              </div>
            )}

            {/* ── VIEW 1: Request OTP ── */}
            {step === 'request' && (
              <form onSubmit={handleRequestOtp} noValidate>
                <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
                  <label className="form-label required" htmlFor="forgot-email">Email Address</label>
                  <input
                    id="forgot-email"
                    type="email"
                    className={`form-input${errors.email ? ' error' : ''}`}
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                      setApiError('');
                    }}
                    autoComplete="email"
                    autoFocus
                    style={{ borderColor: errors.email ? 'var(--color-error)' : '' }}
                  />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <><span className="spinner" style={{ width: 16, height: 16 }} /> Sending OTP...</>
                  ) : (
                    '📩 Send One-Time Password'
                  )}
                </button>
              </form>
            )}

            {/* ── VIEW 2: Verify OTP ── */}
            {step === 'verify' && (
              <form onSubmit={handleVerifyOtp} noValidate>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                  An OTP has been sent to <strong>{email}</strong>. Enter the 6-digit code below:
                </p>

                <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
                  <label className="form-label required" htmlFor="forgot-otp">6-Digit OTP</label>
                  <input
                    id="forgot-otp"
                    type="text"
                    maxLength={6}
                    pattern="\d*"
                    className={`form-input${errors.otp ? ' error' : ''}`}
                    placeholder="123456"
                    value={otp}
                    onChange={e => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      if (errors.otp) setErrors(prev => ({ ...prev, otp: '' }));
                      setApiError('');
                    }}
                    autoFocus
                    style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.25rem', borderColor: errors.otp ? 'var(--color-error)' : '' }}
                  />
                  {errors.otp && <span className="form-error">{errors.otp}</span>}
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button
                    type="button"
                    className="btn btn-outline-navy"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setStep('request');
                      setApiSuccess('');
                      setApiError('');
                      setOtp('');
                    }}
                    disabled={loading}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 2 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <><span className="spinner" style={{ width: 16, height: 16 }} /> Verifying...</>
                    ) : (
                      '🔐 Verify OTP'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ── VIEW 3: Reset Password ── */}
            {step === 'reset' && (
              <form onSubmit={handleResetPassword} noValidate>
                {/* Password */}
                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label className="form-label required" htmlFor="new-password">New Password</label>
                  <div className="password-field">
                    <input
                      id="new-password"
                      type={showPwd ? 'text' : 'password'}
                      className={`form-input${errors.password ? ' error' : ''}`}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                        setApiError('');
                      }}
                      autoComplete="new-password"
                      autoFocus
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
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>

                {/* Confirm Password */}
                <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
                  <label className="form-label required" htmlFor="confirm-password">Confirm New Password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    className={`form-input${errors.confirmPassword ? ' error' : ''}`}
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                      setApiError('');
                    }}
                    autoComplete="new-password"
                    style={{ borderColor: errors.confirmPassword ? 'var(--color-error)' : '' }}
                  />
                  {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <><span className="spinner" style={{ width: 16, height: 16 }} /> Updating Password...</>
                  ) : (
                    '🚀 Update Password & Login'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
