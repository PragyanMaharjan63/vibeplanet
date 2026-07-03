import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await signup({ email, password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="wordmark auth-brand">
          <span className="wordmark-dot" />
          Aetheris
        </div>
        <div className="panel-label">Access</div>
        <h1 className="panel-title">Create an account</h1>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <div className="field-hint">At least 8 characters.</div>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>

        {error && <div className="status error">{error}</div>}

        <div className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
        <Link to="/" className="auth-back">
          ← Back to orbit
        </Link>
      </form>
    </div>
  );
}
