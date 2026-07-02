import { useEffect, useState } from 'react';
import Scene from './components/Scene.jsx';
import { fetchMessages, postMessage } from './api.js';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMessages()
      .then(setMessages)
      .catch(() => setError('Could not reach the backend API.'));
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
        <div className="topbar-meta">Orbital Message Archive</div>
      </header>

      <div className="nameplate">
        <div className="nameplate-label">Planet</div>
        <h1 className="nameplate-title">Aetheris</h1>
        <div className="nameplate-sub">
          Kepler Sector · Ringed Class · {messages.length}{' '}
          {messages.length === 1 ? 'message' : 'messages'} in orbit
        </div>
      </div>

      <aside className="panel">
        <div className="panel-label">New Transmission</div>
        <h2 className="panel-title">Launch a message into orbit</h2>
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
        {error && <div className="status error">{error}</div>}
      </aside>

      <div className="footer-hint">Drag to rotate&ensp;·&ensp;Scroll to zoom</div>
    </div>
  );
}
