import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchMessagesForAdmin, deleteMessage } from '../api.js';

export default function Admin() {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  function load() {
    setLoading(true);
    setError('');
    fetchMessagesForAdmin()
      .then(setMessages)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDeleteClick(id) {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    setConfirmId(null);
    setPendingId(id);
    const previous = messages;
    setMessages((prev) => prev.filter((m) => m._id !== id));
    try {
      await deleteMessage(id);
    } catch (err) {
      setMessages(previous);
      setError(err.message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <div className="panel-label">Mission Control</div>
          <h1 className="panel-title">Admin — manage transmissions</h1>
          <div className="admin-meta">Signed in as {user.email}</div>
        </div>
        <div className="admin-header-actions">
          <Link to="/" className="manage-trigger">
            ← Back to orbit
          </Link>
          <button type="button" className="manage-trigger" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      {loading && <div className="manage-empty">Loading transmissions…</div>}
      {!loading && error && (
        <div className="admin-error">
          {error}
          <button type="button" className="retry-button" onClick={load}>
            Retry
          </button>
        </div>
      )}
      {!loading && !error && messages.length === 0 && (
        <div className="manage-empty">No messages in orbit yet.</div>
      )}

      {!loading && !error && messages.length > 0 && (
        <ul className="manage-list admin-list">
          {messages.map((message) => (
            <li key={message._id} className="manage-item">
              <span className="manage-item-dot" style={{ '--orb-color': message.color }} />
              <div className="manage-item-body">
                <div className="manage-item-name">
                  {message.name}
                  {message.author?.email && (
                    <span className="admin-item-author"> · {message.author.email}</span>
                  )}
                </div>
                <div className="manage-item-text">{message.text}</div>
              </div>
              <button
                type="button"
                className={`manage-delete ${confirmId === message._id ? 'confirm' : ''}`}
                disabled={pendingId === message._id}
                onClick={() => handleDeleteClick(message._id)}
                onBlur={() => setConfirmId(null)}
              >
                {pendingId === message._id
                  ? 'Deleting…'
                  : confirmId === message._id
                  ? 'Confirm'
                  : 'Delete'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
