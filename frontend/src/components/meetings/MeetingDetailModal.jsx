import React from 'react';

const MeetingDetailModal = ({ open, meeting, onClose }) => {
  if (!open || !meeting) return null;

  const start = new Date(meeting.start_time);
  const end = new Date(meeting.end_time);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <h2 className="modal-title">{meeting.title}</h2>

        <div className="detail-modal-meta">
          <span className="category-chip">
            {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="category-chip">
            {start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            {' – '}
            {end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {meeting.location && (
          <p className="timeline-note" style={{ marginTop: 16 }}>
            📍 {meeting.location}
          </p>
        )}

        {meeting.status && (
          <p className="admin-recent-item-meta" style={{ marginTop: 8 }}>
            Status: {meeting.status}
          </p>
        )}

        <div className="modal-footer">
          <button className="btn btn--primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetailModal;