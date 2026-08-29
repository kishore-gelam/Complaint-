import React, { useState } from 'react';
import { createMeeting } from '../api/meetings';
import { updateComplaintStatus } from '../api/complaints';

const LOCATIONS = ['Conference Room A', 'Conference Room B', "Chairman's Office", 'Virtual (MS Teams)'];

const toLocalISOString = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
};

const ManageComplaintModal = ({ open, complaint, onClose, onUpdated }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open || !complaint) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      if (date && time) {
        const startTime = new Date(`${date}T${time}`);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // default 1hr

        await createMeeting({
          title: `Meeting: ${complaint.subject}`,
          location: meetLink || location || null,
          start_time: toLocalISOString(startTime),
          end_time: toLocalISOString(endTime),
          related_complaint_id: complaint.dbId,
        });

        await updateComplaintStatus(complaint.dbId, 'Meeting Scheduled', note || null);
      }

      onUpdated && onUpdated();
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal manage-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <h2 className="modal-title">Manage Complaint</h2>
        <p className="modal-subtitle">Resolution Workflow</p>

        <h3 className="detail-section-title">Complaint Summary</h3>
        <div className="manage-summary-card">
          <div className="manage-summary-row">
            <div>
              <span className="admin-stat-label">Complaint ID</span>
              <p className="ref-link" style={{ fontSize: '16px', margin: '4px 0 0' }}>#{complaint.id}</p>
            </div>
            <div>
              <span className="admin-stat-label">Submission Date</span>
              <p style={{ fontWeight: 600, margin: '4px 0 0' }}>{complaint.date}</p>
            </div>
          </div>
          <div className="manage-summary-sender">
            <span className="admin-stat-label">Sender Information</span>
            <p style={{ fontWeight: 600, margin: '4px 0 0' }}>{complaint.submitter_name || 'Unknown'}</p>
          </div>
        </div>

        <h3 className="detail-section-title">Meeting Scheduler</h3>
        <div className="manage-scheduler-card">
          <p className="manage-scheduler-hint">Fix appointment to discuss this complaint</p>

          <div className="field-row">
            <div>
              <label className="field-label">Select Date</label>
              <input type="date" className="field-input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Select Time</label>
              <input type="time" className="field-input" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <label className="field-label">Meeting Place / Location</label>
          <select className="field-input" value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">Choose location…</option>
            {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>

          <label className="field-label">Meeting Link</label>
          <input
            type="text"
            className="field-input"
            placeholder="Paste the meet link"
            value={meetLink}
            onChange={(e) => setMeetLink(e.target.value)}
          />
        </div>

        <h3 className="detail-section-title">Internal Records</h3>
        <textarea
          className="field-input field-textarea"
          placeholder="Add a private note for staff members…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="modal-footer">
          <button className="btn btn--outline" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageComplaintModal;