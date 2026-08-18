import { getSession } from './auth';

const BASE_URL = 'http://localhost:8000';

function authHeaders() {
  const session = getSession();
  const token = session?.access_token || session?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getComplaints() {
  const res = await fetch(`${BASE_URL}/api/complaints/`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch complaints');
  return res.json();
}

export async function getComplaintStats() {
  const res = await fetch(`${BASE_URL}/api/complaints/stats`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch complaint stats');
  return res.json();
}

export async function createComplaint(payload) {
  const res = await fetch(`${BASE_URL}/api/complaints/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create complaint');
  return res.json();
}

export async function updateComplaintStatus(complaintId, status, note) {
  const res = await fetch(`${BASE_URL}/api/complaints/${complaintId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ status, note: note || null }),
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}

export async function advanceStage(complaintId, note) {
  const res = await fetch(`${BASE_URL}/api/complaints/${complaintId}/advance-stage`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ note: note || null }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to advance stage');
  }
  return res.json();
}

export async function getComplaintEvents(complaintId) {
  const res = await fetch(`${BASE_URL}/api/complaints/${complaintId}/events`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch complaint events');
  return res.json();
}

export async function uploadAttachment(complaintId, file, stage = 'Submitted') {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/api/complaints/${complaintId}/attachments?stage=${encodeURIComponent(stage)}`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload attachment');
  return res.json();
}

export async function getAttachments(complaintId) {
  const res = await fetch(`${BASE_URL}/api/complaints/${complaintId}/attachments`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch attachments');
  return res.json();
}
export async function getRecentNotifications() {
  const res = await fetch(`${BASE_URL}/api/complaints/notifications/recent`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}