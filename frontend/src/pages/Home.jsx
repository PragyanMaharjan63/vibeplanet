import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Scene from '../components/Scene.jsx';
import PlanetSelect from '../components/PlanetSelect.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchMessages, postMessage } from '../api.js';
import { PLANETS, DEFAULT_PLANET, getPlanet } from '../planets.js';

export default function Home() {
  const { user, isAdmin, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [view, setView] = useState('detail');
  const [selectedPlanet, setSelectedPlanet] = useState(DEFAULT_PLANET);
  const [destinationPlanet, setDestinationPlanet] = useState(DEFAULT_PLANET);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const successTimer = useRef(null);

  const config = getPlanet(selectedPlanet);
  const messagesForPlanet = messages.filter((m) => (m.planet || DEFAULT_PLANET) === selectedPlanet);

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
    return () => clearTimeout(successTimer.current);
  }, []);

  // Default the "send to" planet to whichever one is currently in view —
  // still overridable in the form before submitting.
  useEffect(() => {
    setDestinationPlanet(selectedPlanet);
  }, [selectedPlanet]);

  useEffect(() => {
    document.title =
      view === 'system'
        ? 'Solar System — Aetheris'
        : `${config.name} — Aetheris`;
  }, [view, config.name]);

  function handleViewChange({ view: nextView, planet }) {
    setView(nextView);
    if (planet) setSelectedPlanet(planet);
  }

  function handleSelectFromSystem(planetId) {
    setSelectedPlanet(planetId);
    setView('detail');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const created = await postMessage({ name, text, planet: destinationPlanet });
      setMessages((prev) => [created, ...prev]);
      setName('');
      setText('');
      const destination = getPlanet(destinationPlanet);
      setSuccess(`Transmission launched to ${destination.name} 🚀`);
      clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setSuccess(''), 4000);
      // Jump to where the message just went so the user sees it arrive.
      setSelectedPlanet(destinationPlanet);
      setView('detail');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app">
      <div className="canvas-wrap">
        <Scene
          mode={view}
          selectedPlanet={selectedPlanet}
          messages={messagesForPlanet}
          allMessages={messages}
          onSelectPlanet={handleSelectFromSystem}
        />
      </div>
      <div className="vignette" aria-hidden="true" />

      <header className="topbar">
        <div className="wordmark">
          <span className="wordmark-dot" />
          Aetheris
        </div>

        <PlanetSelect view={view} selectedPlanet={selectedPlanet} onChange={handleViewChange} />

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
        {view === 'system' ? (
          <>
            <div className="nameplate-label">Overview</div>
            <h1 className="nameplate-title">Solar System</h1>
            <div className="nameplate-sub">
              {loading
                ? 'Charting transmissions…'
                : loadFailed
                ? 'Offline'
                : `${messages.length} ${messages.length === 1 ? 'message' : 'messages'} across 8 worlds · click a planet to visit it`}
            </div>
          </>
        ) : (
          <>
            <div className="nameplate-label">Planet</div>
            <h1 className="nameplate-title">{config.name}</h1>
            <div className="nameplate-sub">
              {loading
                ? `${config.tagline} · loading transmissions…`
                : loadFailed
                ? `${config.tagline} · offline`
                : `${config.tagline} · ${messagesForPlanet.length} ${
                    messagesForPlanet.length === 1 ? 'message' : 'messages'
                  } in orbit`}
            </div>
            {!loading && messagesForPlanet.length === 0 && !loadFailed && (
              <div className="nameplate-hint">No transmissions yet — be the first to launch one.</div>
            )}
          </>
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
              <span>
                Message
                <em className="char-count">{text.length}/240</em>
              </span>
              <textarea
                placeholder="Say something worth orbiting…"
                rows={3}
                value={text}
                maxLength={240}
                onChange={(e) => setText(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Send to</span>
              <select value={destinationPlanet} onChange={(e) => setDestinationPlanet(e.target.value)}>
                {PLANETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
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
        {success && <div className="status success">{success}</div>}
      </aside>

      <div className="footer-hint">
        {view === 'system'
          ? 'Click a planet to visit · Drag to rotate · Scroll to zoom'
          : 'Drag to rotate · Scroll to zoom'}
      </div>
    </div>
  );
}
