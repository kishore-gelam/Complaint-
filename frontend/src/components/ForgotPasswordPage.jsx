import React, { useState } from 'react';
import { forgotPassword, resetPassword } from '../api/auth';

const ForgotPasswordPage = ({ onBackToLogin }) => {
  const [step, setStep] = useState('request'); // 'request' | 'reset'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess('If that email is registered, an OTP has been sent.');
      setStep('reset');
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email, otp, newPassword);
      setSuccess('Password reset successfully! Redirecting to sign in…');
      setTimeout(() => onBackToLogin(), 1500);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form
        className="login-card"
        onSubmit={step === 'request' ? handleRequestOtp : handleResetPassword}
      >
        <div className="login-brand">
          <span className="sidebar-brand-icon">📋</span>
          <span>Complaint Box</span>
        </div>

        <h2 className="login-title">Forgot Password</h2>
        <p className="login-subtitle">
          {step === 'request'
            ? "Enter your email — we'll send you an OTP."
            : 'Enter the OTP sent to your email and your new password.'}
        </p>

        {error && <p className="login-error">{error}</p>}
        {success && <p className="login-success">{success}</p>}

        <label className="field-label">Email</label>
        <input
          type="email"
          className="field-input"
          placeholder="you@gksociety.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={step === 'reset'}
        />

        {step === 'reset' && (
          <>
            <label className="field-label">OTP</label>
            <input
              type="text"
              className="field-input"
              placeholder="6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
            />

            <label className="field-label">New Password</label>
            <div className="password-field-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className="field-input"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <span
                className="password-toggle-icon"
                onClick={() => setShowPassword((v) => !v)}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </span>
            </div>
          </>
        )}

        <button className="btn btn--primary login-submit" type="submit" disabled={loading}>
          {loading ? 'Please wait…' : step === 'request' ? 'Send OTP' : 'Reset Password'}
        </button>

        <p className="login-subtitle" style={{ marginTop: '12px' }}>
          <span style={{ color: '#1e93e0', cursor: 'pointer' }} onClick={onBackToLogin}>
            Back to Sign In
          </span>
        </p>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;