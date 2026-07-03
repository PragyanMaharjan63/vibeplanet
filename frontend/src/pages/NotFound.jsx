import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="auth-card notfound-card">
        <div className="wordmark">
          <span className="wordmark-dot" />
          Aetheris
        </div>
        <div className="notfound-code">404</div>
        <h1 className="panel-title">Lost in deep space</h1>
        <p className="notfound-text">
          This coordinate doesn't map to any known world. The planet you're
          looking for may have drifted, or never existed at all.
        </p>
        <Link to="/" className="auth-gate-link primary">
          Return to the solar system
        </Link>
      </div>
    </div>
  );
}
