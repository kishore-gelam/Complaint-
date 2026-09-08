import React, { useState } from 'react';
import { signup, saveSession } from '../api/auth';

const SignupPage = ({ onSignupSuccess, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await signup(name, email, password, role);
      saveSession(data.access_token, data.user);
      onSignupSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Signup failed.');
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

        <h2 className="login-title">Create Account</h2>
        <p className="login-subtitle">Sign up to get started.</p>

        {error && <p className="login-error">{error}</p>}

        <label className="field-label">Name</label>
        <input
          type="text"
          className="field-input"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

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
        <input
          type="password"
          className="field-input"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label className="field-label">Role</label>
        <select
          className="field-input"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        >
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>

        <button className="btn btn--primary login-submit" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Sign Up'}
        </button>

        <p className="login-subtitle" style={{ marginTop: '12px' }}>
          Already have an account?{' '}
          <span style={{ color: '#1e93e0', cursor: 'pointer' }} onClick={onSwitchToLogin}>
            Sign in
          </span>
        </p>
      </form>
    </div>
  );
};

export default SignupPage;