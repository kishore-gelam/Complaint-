import React, { useState, useEffect } from 'react';
import { advanceStage, uploadAttachment, getAttachments, getComplaintEvents } from '../api/complaints';

const ComplaintResolutionModal = ({ open, complaint, onClose, onUpdated }) => {
  const [comment, setComment] = useState('');
  const [file, setFile] = useState(null);
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

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      alert('Please add your comments before submitting.');
      return;
    }
    if (!file) {
      alert('Please upload a resolution photo before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      await uploadAttachment(complaint.dbId, file, 'Facility Head Inspection');
      await advanceStage(complaint.dbId, comment);
      onUpdated && onUpdated();
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const stageOrder = ['Submitted', 'Facility Head Inspection', 'Admin Review', 'Final Verification'];
  const currentIndex = stageOrder.indexOf(complaint.current_stage || 'Submitted');
  const eventByTitle = Object.fromEntries(events.map((e) => [e.title, e]));

  const formatTime = (event) =>
    event
      ? new Date(event.created_at).toLocaleString('en-US', {
          hour: '2-digit', minute: '2-digit', month: 'short', day: '2-digit',
        })
      : null;

  const isResolved = complaint.status === 'Resolved';

  const roadmap = stageOrder.map((label, index) => {
    const ev = eventByTitle[label];
    return {
      label: label === 'Final Verification' ? 'Final Verification' : label,
      done: isResolved || index < currentIndex,
      current: !isResolved && index === currentIndex,
      time: formatTime(ev) || (isResolved ? 'Completed' : index === currentIndex ? 'In progress' : index < currentIndex ? 'Completed' : 'Pending'),
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
  const canAct = !isResolved && complaint.current_stage === 'Submitted';

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

            {!canAct ? (
              <p className="timeline-note">
                {isResolved
                  ? 'This complaint has already been resolved.'
                  : 'This complaint is not currently awaiting Facility Head action.'}
              </p>
            ) : (
              <>
                <label className="detail-section-title" style={{ fontSize: '0.8rem' }}>
                  Facility Head Comments &amp; Actions Taken <span style={{ color: '#c0562e' }}>*</span>
                </label>
                <textarea
                  className="resolution-textarea"
                  rows={5}
                  placeholder="Describe the resolution steps taken, parts replaced, and personnel involved…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />

                <label className="detail-section-title" style={{ fontSize: '0.8rem' }}>
                  Upload Resolution Photo (Proof of Work) <span style={{ color: '#c0562e' }}>*</span>
                </label>
                <div className="upload-dropzone">
                  <input type="file" accept="image/*" onChange={handleFileChange} />
                  {file && <p className="timeline-note">{file.name}</p>}
                </div>

                <div className="modal-footer">
                  <button className="btn btn--outline" onClick={onClose}>Cancel</button>
                  <button className="btn btn--primary" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit for Admin Verification'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintResolutionModal;