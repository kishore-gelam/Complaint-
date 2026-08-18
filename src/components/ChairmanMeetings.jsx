import React, { useState, useEffect } from 'react';
import MonthView from './meetings/MonthView';
import AgendaDetailModal from './AgendaDetailModal';
import MeetingEventDetailModal from './MeetingEventDetailModal';
import { getMeetings, getTodayAgenda } from '../api/meetings';
import { getComplaints } from '../api/complaints';

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

const ChairmanMeetings = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [events, setEvents] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAgendaDetail, setShowAgendaDetail] = useState(false);
  const[selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [meetingsData, agendaData, complaintsData] = await Promise.all([
          getMeetings(),
          getTodayAgenda(),
          getComplaints().catch(() => []),
        ]);
        setMeetings(meetingsData);
        setAgenda(agendaData);
        setComplaints(complaintsData);
        setEvents(
          meetingsData.map((m) => {
            const start = new Date(m.start_time);
            const end = new Date(m.end_time);
            return {
              raw: m,
              title: m.title,
              date: start,
              startHour: start.getHours() + start.getMinutes() / 60,
              endHour: end.getHours() + end.getMinutes() / 60,
              time: start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              location: m.location,
              color: m.status === 'Tentative' ? 'orange' : 'blue',
            };
          })
        );
      } catch (err) {
        setError('Could not load meetings. Is the backend running on port 8000?');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const goToPrevious = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() - 1);
      return next;
    });
  };
  const goToNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + 1);
      return next;
    });
  };
  const goToToday = () => setCurrentDate(new Date());

  const now = new Date();
  const nextSession = agenda.find((m) => new Date(m.end_time) >= now);

  const overdueDeadline = [...complaints]
    .filter((c) => c.status !== 'Resolved' && c.urgency === 'High')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];

  if (loading) {
    return <main className="dashboard"><p>Loading meetings…</p></main>;
  }
  if (error) {
    return <main className="dashboard"><p className="table-empty-state">{error}</p></main>;
  }

  return (
    <main className="dashboard chairman-meetings">
      <div className="chairman-meetings-grid">
        <div className="table-card chairman-meetings-calendar">
          <div className="chairman-meetings-toolbar">
            <div>
              <h1 className="admin-dashboard-title">{monthLabel}</h1>
              {agenda.length > 0 ? (
                <p className="admin-page-subtitle">
                  {agenda.length} session{agenda.length === 1 ? '' : 's'} scheduled today.
                </p>
              ) : (
                <p className="admin-page-subtitle">No sessions scheduled today.</p>
              )}
            </div>
            <div className="calendar-month-nav">
              <button className="icon-btn" onClick={goToPrevious}>‹</button>
              <button className="btn btn--secondary" onClick={goToToday}>Today</button>
              <button className="icon-btn" onClick={goToNext}>›</button>
            </div>
          </div>

                    <MonthView currentDate={currentDate} events={events} onSelect={(ev) => setSelectedEvent(ev.raw || ev)} />
                      
                    </div>

        <div className="chairman-meetings-side">
          <div className="table-card">
                        <div
              className="table-card-header"
              style={{ cursor: agenda.length > 0 ? 'pointer' : 'default' }}
              onClick={() => agenda.length > 0 && setShowAgendaDetail(true)}
            >
              <span className="admin-tab-count">SCHEDULE</span>
              <h2 className="table-card-title">Agenda: Today</h2>
              {agenda.length > 0 && (
                <span className="admin-stat-tag">{agenda.length} SESSION{agenda.length === 1 ? '' : 'S'}</span>
              )}
            </div>

            {agenda.length === 0 && (
              <p className="table-empty-state">No sessions scheduled today.</p>
            )}

            <div className="agenda-list">
              {agenda.map((m) => {
                const isCritical = m.status === 'Scheduled' && new Date(m.start_time) <= now && new Date(m.end_time) >= now;
                return (
                  <div className={`agenda-item ${isCritical ? 'agenda-item--critical' : ''}`} key={m.id}>
                    <p className="agenda-time">
                      {new Date(m.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {new Date(m.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="agenda-title">{m.title}</p>
                    {m.location && <p className="agenda-location">{m.location}</p>}

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

                    <div className="agenda-actions">
                      {m.join_url && (
                        <a className="btn btn--primary btn--sm" href={m.join_url} target="_blank" rel="noreferrer">
                          Join Session
                        </a>
                      )}
                      {m.briefing_url && (
                        <a className="btn btn--secondary btn--sm" href={m.briefing_url} target="_blank" rel="noreferrer">
                          Briefing PDF
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="table-card">
            <div className="table-card-header">
              <span className="admin-tab-count">UPCOMING DEADLINES</span>
            </div>
            {overdueDeadline ? (
              <div className="deadline-card">
                <span className="deadline-icon">⚠️</span>
                <div>
                  <p className="deadline-title">{overdueDeadline.reference_id} — {overdueDeadline.title}</p>
                  <p className="deadline-sub">
                    Open since {new Date(overdueDeadline.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · High urgency, unresolved
                  </p>
                </div>
              </div>
            ) : (
              <p className="table-empty-state">No high-urgency items pending.</p>
            )}
          </div>
        </div>
            </div>

      <AgendaDetailModal
        open={showAgendaDetail}
        agenda={agenda}
        onClose={() => setShowAgendaDetail(false)}
      />
            <MeetingEventDetailModal
        open={!!selectedEvent}
        meeting={selectedEvent}
        relatedComplaint={
          selectedEvent
            ? complaints.find((c) => c.id === selectedEvent.related_complaint_id)
            : null
        }
        onClose={() => setSelectedEvent(null)}
      />
    </main>
  );
};

export default ChairmanMeetings;