// Defaults to a relative path so requests always go to whatever host served
// the page (nginx proxies /api to the backend container in production, and
// the Vite dev server proxies it locally — see vite.config.js).
const API_URL = import.meta.env.VITE_API_URL || '';

export async function fetchMessages() {
  const res = await fetch(`${API_URL}/api/messages`);
  if (!res.ok) throw new Error('Failed to load messages');
  return res.json();
}

export async function postMessage({ name, text }) {
  const res = await fetch(`${API_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, text }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to post message');
  }
  return res.json();
}

export async function deleteMessage(id) {
  const res = await fetch(`${API_URL}/api/messages/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to delete message');
  }
}
