import React, { useEffect, useState } from 'react';
import { getComplaintEvents, getAttachments } from '../api/complaints';

const CATEGORY_TO_HEAD_ROLE = {
  Infrastructure: 'Infrastructure Head',
  Operations: 'Operations Head',
  Loans: 'Loans Head',
  'IT Department': 'IT Head',
  Hr: 'Hr Head',
};

const DeptHeadActionModal = ({ open, complaint, onClose }) => {
  const [events, setEvents] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

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
  }, [open, complaint]);

  if (!open || !complaint) return null;

  const headRoleLabel = CATEGORY_TO_HEAD_ROLE[complaint.category] || 'Department Head';
  const inspectionEvent = events.find((e) => e.title === 'Facility Head Inspection');
  const evidencePhotos = attachments.filter((a) => a.stage === 'Facility Head Inspection');

  const hasCompleted = !!inspectionEvent;
  const stageIndex = ['Submitted', 'Facility Head Inspection', 'Admin Review', 'Final Verification'].indexOf(
    complaint.current_stage || 'Submitted'
  );
  const isPending = stageIndex <= 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal dept-action-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <h2 className="modal-title" style={{ marginBottom: 2 }}>Review {headRoleLabel} Action</h2>
        <p className="modal-subtitle" style={{ marginTop: 0 }}>
          Case #{complaint.id} · {complaint.category}
        </p>

        {loading && <p className="timeline-note">Loading…</p>}

        {!loading && (
          <>
            <h3 className="detail-section-title" style={{ marginTop: 16 }}>Department Authority</h3>
            <p className="timeline-note">
              This category routes to the <strong>{headRoleLabel}</strong>.
            </p>

            <h3 className="detail-section-title">Action Description</h3>
            {isPending && (
              <p className="table-empty-state">Awaiting {headRoleLabel} action — not yet submitted.</p>
            )}
            {!isPending && !hasCompleted && (
              <p className="table-empty-state">No inspection notes recorded for this complaint.</p>
            )}
            {hasCompleted && (
              <p className="detail-description" style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 14px' }}>
                {inspectionEvent.note || 'No comments were provided.'}
              </p>
            )}

            {evidencePhotos.length > 0 && (
              <>
                <h3 className="detail-section-title">Resolution Evidence</h3>
                <div className="evidence-thumbs">
                  {evidencePhotos.map((a) => {
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
              </>
            )}
          </>
        )}

        <div className="modal-footer">
          <button className="btn btn--primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default DeptHeadActionModal;