import React, { useState } from 'react';
import { createMeeting } from '../../api/meetings';

const DEPARTMENTS = ['HR', 'IT', 'Finance', 'Operations', 'Marketing'];
const TIME_SLOTS = [
  '09:00 AM - 10:30 AM',
  '10:30 AM - 12:00 PM',
  '12:00 PM - 01:00 PM',
  '02:00 PM - 03:30 PM',
  '03:30 PM - 05:00 PM',
];
const PRIORITIES = [
  { key: 'High', label: 'High Priority', note: 'Chairman attendance required', dot: 'red' },
  { key: 'Medium', label: 'Medium', note: '', dot: 'orange' },
  { key: 'Standard', label: 'Standard', note: '', dot: 'gray' },
];

const parseSlot = (slot) => {
  const [start, end] = slot.split(' - ');
  return { start, end };
};

const to24Hour = (label) => {
  const [time, meridiem] = label.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (meridiem === 'PM' && h !== 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const NewMeetingModal = ({ open, onClose, onCreated, existingMeetings = [] }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState('High');
  const [departments, setDepartments] = useState(['Finance']);
  const [clusterHeads, setClusterHeads] = useState([]);
  const [headSearch, setHeadSearch] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const toggleDept = (dept) => {
    setDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const removeHead = (id) => {
    setClusterHeads((prev) => prev.filter((h) => h.id !== id));
  };

  const buildTimestamps = () => {
    const { start, end } = parseSlot(timeSlot);
    return {
      start_time: `${date}T${to24Hour(start)}:00`,
      end_time: `${date}T${to24Hour(end)}:00`,
    };
  };

  const meetingsOnSelectedDate = date
    ? existingMeetings.filter((m) => isSameDay(new Date(m.start_time), new Date(`${date}T00:00:00`)))
    : [];

  const handleSave = async (asDraft = false) => {
    if (!title || !date) return;
    setSaving(true);
    try {
      const { start_time, end_time } = buildTimestamps();
      await createMeeting({
        title,
        location: location || null,
        start_time,
        end_time,
        priority,
        departments,
        cluster_heads: clusterHeads.map((h) => h.id),
        status: asDraft ? 'Draft' : 'Scheduled',
      });
      onCreated && onCreated();
      onClose();
    } catch (err) {
      alert('Failed to create meeting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <h2 className="modal-title">Schedule New Meeting</h2>
        <p className="modal-subtitle">Create a new cluster head coordination session</p>

        {date && (
          <div className="availability-banner" style={{ alignItems: 'flex-start' }}>
            <span className="availability-icon">🕒</span>
            <div style={{ flex: 1 }}>
              <strong>
                {meetingsOnSelectedDate.length === 0
                  ? 'No meetings scheduled on this date'
                  : `${meetingsOnSelectedDate.length} meeting${meetingsOnSelectedDate.length > 1 ? 's' : ''} already scheduled on this date`}
              </strong>
              {meetingsOnSelectedDate.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {meetingsOnSelectedDate.map((m) => (
                    <p key={m.id} style={{ margin: 0, fontSize: 12, color: '#4b5563' }}>
                      {new Date(m.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {new Date(m.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {'  ·  '}{m.title}
                      {m.location ? `  ·  ${m.location}` : ''}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="modal-grid">
          <div className="modal-col-main">
            <p className="modal-section-label">📄 MEETING DETAILS</p>

            <label className="field-label">Meeting Title</label>
            <input
              className="field-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Quarterly Budget Review"
            />

            <div className="field-row">
              <div>
                <label className="field-label">Date</label>
                <input type="date" className="field-input" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="field-label">Time Slot</label>
                <select className="field-input" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}>
                  {TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                </select>
              </div>
            </div>

            <label className="field-label">Location</label>
            <input
              className="field-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Microsoft Teams Link or Conference Room 3"
            />

            <p className="modal-section-label" style={{ marginTop: 20 }}>👥 PARTICIPANTS & DEPARTMENTS</p>

            <label className="field-label">Target Departments</label>
            <div className="chip-row">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  className={`chip-toggle ${departments.includes(dept) ? 'is-active' : ''}`}
                  onClick={() => toggleDept(dept)}
                >
                  {dept}
                </button>
              ))}
              <button type="button" className="chip-toggle chip-toggle--add">+ Add</button>
            </div>

            <label className="field-label">Select Cluster Heads</label>
            <div className="tag-input">
              {clusterHeads.map((h) => (
                <span key={h.id} className="tag-pill">
                  {h.name}
                  <button type="button" onClick={() => removeHead(h.id)}>×</button>
                </span>
              ))}
              <input
                className="tag-input-field"
                value={headSearch}
                onChange={(e) => setHeadSearch(e.target.value)}
                placeholder="Search leads…"
              />
            </div>
          </div>

          <div className="modal-col-side">
            <p className="modal-section-label">MEETING PRIORITY</p>
            <div className="priority-list">
              {PRIORITIES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className={`priority-card ${priority === p.key ? 'is-active' : ''}`}
                  onClick={() => setPriority(p.key)}
                >
                  <span className="priority-radio" />
                  <span>
                    <span className={`priority-label priority-dot--${p.dot}`}>{p.label}</span>
                    {p.note && <span className="priority-note">{p.note}</span>}
                  </span>
                </button>
              ))}
            </div>

            <div className="admin-protip">
              <strong>💡 Admin Pro-tip</strong>
              <p>High-priority meetings automatically trigger SMS notifications to attendees 15 minutes prior. Ensure all cluster heads have updated contact details.</p>
            </div>

            <button className="btn btn--primary btn--block" onClick={() => handleSave(false)} disabled={saving}>
              {saving ? 'Saving…' : '✓ Schedule Meeting'}
            </button>
            <button className="btn btn--outline btn--block" onClick={() => handleSave(true)} disabled={saving}>
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewMeetingModal;