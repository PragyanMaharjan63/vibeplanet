import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Scene from '../components/Scene.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchMessages, postMessage } from '../api.js';

export default function Home() {
  const { user, isAdmin, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  function loadMessages() {
    setLoading(true);
    setLoadFailed(false);
    fetchMessages()
      .then((data) => {
        setMessages(data);
        setError('');
      })
      .catch(() => {
        setLoadFailed(true);
        setError('Could not reach the backend API.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadMessages();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      const created = await postMessage({ name, text });
      setMessages((prev) => [created, ...prev]);
      setName('');
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app">
      <div className="canvas-wrap">
        <Scene messages={messages} />
      </div>

      <header className="topbar">
        <div className="wordmark">
          <span className="wordmark-dot" />
          Aetheris
        </div>
        <div className="topbar-right">
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="manage-trigger">
                  Admin panel
                </Link>
              )}
              <div className="topbar-meta">{user.email}</div>
              <button type="button" className="manage-trigger" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="manage-trigger">
                Log in
              </Link>
              <Link to="/signup" className="manage-trigger">
                Sign up
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="nameplate">
        <div className="nameplate-label">Planet</div>
        <h1 className="nameplate-title">Aetheris</h1>
        <div className="nameplate-sub">
          {loading
            ? 'Kepler Sector · Ringed Class · loading transmissions…'
            : loadFailed
            ? 'Kepler Sector · Ringed Class · offline'
            : `Kepler Sector · Ringed Class · ${messages.length} ${
                messages.length === 1 ? 'message' : 'messages'
              } in orbit`}
        </div>
        {!loading && messages.length === 0 && !loadFailed && (
          <div className="nameplate-hint">No transmissions yet — be the first to launch one.</div>
        )}
        {loadFailed && (
          <button type="button" className="retry-button" onClick={loadMessages}>
            Retry connection
          </button>
        )}
      </div>

      <aside className="panel">
        <div className="panel-label">New Transmission</div>
        <h2 className="panel-title">Launch a message into orbit</h2>

        {user ? (
          <form onSubmit={handleSubmit}>
            <label className="field">
              <span>Name</span>
              <input
                placeholder="Your name"
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Message</span>
              <textarea
                placeholder="Say something worth orbiting…"
                rows={3}
                value={text}
                maxLength={240}
                onChange={(e) => setText(e.target.value)}
              />
            </label>
            <button type="submit" disabled={submitting || !name.trim() || !text.trim()}>
              {submitting ? 'Launching…' : 'Launch transmission'}
            </button>
          </form>
        ) : (
          <div className="auth-gate">
            <p>Log in to launch a message into orbit. Anyone can view — only signed-in visitors can add one.</p>
            <div className="auth-gate-actions">
              <Link to="/login" className="auth-gate-link primary">
                Log in
              </Link>
              <Link to="/signup" className="auth-gate-link">
                Sign up
              </Link>
            </div>
          </div>
        )}

        {error && <div className="status error">{error}</div>}
      </aside>

      <div className="footer-hint">Drag to rotate&ensp;·&ensp;Scroll to zoom</div>
    </div>
  );
}
