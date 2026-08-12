const BASE_URL = 'http://localhost:8000';

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Login failed');
  }
  return res.json(); // { access_token, token_type, user }
}

export function saveSession(token, user) {
  localStorage.setItem('cb_token', token);
  localStorage.setItem('cb_user', JSON.stringify(user));
}

export function getSession() {
  const token = localStorage.getItem('cb_token');
  const userRaw = localStorage.getItem('cb_user');
  if (!token || !userRaw) return null;
  return { token, user: JSON.parse(userRaw) };
}

export function clearSession() {
  localStorage.removeItem('cb_token');
  localStorage.removeItem('cb_user');
}
