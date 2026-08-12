import React from 'react';
import { UPCOMING_APPOINTMENTS, MEETING_STATS } from './meetingsData';

const STATUS_CLASS = {
  SCHEDULED: 'appt-status--scheduled',
  TENTATIVE: 'appt-status--tentative',
};

const UpcomingAppointments = () => {
  return (
    <aside className="meetings-side-panel">
      <div className="meetings-side-card">
        <div className="meetings-side-header">
          <h3>Upcoming Appointments</h3>
          <span className="meetings-date-chip">OCT 14</span>
        </div>

        <div className="appt-list">
          {UPCOMING_APPOINTMENTS.map((a) => (
            <div key={a.id} className="appt-card">
              <div className="appt-card-top">
                <span className="appt-time">
                  <i className="fa-regular fa-clock"></i> {a.time}
                </span>
                <span className={`appt-status ${STATUS_CLASS[a.status]}`}>{a.status}</span>
              </div>
              <p className="appt-title">{a.title}</p>
              <div className="appt-meta">
                {a.attendeeCount > 0 && (
                  <span className="appt-avatars">
                    <span className="appt-avatar" />
                    {a.attendeeCount > 1 && <span className="appt-avatar-more">+{a.attendeeCount - 1}</span>}
                  </span>
                )}
                <span className="appt-location">{a.location}</span>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn--outline meetings-view-all">View Full Schedule</button>
      </div>

      <div className="meetings-stats-row">
        <div className="meetings-stat-card">
          <span className="meetings-stat-label">Total Hours</span>
          <span className="meetings-stat-value">{MEETING_STATS.totalHours}</span>
          <span className="meetings-stat-delta">↗ {MEETING_STATS.totalHoursDelta}</span>
        </div>
        <div className="meetings-stat-card">
          <span className="meetings-stat-label">Conflicts</span>
          <span className="meetings-stat-value meetings-stat-value--warn">
            {String(MEETING_STATS.conflicts).padStart(2, '0')}
          </span>
          <span className="meetings-stat-delta meetings-stat-delta--warn">Requires attention</span>
        </div>
      </div>
    </aside>
  );
};

export default UpcomingAppointments;