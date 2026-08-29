import React from 'react';

const MeetingEventDetailModal = ({ open, meeting, relatedComplaint, onClose }) => {
  if (!open || !meeting) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card-detail-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="card-detail-header">
          <div>
            <h2 className="card-detail-title">{meeting.title}</h2>
            <p className="card-detail-subtitle">
              {new Date(meeting.start_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div style={{ padding: '20px 28px' }}>
          <div className="card-detail-card">
            <div className="card-detail-meta-row">
              <i className="fa-regular fa-clock"></i>
              <div>
                <span className="card-detail-meta-label">Time</span>
                <span className="card-detail-meta-value">
                  {new Date(meeting.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  {' – '}
                  {new Date(meeting.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="card-detail-meta-row">
              <i className="fa-solid fa-location-dot"></i>
              <div>
                <span className="card-detail-meta-label">Meeting Room</span>
                <span className="card-detail-meta-value">{meeting.location || 'Not specified'}</span>
              </div>
            </div>

            <div className="card-detail-meta-row">
              <i className="fa-solid fa-flag"></i>
              <div>
                <span className="card-detail-meta-label">Status</span>
                <span className="card-detail-meta-value">{meeting.status}</span>
              </div>
            </div>

            {relatedComplaint && (
              <>
                <div className="card-detail-meta-row">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <div>
                    <span className="card-detail-meta-label">Related Issue</span>
                    <span className="card-detail-meta-value">
                      {relatedComplaint.reference_id} — {relatedComplaint.title}
                    </span>
                  </div>
                </div>
                <div className="card-detail-meta-row">
                  <i className="fa-solid fa-user"></i>
                  <div>
                    <span className="card-detail-meta-label">Raised By</span>
                    <span className="card-detail-meta-value">{relatedComplaint.submitter_name || 'Unknown'}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {(meeting.join_url || meeting.briefing_url) && (
            <div className="agenda-actions" style={{ marginTop: 16 }}>
              {meeting.join_url && (
                <a className="btn btn--primary btn--sm" href={meeting.join_url} target="_blank" rel="noreferrer">
                  Join Session
                </a>
              )}
              {meeting.briefing_url && (
                <a className="btn btn--secondary btn--sm" href={meeting.briefing_url} target="_blank" rel="noreferrer">
                  Briefing Docs
                </a>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn--primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default MeetingEventDetailModal;