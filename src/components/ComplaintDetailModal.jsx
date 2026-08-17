import React, { useEffect, useState } from 'react';
import { getComplaintEvents, getAttachments, advanceStage } from '../api/complaints';

const CATEGORY_TO_HEAD_ROLE = {
  Infrastructure: 'Infrastructure Head',
  Operations: 'Operations Head',
  Loans: 'Loans Head',
  'IT Department': 'IT Head',
  Hr: 'Hr Head',
};

const ComplaintDetailModal = ({ open, complaint, onClose, userRole, onUpdated }) => {
  const [events, setEvents] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (open && complaint?.dbId) {
      setLoading(true);
      Promise.all([
        getComplaintEvents(complaint.dbId).catch(() => []),
        getAttachments(complaint.dbId).catch(() => []),
      ])
        .then(([eventsData, attachmentsData]) => {
          setEvents(eventsData);
          setAttachments(attachmentsData);
        })
        .finally(() => setLoading(false));
    }
    if (open) {
      setComment('');
    }
  }, [open, complaint]);

  if (!open || !complaint) return null;

  const isResolved = complaint.status === 'Resolved';

  const eventByTitle = Object.fromEntries(events.map((e) => [e.title, e]));

  const formatTime = (event) =>
    event
      ? new Date(event.created_at).toLocaleString('en-US', {
          hour: '2-digit', minute: '2-digit', month: 'short', day: '2-digit',
        })
      : null;

  const stageOrder = complaint.category === 'Personal'
    ? ['Submitted', 'Admin Review', 'Final Verification']
    : ['Submitted', 'Facility Head Inspection', 'Admin Review', 'Final Verification'];
  const currentIndex = stageOrder.indexOf(complaint.current_stage || 'Submitted');

  const headRoleLabel = CATEGORY_TO_HEAD_ROLE[complaint.category] || 'Facility Head';

  const STAGE_PERMISSIONS = {
    'Facility Head Inspection': [CATEGORY_TO_HEAD_ROLE[complaint.category]].filter(Boolean),
    'Admin Review': ['Admin', 'HR'],
    'Final Verification': ['Super Admin'],
  };

  const stages = stageOrder.map((label, index) => {
    const stageEvent = eventByTitle[label];
    const displayLabel =
      label === 'Final Verification'
        ? 'Final Verification - Super Admin'
        : label === 'Facility Head Inspection'
          ? `${headRoleLabel} Inspection`
          : label;
    return {
      label: displayLabel,
      state: isResolved
        ? 'is-done'
        : index < currentIndex ? 'is-done' : index === currentIndex ? 'is-current' : '',
      time: formatTime(stageEvent) || (
        isResolved ? 'Completed'
        : index === currentIndex ? 'In progress'
        : index < currentIndex ? 'Completed' : 'Pending'
      ),
      note: stageEvent?.note,
    };
  });

  const nextStage = stageOrder[currentIndex + 1];
  const canAdvance = !isResolved && nextStage && STAGE_PERMISSIONS[nextStage]?.includes(userRole);

  const handleAdvance = async () => {
    if (!comment.trim()) {
      alert('Please add your comments before submitting.');
      return;
    }
    setAdvancing(true);
    try {
      await advanceStage(complaint.dbId, comment);
      onUpdated && onUpdated();
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to update stage');
    } finally {
      setAdvancing(false);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const resolvedNote = eventByTitle['Resolved']?.note;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <div className="detail-modal-badges">
          <span className="ref-link">#{complaint.id}</span>
          <span className="status-pill status--review">
            {(isResolved ? 'RESOLVED' : complaint.current_stage || 'Submitted').toUpperCase()}
          </span>
        </div>

        <h2 className="modal-title">{complaint.subject}</h2>

        <div className="detail-modal-meta">
          <span className="category-chip">Category: {complaint.category}</span>
          <span className="category-chip">Submitted: {complaint.date}</span>
        </div>

        <h3 className="detail-section-title">Progress Timeline</h3>

        {loading && <p className="timeline-note">Loading timeline…</p>}

        {!loading && (
          <div className="timeline">
            {stages.map((stage) => {
              const stagePhotos = attachments.filter((a) => a.stage === stage.label);
              return (
                <div className="timeline-step" key={stage.label}>
                  <span className={`timeline-dot ${stage.state}`} />
                  <div className="timeline-content">
                    <p className="timeline-title">{stage.label}</p>
                    <p className="timeline-time">{stage.time}</p>
                    {stage.note && <p className="timeline-note">{stage.note}</p>}

                    {stagePhotos.length > 0 && (
                      <div className="evidence-thumbs">
                        {stagePhotos.map((a) => {
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
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {canAdvance && (
          <>
            <label className="detail-section-title" style={{ fontSize: '0.8rem' }}>
              Comments &amp; Actions Taken <span style={{ color: '#c0562e' }}>*</span>
            </label>
            <textarea
              className="resolution-textarea"
              rows={4}
              placeholder="Describe the review outcome, decision, and next steps…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button className="btn btn--primary" onClick={handleAdvance} disabled={advancing}>
              {advancing ? 'Updating…' : `Complete "${nextStage}"`}
            </button>
          </>
        )}

        {isResolved && resolvedNote && (
          <>
            <h3 className="detail-section-title">Resolution Notes</h3>
            <p className="timeline-note">{resolvedNote}</p>
          </>
        )}

        <h3 className="detail-section-title">Description</h3>
        <p className="detail-description">
          {complaint.description || 'No additional description was provided for this complaint.'}
        </p>

        <div className="modal-footer">
          <button className="btn btn--outline detail-download-btn" onClick={handleDownloadPDF}>
            <i className="fa-solid fa-download"></i> Download PDF
          </button>
          <button className="btn btn--primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetailModal;