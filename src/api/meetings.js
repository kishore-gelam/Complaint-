import { getSession } from './auth';

const BASE_URL = 'http://localhost:8000';

function authHeaders() {
  const session = getSession();
  const token = session?.access_token || session?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getMeetings() {
  const res = await fetch(`${BASE_URL}/api/meetings/`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch meetings');
  return res.json();
}

export async function getTodayAgenda() {
  const res = await fetch(`${BASE_URL}/api/meetings/agenda/today`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch today agenda');
  return res.json();
}

export async function createMeeting(payload) {
  const res = await fetch(`${BASE_URL}/api/meetings/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create meeting');
  }
  return res.json();
}

export async function updateMeeting(meetingId, payload) {
  const res = await fetch(`${BASE_URL}/api/meetings/${meetingId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update meeting');
  }
  return res.json();
}

export async function deleteMeeting(meetingId) {
  const res = await fetch(`${BASE_URL}/api/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete meeting');
  }
  return res.json();
}