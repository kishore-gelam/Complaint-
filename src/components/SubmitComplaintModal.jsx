import React, { useState } from 'react';

const CATEGORY_OPTIONS = ['Hr', 'IT Department', 'Operations', 'Infrastructure', 'Loans', 'Personal'];
const URGENCY_OPTIONS = ['Low', 'Medium', 'High'];

const SubmitComplaintModal = ({ open, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [urgency, setUrgency] = useState('Medium');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);

  if (!open) return null;

  const handleFiles = (e) => {
    setFiles(Array.from(e.target.files || []));
  };

  const handleSubmit = () => {
    onSubmit && onSubmit({ title, category, urgency, description, files });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

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
        {files.length > 0 && (
          <ul className="dropzone-file-list">
            {files.map((f) => <li key={f.name}>{f.name}</li>)}
          </ul>
        )}

        <div className="modal-footer">
          <button className="btn btn--text" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit}>Submit Complaint</button>
        </div>
      </div>
    </div>
  );
};

export default SubmitComplaintModal;