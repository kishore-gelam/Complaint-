import { getSession } from './auth';

const BASE_URL = 'http://localhost:8000';

function parseErrorDetail(err) {
  if (!err || !err.detail) return null;
  if (typeof err.detail === 'string') return err.detail;
  if (Array.isArray(err.detail)) {
    return err.detail.map((e) => e.msg || JSON.stringify(e)).join('; ');
  }
  return JSON.stringify(err.detail);
}

function authHeaders() {
  const session = getSession();
  return session ? { Authorization: `Bearer ${session.token}` } : {};
}

export async function listEmployees(page = 1, pageSize = 5) {
  const res = await fetch(`${BASE_URL}/api/employees/?page=${page}&page_size=${pageSize}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to load employees');
  return res.json(); // { items, total }
}

export async function createEmployee(payload) {
  const res = await fetch(`${BASE_URL}/api/employees/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseErrorDetail(err) || 'Failed to create employee');
  }
  return res.json();
}
export async function updateEmployee(id, updates) {
  const res = await fetch(`${BASE_URL}/api/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseErrorDetail(err) || 'Failed to update employee');
  }
  return res.json();
}