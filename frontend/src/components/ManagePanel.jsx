import { useState } from 'react';

export default function ManagePanel({ messages, onDelete, onClose }) {
  const [pendingId, setPendingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  async function handleDeleteClick(id) {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }

    setConfirmId(null);
    setPendingId(id);
    await onDelete(id);
    setPendingId(null);
  }

  return (
    <div className="manage-overlay" onClick={onClose}>
      <aside className="manage-panel" onClick={(e) => e.stopPropagation()}>
        <div className="manage-header">
          <div>
            <div className="panel-label">Mission Control</div>
            <h2 className="panel-title">Manage transmissions</h2>
          </div>
          <button type="button" className="manage-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {messages.length === 0 ? (
          <div className="manage-empty">No messages in orbit yet.</div>
        ) : (
          <ul className="manage-list">
            {messages.map((message) => (
              <li key={message._id} className="manage-item">
                <span className="manage-item-dot" style={{ '--orb-color': message.color }} />
                <div className="manage-item-body">
                  <div className="manage-item-name">{message.name}</div>
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
      </aside>
    </div>
  );
}
