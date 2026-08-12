import { getSession } from './auth';

const BASE_URL = 'http://localhost:8000';

function authHeaders() {
  const session = getSession();
  return session ? { Authorization: `Bearer ${session.token}` } : {};
}

export async function listEmployees() {
  const res = await fetch(`${BASE_URL}/api/employees/`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to load employees');
  return res.json();
}

export async function createEmployee({ name, email, password, role }) {
  const res = await fetch(`${BASE_URL}/api/employees/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, email, password, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create employee');
  }
  return res.json();
}