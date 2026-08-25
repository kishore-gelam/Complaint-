import React, { useState, useEffect } from 'react';
import { getMeetings } from '../../api/meetings';

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date) {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 7);
  return d;
}

function overlaps(a, b) {
  return new Date(a.start_time) < new Date(b.end_time) && new Date(b.start_time) < new Date(a.end_time);
}

const UpcomingAppointments = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMeetings()
      .then(setMeetings)
      .catch(() => setMeetings([]))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();

  const upcoming = meetings
    .filter((m) => new Date(m.end_time) >= now && m.status !== 'Cancelled')
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(0, 3);

  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const thisWeekMeetings = meetings.filter((m) => {
    const start = new Date(m.start_time);
    return start >= weekStart && start < weekEnd && m.status !== 'Cancelled';
  });

  const totalHours = thisWeekMeetings.reduce((sum, m) => {
    const hrs = (new Date(m.end_time) - new Date(m.start_time)) / 3600000;
    return sum + Math.max(0, hrs);
  }, 0);

  let conflictCount = 0;
  for (let i = 0; i < thisWeekMeetings.length; i++) {
    for (let j = i + 1; j < thisWeekMeetings.length; j++) {
      if (overlaps(thisWeekMeetings[i], thisWeekMeetings[j])) conflictCount++;
    }
  }

  const todayLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();

  return (
    <aside className="meetings-side-panel">
      <div className="meetings-side-card">
        <div className="meetings-side-header">
          <h3>Upcoming Appointments</h3>
          <span className="meetings-date-chip">{todayLabel}</span>
        </div>

        {loading && <p className="table-empty-state">Loading…</p>}

        {!loading && upcoming.length === 0 && (
          <p className="table-empty-state">No upcoming meetings scheduled.</p>
        )}

        {!loading && upcoming.length > 0 && (
          <div className="appt-list">
            {upcoming.map((m) => (
              <div key={m.id} className="appt-card">
                                <div className="appt-card-top">
                  <span className="appt-time">
                    <i className="fa-regular fa-clock"></i>{' '}
                    {new Date(m.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {new Date(m.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={`appt-status ${m.status === 'Tentative' ? 'appt-status--tentative' : 'appt-status--scheduled'}`}>
                    {m.status.toUpperCase()}
                  </span>
                </div>
                <p className="appt-title">{m.title}</p>
                <div className="appt-meta">
                  {m.location && <span className="appt-location">{m.location}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        
      </div>

      <div className="meetings-stats-row">
        <div className="meetings-stat-card">
          <span className="meetings-stat-label">Hours This Week</span>
          <span className="meetings-stat-value">{totalHours.toFixed(1)}h</span>
        </div>
        <div className="meetings-stat-card">
          <span className="meetings-stat-label">Conflicts</span>
          <span className={`meetings-stat-value ${conflictCount > 0 ? 'meetings-stat-value--warn' : ''}`}>
            {String(conflictCount).padStart(2, '0')}
          </span>
          {conflictCount > 0 && (
            <span className="meetings-stat-delta meetings-stat-delta--warn">Requires attention</span>
          )}
        </div>
      </div>
    </aside>
  );
};

export default UpcomingAppointments;