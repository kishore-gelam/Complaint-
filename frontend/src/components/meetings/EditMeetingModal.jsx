import React, { useState, useEffect } from 'react';
import { updateMeeting } from '../../api/meetings';

const toDateInput = (iso) => {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toTimeInput = (iso) => {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toLocalISOString = (dateStr, timeStr) => {
  return `${dateStr}T${timeStr}:00`;
};

const EditMeetingModal = ({ open, meeting, onClose, onUpdated }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && meeting) {
      setTitle(meeting.title || '');
      setDate(toDateInput(meeting.start_time));
      setStartTime(toTimeInput(meeting.start_time));
      setEndTime(toTimeInput(meeting.end_time));
      setLocation(meeting.location || '');
    }
  }, [open, meeting]);

  if (!open || !meeting) return null;

  const handleSave = async () => {
    if (!title || !date || !startTime || !endTime) return;
    setSaving(true);
    try {
      await updateMeeting(meeting.id, {
        title,
        location: location || null,
        start_time: toLocalISOString(date, startTime),
        end_time: toLocalISOString(date, endTime),
      });
      onUpdated && onUpdated();
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to update meeting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <h2 className="modal-title">Edit Meeting</h2>

        <label className="field-label">Title</label>
        <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Meeting title" />

        <label className="field-label">Date</label>
        <input type="date" className="field-input" value={date} onChange={(e) => setDate(e.target.value)} />

        <div className="field-row">
          <div>
            <label className="field-label">Start Time</label>
            <input type="time" className="field-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className="field-label">End Time</label>
            <input type="time" className="field-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>

        <label className="field-label">Location</label>
        <input className="field-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Room / link" />

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

export default EditMeetingModal;