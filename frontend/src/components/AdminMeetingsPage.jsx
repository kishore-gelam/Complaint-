import React, { useState, useEffect, useRef } from 'react';
import MonthView from './meetings/MonthView';
import WeekView from './meetings/WeekView';
import DayView from './meetings/DayView';
import MeetingsListView from './meetings/MeetingsListView';
import NewMeetingModal from './meetings/NewMeetingModal';
import EditMeetingModal from './meetings/EditMeetingModal';
import { getMeetings, updateMeeting } from '../api/meetings';
import { updateComplaintStatus } from '../api/complaints';

const VIEW_OPTIONS = ['Day', 'Week', 'Month'];

const AdminMeetingsPage = () => {
  const [displayMode, setDisplayMode] = useState('Calendar'); // 'Calendar' | 'List'
  const [view, setView] = useState('Month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [newMeetingOpen, setNewMeetingOpen] = useState(false);
  const [rescheduleMeeting, setRescheduleMeeting] = useState(null);
  const [completing, setCompleting] = useState(false);
  const detailRef = useRef(null);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const data = await getMeetings();
      setMeetings(data);
      const mapped = data.map((m) => {
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
      });
      setEvents(mapped);

      // Keep selectedMeeting fresh after a reschedule/complete action.
      setSelectedMeeting((prev) => {
        if (!prev) return prev;
        const updated = data.find((m) => m.id === prev.id);
        return updated || prev;
      });
    } catch (err) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  useEffect(() => {
    if (selectedMeeting && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedMeeting]);

  const handleSelectEvent = (ev) => {
    // Calendar views pass the mapped display event ({raw, title, date, ...});
    // the list view passes the raw meeting directly. Normalize to raw either way.
    setSelectedMeeting(ev.raw || ev);
  };

  const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const goToPrevious = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (view === 'Month') next.setMonth(prev.getMonth() - 1);
      else if (view === 'Week') next.setDate(prev.getDate() - 7);
      else next.setDate(prev.getDate() - 1);
      return next;
    });
  };

  const goToNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (view === 'Month') next.setMonth(prev.getMonth() + 1);
      else if (view === 'Week') next.setDate(prev.getDate() + 7);
      else next.setDate(prev.getDate() + 1);
      return next;
    });
  };

  const handleMarkComplete = async () => {
    if (!selectedMeeting) return;
    setCompleting(true);
    try {
      await updateMeeting(selectedMeeting.id, { status: 'Completed' });

      // If this meeting was scheduled for a complaint, resolving it here
      // closes the loop — the meeting happened, so the complaint is done.
      if (selectedMeeting.related_complaint_id) {
        await updateComplaintStatus(
          selectedMeeting.related_complaint_id,
          'Resolved',
          'Resolved following completed meeting.'
        );
      }

      await loadMeetings();
    } catch (err) {
      alert(err.message || 'Failed to mark meeting as complete');
    } finally {
      setCompleting(false);
    }
  };

  const now = new Date();
  const upcomingCount = meetings.filter((m) => new Date(m.start_time) >= now).length;
  const completedCount = meetings.filter((m) => m.status === 'Completed').length;
  const rescheduledCount = meetings.filter((m) => m.status === 'Tentative').length;

  return (
    <main className="meetings-page">
      <section className="meetings-main">
        <div className="admin-meetings-header">
          <div>
            <h1 className="admin-dashboard-title">My Meetings</h1>
            <p className="admin-page-subtitle">Review and manage your scheduled sessions with the leadership team.</p>
          </div>
          <div className="admin-meetings-header-actions">
            <div className="display-mode-toggle">
              <button
                className={`display-mode-option ${displayMode === 'List' ? 'is-active' : ''}`}
                onClick={() => setDisplayMode('List')}
              >
                ☰ List
              </button>
              <button
                className={`display-mode-option ${displayMode === 'Calendar' ? 'is-active' : ''}`}
                onClick={() => setDisplayMode('Calendar')}
              >
                📅 Calendar
              </button>
            </div>
            <button className="btn btn--primary" onClick={() => setNewMeetingOpen(true)}>
              + New Meeting
            </button>
          </div>
        </div>

        {displayMode === 'Calendar' ? (
          <>
            <div className="calendar-toolbar">
              <div className="calendar-month-nav">
                <span className="calendar-month-label">{monthLabel}</span>
                <button className="icon-btn" aria-label="Previous" onClick={goToPrevious}>‹</button>
                <button className="icon-btn" aria-label="Next" onClick={goToNext}>›</button>
              </div>

              <div className="view-toggle">
                {VIEW_OPTIONS.map((v) => (
                  <button
                    key={v}
                    className={`view-toggle-option ${view === v ? 'is-active' : ''}`}
                    onClick={() => setView(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="calendar-panel">
              {loading && <p className="table-empty-state">Loading meetings…</p>}
              {!loading && view === 'Month' && <MonthView currentDate={currentDate} events={events} onSelect={handleSelectEvent} />}
              {!loading && view === 'Week' && <WeekView currentDate={currentDate} events={events} onSelect={handleSelectEvent} />}
              {!loading && view === 'Day' && <DayView currentDate={currentDate} events={events} onSelect={handleSelectEvent} />}
            </div>

            <div className="admin-meeting-detail-placeholder" ref={detailRef}>
              {selectedMeeting ? (
                <div>
                  <h3 className="detail-section-title" style={{ marginTop: 0 }}>{selectedMeeting.title}</h3>
                  <p className="timeline-note">
                    {new Date(selectedMeeting.start_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    {' – '}
                    {new Date(selectedMeeting.end_time).toLocaleTimeString('en-US', { timeStyle: 'short' })}
                  </p>
                  {selectedMeeting.location && <p className="admin-recent-item-meta">{selectedMeeting.location}</p>}
                  <p className="admin-recent-item-meta" style={{ marginTop: 6 }}>
                    Status: <strong>{selectedMeeting.status}</strong>
                  </p>

                  {selectedMeeting.status !== 'Completed' && selectedMeeting.status !== 'Cancelled' && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                      <button className="btn btn--outline btn--small" onClick={() => setRescheduleMeeting(selectedMeeting)}>
                        Reschedule
                      </button>
                      <button className="btn btn--primary btn--small" onClick={handleMarkComplete} disabled={completing}>
                        {completing ? 'Marking…' : 'Mark Complete'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="admin-meeting-placeholder-icon">📅</div>
                  <p className="admin-meeting-placeholder-title">Select a meeting to view full details</p>
                  <p className="admin-meeting-placeholder-sub">All scheduled sessions and submission reviews will appear here.</p>
                </>
              )}
            </div>

            <div className="meetings-stats-row">
              <div className="meetings-stat-card">
                <span className="meetings-stat-value">{String(upcomingCount).padStart(2, '0')}</span>
                <span className="meetings-stat-label">Upcoming Meetings</span>
              </div>
              <div className="meetings-stat-card">
                <span className="meetings-stat-value">{String(completedCount).padStart(2, '0')}</span>
                <span className="meetings-stat-label">Completed Sessions</span>
              </div>
              <div className="meetings-stat-card">
                <span className="meetings-stat-value meetings-stat-value--warn">{String(rescheduledCount).padStart(2, '0')}</span>
                <span className="meetings-stat-label">Rescheduled Items</span>
              </div>
            </div>
          </>
        ) : (
          <MeetingsListView
            meetings={meetings}
            loading={loading}
            onSelect={handleSelectEvent}
            onRefresh={loadMeetings}
          />
        )}
      </section>

      <NewMeetingModal
        open={newMeetingOpen}
        onClose={() => setNewMeetingOpen(false)}
        onCreated={loadMeetings}
        existingMeetings={meetings}
      />

      <EditMeetingModal
        open={!!rescheduleMeeting}
        meeting={rescheduleMeeting}
        onClose={() => setRescheduleMeeting(null)}
        onUpdated={loadMeetings}
      />
    </main>
  );
};

export default AdminMeetingsPage;