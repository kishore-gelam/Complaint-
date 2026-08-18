import React, { useState, useEffect } from 'react';
import { updateComplaintStatus, getAttachments, getComplaintEvents } from '../api/complaints';

const AdminResolutionModal = ({ open, complaint, onClose, onUpdated }) => {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (open && complaint?.dbId) {
      getAttachments(complaint.dbId).then(setAttachments).catch(() => setAttachments([]));
      getComplaintEvents(complaint.dbId).then(setEvents).catch(() => setEvents([]));
    }
  }, [open, complaint]);

  if (!open || !complaint) return null;

  const isPersonal = complaint.category === 'Personal';

  // Display-only roadmap — Admin always resolves directly, this is just
  // for context on what already happened before it reached Admin.
  const stageOrder = isPersonal
    ? ['Submitted', 'Admin Review']
    : ['Submitted', 'Facility Head Inspection', 'Admin Review'];
  const currentIndex = stageOrder.indexOf(complaint.current_stage || 'Submitted');

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Admin always resolves directly — no Super Admin / Final
      // Verification step in this flow.
      await updateComplaintStatus(complaint.dbId, 'Resolved', comment);
      onUpdated && onUpdated();
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const eventByTitle = Object.fromEntries(events.map((e) => [e.title, e]));

  const formatTime = (event) =>
    event
      ? new Date(event.created_at).toLocaleString('en-US', {
          hour: '2-digit', minute: '2-digit', month: 'short', day: '2-digit',
        })
      : null;

    const roadmap = stageOrder.map((label, index) => {
    const ev = eventByTitle[label];
    const isResolved = complaint.status === 'Resolved';
    const isDone = isResolved || index < currentIndex;
    const isCurrent = !isResolved && index === currentIndex;
    return {
      label,
      done: isDone,
      current: isCurrent,
      time: formatTime(ev) || (isDone ? 'Completed' : isCurrent ? 'In progress' : 'Pending'),
      note: ev?.note,
    };
  });

  const renderEvidence = (list) => (
    <div className="evidence-thumbs">
      {list.map((a) => {
        const rawName = decodeURIComponent(a.file_url.split('/').pop());
        const displayName = rawName.split('_').slice(2).join('_') || rawName;
        return (
          <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer" className="evidence-thumb-card">
            <div className="evidence-thumb">
              <img src={a.file_url} alt={displayName} />
            </div>
            <span className="evidence-thumb-caption">{displayName}</span>
          </a>
        );
      })}
    </div>
  );

  const originalPhotos = attachments.filter((a) => a.stage === 'Submitted');
  const alreadyResolved = complaint.status === 'Resolved';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal resolution-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <h2 className="modal-title">Complaint #{complaint.id}</h2>
        <div className="detail-modal-meta">
          <span className="category-chip">{complaint.category}</span>
          <span className="category-chip">Submitted: {complaint.date}</span>
        </div>

        <div className="resolution-grid">
          <div className="resolution-column">
            <div className="resolution-panel">
              <div className="resolution-panel-header">
                <h3 className="detail-section-title" style={{ margin: 0 }}>Original Complaint</h3>
                <span className="resolution-submitter">
                  {complaint.submitter_name || 'Employee'}
                </span>
              </div>
              <p className="timeline-note">{complaint.subject}</p>
              <p className="detail-description">{complaint.description}</p>

              {originalPhotos.length > 0 && renderEvidence(originalPhotos)}
            </div>

            <div className="resolution-panel">
              <h3 className="detail-section-title" style={{ marginTop: 0 }}>Resolution Roadmap</h3>
              <div className="timeline">
                {roadmap.map((stage) => {
                  const stagePhotos = attachments.filter((a) => a.stage === stage.label);
                  return (
                    <div className="timeline-step" key={stage.label}>
                      <span className={`timeline-dot ${stage.done ? 'is-done' : stage.current ? 'is-current' : ''}`} />
                      <div className="timeline-content">
                        <p className="timeline-title">{stage.label}</p>
                        <p className="timeline-time">{stage.time}</p>
                        {stage.note && <p className="timeline-note">{stage.note}</p>}
                        {stagePhotos.length > 0 && renderEvidence(stagePhotos)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="resolution-panel">
            <h3 className="detail-section-title" style={{ marginTop: 0 }}>Resolution Workspace</h3>

            <label className="detail-section-title" style={{ fontSize: '0.8rem' }}>
              Admin Comments &amp; Actions Taken
            </label>
            <textarea
              className="resolution-textarea"
              rows={7}
              placeholder="Describe the review outcome, decision, and next steps…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={alreadyResolved}
            />

            <div className="modal-footer">
              <button className="btn btn--outline" onClick={onClose}>Cancel</button>
              <button className="btn btn--primary" onClick={handleSubmit} disabled={submitting || alreadyResolved}>
                {alreadyResolved ? 'Already Resolved' : submitting ? 'Resolving…' : 'Mark as Resolved'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminResolutionModal;