import React from 'react';

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

const AgendaDetailModal = ({ open, agenda, onClose }) => {
  if (!open) return null;

  const now = new Date();
  const today = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const nextSession = agenda.find((m) => new Date(m.end_time) >= now);
  const highPriorityCount = agenda.filter((m) => m.status === 'Tentative').length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-detail-header">
          <div>
            <h2 className="card-detail-title">Daily Agenda Details</h2>
            <p className="card-detail-subtitle">{today}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div style={{ padding: '20px 28px 0' }}>
          <div className="chairman-stats-row">
            <div className="admin-stat-card">
              <span className="admin-stat-label">Next Session</span>
              <span className="admin-stat-value" style={{ fontSize: 18 }}>
                {nextSession
                  ? new Date(nextSession.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Tentative Sessions</span>
              <span className="admin-stat-value" style={{ fontSize: 18 }}>{highPriorityCount}</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Total Sessions</span>
              <span className="admin-stat-value" style={{ fontSize: 18 }}>{agenda.length}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 28px' }}>
          <p className="card-detail-card-title" style={{ marginBottom: 12 }}>Scheduled Sessions</p>

          {agenda.length === 0 && (
            <p className="table-empty-state">No sessions scheduled today.</p>
          )}

          <div className="agenda-list">
            {agenda.map((m) => (
              <div className="card-detail-card" key={m.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p className="agenda-time" style={{ margin: '0 0 4px' }}>
                      {new Date(m.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {new Date(m.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {m.status === 'Tentative' && (
                        <span className="status-pill status--review" style={{ marginLeft: 8 }}>TENTATIVE</span>
                      )}
                    </p>
                    <p className="agenda-title" style={{ margin: '0 0 4px' }}>{m.title}</p>
                    {m.location && <p className="agenda-location" style={{ margin: 0 }}>{m.location}</p>}
                  </div>

                  {m.participants.length > 0 && (
                    <div className="avatar-stack">
                      {m.participants.slice(0, 4).map((p) => (
                        <span className="avatar-circle" key={p.id} title={p.name}>
                          {initials(p.name)}
                        </span>
                      ))}
                      {m.participants.length > 4 && (
                        <span className="avatar-circle avatar-circle--more">
                          +{m.participants.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="agenda-actions" style={{ marginTop: 12 }}>
                  {m.join_url && (
                    <a className="btn btn--primary btn--sm" href={m.join_url} target="_blank" rel="noreferrer">
                      Join Session
                    </a>
                  )}
                  {m.briefing_url && (
                    <a className="btn btn--secondary btn--sm" href={m.briefing_url} target="_blank" rel="noreferrer">
                      Briefing Docs
                    </a>
                  )}
                  {!m.join_url && !m.briefing_url && (
                    <span className="timeline-note">No join link or briefing doc attached.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn--primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default AgendaDetailModal;