import React, { useState, useEffect } from 'react';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import UpcomingAppointments from './UpcomingAppointments';
import MeetingDetailModal from './MeetingDetailModal';
import { getMeetings } from '../../api/meetings';

const VIEW_OPTIONS = ['Month', 'Week', 'Day'];

const MeetingsPage = () => {
  const [view, setView] = useState('Month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const data = await getMeetings();
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
          color: 'blue',
        };
      });
      setEvents(mapped);
    } catch (err) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const monthLabel = currentDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

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

  return (
    <main className="meetings-page">
      <section className="meetings-main">
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
          {!loading && view === 'Month' && <MonthView currentDate={currentDate} events={events} onSelect={setSelectedMeeting} />}
          {!loading && view === 'Week' && <WeekView currentDate={currentDate} events={events} onSelect={setSelectedMeeting} />}
          {!loading && view === 'Day' && <DayView currentDate={currentDate} events={events} onSelect={setSelectedMeeting} />}
        </div>
      </section>

      <UpcomingAppointments currentDate={currentDate} events={events} />

      <MeetingDetailModal
        open={!!selectedMeeting}
        meeting={selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
      />
    </main>
  );
};

export default MeetingsPage;