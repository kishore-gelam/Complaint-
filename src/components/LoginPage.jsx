import React, { useState } from 'react';
import { login, saveSession } from '../api/auth';

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      saveSession(data.access_token, data.user);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <span className="sidebar-brand-icon">📋</span>
          <span>Complaint Box</span>
        </div>

        <h2 className="login-title">Employee Login</h2>
        <p className="login-subtitle">Sign in to access your dashboard.</p>

        {error && <p className="login-error">{error}</p>}

        <label className="field-label">Email</label>
        <input
          type="email"
          className="field-input"
          placeholder="you@gksociety.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="field-label">Password</label>
        <div className="password-field-wrap">
          <input
            type={showPassword ? 'text' : 'password'}
            className="field-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            className="password-toggle-icon"
            onClick={() => setShowPassword((prev) => !prev)}
            role="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </span>
        </div>

        <button className="btn btn--primary login-submit" type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;