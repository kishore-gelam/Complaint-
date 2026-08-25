import React, { useState } from 'react';
import CameraCaptureModal from './CameraCaptureModal';

const CATEGORY_OPTIONS = ['Hr', 'IT Department', 'Operations', 'Infrastructure', 'Loans', 'Personal'];
const URGENCY_OPTIONS = ['Low', 'Medium', 'High'];

const SubmitComplaintModal = ({ open, onClose, onSubmit }) => {
  const [step, setStep] = useState('form'); // 'form' | 'preview'
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [urgency, setUrgency] = useState('Medium');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [formError, setFormError] = useState('');

  if (!open) return null;

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReviewClick = () => {
    if (!title.trim()) {
      setFormError('Please enter an issue title.');
      return;
    }
    if (!category) {
      setFormError('Please select a category.');
      return;
    }
    if (!description.trim()) {
      setFormError('Please provide a detailed description.');
      return;
    }
    setFormError('');
    setStep('preview');
  };

  const handleConfirmSubmit = () => {
    onSubmit && onSubmit({ title, category, urgency, description, files });
  };

  const handleClose = () => {
    setStep('form');
    setFormError('');
    onClose && onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose} aria-label="Close">×</button>

        {step === 'form' && (
          <>
            <h2 className="modal-title">Submit New Complaint</h2>
            <p className="modal-subtitle">
              Please provide detailed information regarding your issue. All submissions are
              handled with strict confidentiality.
            </p>

            <label className="field-label">Issue Title</label>
            <input
              type="text"
              className="field-input"
              placeholder="e.g., Harassment incident in Department B"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="field-row">
              <div className="field-col">
                <label className="field-label">Category</label>
                <select
                  className="field-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select Category</option>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="field-col">
                <label className="field-label">Urgency Level</label>
                <div className="urgency-toggle">
                  {URGENCY_OPTIONS.map((u) => (
                    <button
                      key={u}
                      type="button"
                      className={`urgency-option ${urgency === u ? 'is-active' : ''}`}
                      onClick={() => setUrgency(u)}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label className="field-label">Detailed Description</label>
            <textarea
              className="field-input field-textarea"
              placeholder="Please describe the incident in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <label className="field-label">Evidence &amp; Attachments</label>
            <label className="dropzone">
              <span className="dropzone-icon">☁</span>
              <span className="dropzone-text">Click or drag files to upload</span>
              <span className="dropzone-hint">PNG, JPG or PDF (Max 10MB per file)</span>
              <input type="file" multiple hidden onChange={handleFiles} />
            </label>

            <button type="button" className="dropzone-camera-btn" onClick={() => setCameraOpen(true)}>
              <span>📷</span> Take Photo
            </button>

            {files.length > 0 && (
              <ul className="dropzone-file-list">
                {files.map((f, i) => (
                  <li key={i}>
                    {f.name}{' '}
                    <button type="button" className="btn--text" style={{ padding: '0 4px' }} onClick={() => removeFile(i)}>
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {formError && <p className="login-error" style={{ marginTop: 12 }}>{formError}</p>}

            <div className="modal-footer">
              <button className="btn btn--text" onClick={handleClose}>Cancel</button>
              <button className="btn btn--primary" onClick={handleReviewClick}>Review &amp; Submit</button>
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            <h2 className="modal-title">Review Your Complaint</h2>

            <div className="availability-banner" style={{ background: '#fef2f2', alignItems: 'flex-start' }}>
              <span className="availability-icon">⚠️</span>
              <div>
                <strong style={{ color: '#b91c1c' }}>Please review carefully before submitting</strong>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#7f1d1d' }}>
                  Once submitted, this complaint cannot be edited or withdrawn. Make sure all
                  details below are accurate.
                </p>
              </div>
            </div>

            <div className="resolution-panel" style={{ marginTop: 16 }}>
              <div className="card-detail-meta-row">
                <i className="fa-solid fa-heading"></i>
                <div>
                  <span className="card-detail-meta-label">Issue Title</span>
                  <span className="card-detail-meta-value">{title}</span>
                </div>
              </div>
              <div className="card-detail-meta-row">
                <i className="fa-solid fa-building"></i>
                <div>
                  <span className="card-detail-meta-label">Category</span>
                  <span className="card-detail-meta-value">{category}</span>
                </div>
              </div>
              <div className="card-detail-meta-row">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <div>
                  <span className="card-detail-meta-label">Urgency Level</span>
                  <span className="card-detail-meta-value">{urgency}</span>
                </div>
              </div>
              <div className="card-detail-meta-row">
                <i className="fa-solid fa-align-left"></i>
                <div>
                  <span className="card-detail-meta-label">Description</span>
                  <span className="card-detail-meta-value" style={{ fontWeight: 400 }}>{description}</span>
                </div>
              </div>
              <div className="card-detail-meta-row">
                <i className="fa-solid fa-paperclip"></i>
                <div>
                  <span className="card-detail-meta-label">Attachments</span>
                  <span className="card-detail-meta-value" style={{ fontWeight: 400 }}>
                    {files.length > 0 ? `${files.length} file(s) attached` : 'No files attached'}
                  </span>
                </div>
              </div>
            </div>

                        {files.length > 0 && (
              <div className="card-detail-evidence-grid" style={{ marginTop: 12 }}>
                {files.map((f, i) => (
                  <div key={i} className="card-detail-evidence-item">
                    {f.type && f.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(f)} alt={f.name} />
                    ) : (
                      <div className="evidence-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                        📄
                      </div>
                    )}
                    <span>{f.name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn--outline" onClick={() => setStep('form')}>Edit</button>
              <button className="btn btn--primary" onClick={handleConfirmSubmit}>Confirm &amp; Submit</button>
            </div>
          </>
        )}
      </div>

      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => setFiles((prev) => [...prev, file])}
      />
    </div>
  );
};

export default SubmitComplaintModal;