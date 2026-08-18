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

  const formatDateTime = (value) =>
    value
      ? new Date(value).toLocaleString('en-US', {
          hour: '2-digit', minute: '2-digit', month: 'short', day: '2-digit', year: 'numeric',
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
      done: isResolved || index < currentIndex,
      current: !isResolved && index === currentIndex,
      time: formatDateTime(stageEvent?.created_at) || (
        isResolved ? 'Completed'
        : index === currentIndex ? 'In progress'
        : index < currentIndex ? 'Completed' : 'Pending'
      ),
      note: stageEvent?.note,
    };
  });

  const nextStage = stageOrder[currentIndex + 1];
  const canAdvance = !isResolved && nextStage && !['Super Admin', 'Admin'].includes(userRole) && STAGE_PERMISSIONS[nextStage]?.includes(userRole);

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

  const submissionAttachments = attachments.filter((a) => a.stage === 'Submitted');
  const priorityLabel = (complaint.urgency || '').toUpperCase();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-detail-header">
          <div>
            <h2 className="card-detail-title">
              {complaint.category} Dept — Complaint Review
              {priorityLabel === 'HIGH' && <span className="card-detail-critical-badge">CRITICAL</span>}
            </h2>
            <p className="card-detail-subtitle">Reference Case ID: #{complaint.id}</p>
          </div>
          <div className="card-detail-header-actions">
            <button className="btn btn--outline" onClick={handleDownloadPDF}>
              <i className="fa-solid fa-download"></i> Download PDF
            </button>
            <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
          </div>
        </div>

        <div className="card-detail-grid">
          <div className="card-detail-main">
            <div className="card-detail-card">
              <div className="card-detail-card-header">
                <span className="card-detail-card-title">Complaint Details</span>
                <span className="admin-recent-item-meta">{complaint.submitter_name || 'Employee'}</span>
              </div>

              <div className="card-detail-content">
                <h3 className="card-detail-issue-title">{complaint.subject}</h3>
                <p className="detail-description">
                  {complaint.description || 'No additional description was provided for this complaint.'}
                </p>
              </div>

              {submissionAttachments.length > 0 && (
                <>
                  <p className="card-detail-evidence-label">Submitted Evidence ({submissionAttachments.length} files)</p>
                  <div className="card-detail-evidence-grid">
                    {submissionAttachments.map((a) => {
                      const rawName = decodeURIComponent(a.file_url.split('/').pop());
                      const displayName = rawName.split('_').slice(2).join('_') || rawName;
                      return (
                        <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer" className="card-detail-evidence-item">
                          <img src={a.file_url} alt={displayName} />
                          <span>{displayName}</span>
                        </a>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {canAdvance && (
              <div className="card-detail-card">
                <div className="card-detail-card-header">
                  <span className="card-detail-card-title">Take Action</span>
                </div>
                <label className="detail-section-title" style={{ fontSize: '0.8rem', marginTop: 0 }}>
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
              </div>
            )}
          </div>

          <div className="card-detail-side">
            <div className="card-detail-card">
              <div className="card-detail-card-header">
                <span className="card-detail-card-title">Submission Metadata</span>
              </div>
              <div className="card-detail-meta-row">
                <i className="fa-regular fa-calendar"></i>
                <div>
                  <span className="card-detail-meta-label">Submitted</span>
                  <span className="card-detail-meta-value">{complaint.date}</span>
                </div>
              </div>
              <div className="card-detail-meta-row">
                <i className="fa-solid fa-building"></i>
                <div>
                  <span className="card-detail-meta-label">Category</span>
                  <span className="card-detail-meta-value">{complaint.category}</span>
                </div>
              </div>
              <div className="card-detail-meta-row">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <div>
                  <span className="card-detail-meta-label">Priority</span>
                  <span className="card-detail-meta-value">{complaint.urgency || 'Medium'}</span>
                </div>
              </div>
              <div className="card-detail-meta-row">
                <i className="fa-solid fa-flag"></i>
                <div>
                  <span className="card-detail-meta-label">Current Status</span>
                  <span className="card-detail-meta-value">
                    {isResolved ? 'Resolved' : complaint.current_stage || 'Submitted'}
                  </span>
                </div>
              </div>
            </div>

            <div className="card-detail-card">
              <div className="card-detail-card-header">
                <span className="card-detail-card-title">Governance Status</span>
              </div>
              {loading && <p className="timeline-note">Loading…</p>}
              {!loading && (
                <div className="card-detail-status-list">
                  {stages.map((stage, idx) => {
                    const rawStageLabel = stageOrder[idx];
                    const stagePhotos = rawStageLabel === 'Submitted'
                      ? []
                      : attachments.filter((a) => a.stage === rawStageLabel);
                    return (
                      <div className="card-detail-status-item" key={stage.label}>
                        <span className={`card-detail-status-dot ${stage.done ? 'is-done' : stage.current ? 'is-current' : ''}`} />
                        <div>
                          <p className="card-detail-status-title">{stage.label}</p>
                          <p className="card-detail-status-time">{stage.time}</p>
                          {stage.note && <p className="timeline-note">{stage.note}</p>}
                          {stagePhotos.length > 0 && (
                            <div className="card-detail-evidence-grid" style={{ marginTop: 8 }}>
                              {stagePhotos.map((a) => {
                                const rawName = decodeURIComponent(a.file_url.split('/').pop());
                                const displayName = rawName.split('_').slice(2).join('_') || rawName;
                                return (
                                  <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer" className="card-detail-evidence-item">
                                    <img src={a.file_url} alt={displayName} />
                                    <span>{displayName}</span>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetailModal;