import React, { useRef, useEffect, useState } from 'react';

const CameraCaptureModal = ({ open, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) return;

    setError('');
    setReady(false);

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      })
      .catch(() => {
        setError('Could not access camera. Please check browser permissions.');
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [open]);

  if (!open) return null;

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
      handleClose();
    }, 'image/jpeg', 0.9);
  };

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal camera-capture-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose} aria-label="Close">×</button>
        <h2 className="modal-title">Take Photo</h2>

        {error ? (
          <p className="table-empty-state">{error}</p>
        ) : (
          <>
            <div className="camera-preview-wrap">
              <video ref={videoRef} autoPlay playsInline muted className="camera-preview-video" />
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div className="modal-footer">
              <button className="btn btn--outline" onClick={handleClose}>Cancel</button>
              <button className="btn btn--primary" onClick={handleCapture} disabled={!ready}>
                📷 Capture
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraCaptureModal;