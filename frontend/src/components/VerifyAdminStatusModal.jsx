import React, { useEffect, useState } from 'react';
import { getComplaintEvents, getAttachments } from '../api/complaints';

const VerifyAdminStatusModal = ({ open, complaint, onClose }) => {
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

  const adminEvent = events.find((e) => e.title === 'Admin Review');
  const stageIndex = ['Submitted', 'Facility Head Inspection', 'Admin Review', 'Final Verification'].indexOf(
    complaint.current_stage || 'Submitted'
  );
  const adminStageIndex = ['Submitted', 'Facility Head Inspection', 'Admin Review', 'Final Verification'].indexOf('Admin Review');
  const isPending = stageIndex < adminStageIndex;
  const hasCompleted = !!adminEvent;

  const initialEvidence = attachments.filter((a) => a.stage === 'Submitted');
  const deptResolutionEvidence = attachments.filter((a) => a.stage === 'Facility Head Inspection');

  const renderEvidenceGrid = (list) => (
    <div className="card-detail-evidence-grid">
      {list.map((a) => {
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
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-detail-header">
          <div>
            <h2 className="card-detail-title">Verify Admin Status Update</h2>
            <p className="card-detail-subtitle">Case #{complaint.id}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="card-detail-grid">
          <div className="card-detail-main">
            <div className="card-detail-card">
              <div className="card-detail-card-header">
                <span className="card-detail-card-title">Admin Action Summary</span>
              </div>

              {loading && <p className="timeline-note">Loading…</p>}

              {!loading && isPending && (
                <p className="table-empty-state">Awaiting Admin Review — not yet reached this stage.</p>
              )}
              {!loading && !isPending && !hasCompleted && (
                <p className="table-empty-state">No Admin Review notes recorded yet.</p>
              )}
              {!loading && hasCompleted && (
                <>
                  <p className="card-detail-meta-value" style={{ marginBottom: 6 }}>
                    Status: {complaint.status === 'Resolved' ? 'Resolved' : complaint.current_stage}
                  </p>
                  <div className="card-detail-content">
                    {adminEvent.note || 'No comments were provided.'}
                  </div>
                </>
              )}
            </div>

            {deptResolutionEvidence.length > 0 && (
              <div className="card-detail-card">
                <div className="card-detail-card-header">
                  <span className="card-detail-card-title">Resolution Evidence Verification</span>
                </div>
                <p className="card-detail-evidence-label" style={{ marginTop: 0 }}>Initial Evidence (Employee)</p>
                {initialEvidence.length > 0 ? renderEvidenceGrid(initialEvidence) : <p className="timeline-note">No initial evidence uploaded.</p>}

                <p className="card-detail-evidence-label">Resolution Proof (Dept Head)</p>
                {renderEvidenceGrid(deptResolutionEvidence)}
              </div>
            )}
          </div>

          <div className="card-detail-side">
            <div className="card-detail-card">
              <div className="card-detail-card-header">
                <span className="card-detail-card-title">Case Activity</span>
              </div>
              <div className="card-detail-status-list">
                {events.map((e) => (
                  <div className="card-detail-status-item" key={e.id}>
                    <span className="card-detail-status-dot is-done" />
                    <div>
                      <p className="card-detail-status-title">{e.title}</p>
                      <p className="card-detail-status-time">
                        {new Date(e.created_at).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyAdminStatusModal;