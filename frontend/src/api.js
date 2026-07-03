// Defaults to a relative path so requests always go to whatever host served
// the page (nginx proxies /api to the backend container in production, and
// the Vite dev server proxies it locally — see vite.config.js).
const API_URL = import.meta.env.VITE_API_URL || '';

let refreshPromise = null;

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Wraps fetch so that a single expired access token is silently refreshed
// (using the httpOnly refresh cookie backed by Redis) and the original
// request is retried once, instead of forcing the user to log in again
// every 15 minutes.
async function authFetch(path, options = {}) {
  const doFetch = () =>
    fetch(`${API_URL}${path}`, { ...options, credentials: 'include' });

  let res = await doFetch();

  if (res.status === 401) {
    const refreshRes = await refreshSession();
    if (refreshRes.ok) {
      res = await doFetch();
    }
  }

  return res;
}

async function parseError(res, fallback) {
  const body = await res.json().catch(() => ({}));
  return new Error(body.error || fallback);
}

// ---------- Messages ----------

export async function fetchMessages() {
  const res = await fetch(`${API_URL}/api/messages`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load messages');
  return res.json();
}

export async function postMessage({ name, text, planet }) {
  const res = await authFetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, text, planet }),
  });
  if (!res.ok) throw await parseError(res, 'Failed to post message');
  return res.json();
}

export async function deleteMessage(id) {
  const res = await authFetch(`/api/messages/${id}`, { method: 'DELETE' });
  if (!res.ok) throw await parseError(res, 'Failed to delete message');
}

export async function fetchMessagesForAdmin() {
  const res = await authFetch('/api/messages/admin/all');
  if (!res.ok) throw await parseError(res, 'Failed to load messages');
  return res.json();
}

// ---------- Auth ----------

export async function signup({ email, password }) {
  const res = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await parseError(res, 'Signup failed');
  return res.json();
}

export async function login({ email, password }) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await parseError(res, 'Login failed');
  return res.json();
}

export async function logout() {
  await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function fetchMe() {
  const res = await authFetch('/api/auth/me');
  if (!res.ok) return null;
  return res.json();
}
