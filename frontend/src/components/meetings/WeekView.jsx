import React from 'react';

const ROW_HEIGHT = 64;
const START_HOUR = 8;
const END_HOUR = 18;

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const buildWeekDays = (currentDate) => {
  const start = new Date(currentDate);
  start.setDate(currentDate.getDate() - currentDate.getDay());
  const today = new Date();

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({
      label: DAY_LABELS[i],
      num: d.getDate(),
      date: d,
      active: isSameDay(d, today),
    });
  }
  return days;
};

const WeekView = ({ currentDate, events = [], onSelect }) => {
  const weekDays = buildWeekDays(currentDate);

  const hours = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) hours.push(h);

  const formatHour = (h) => {
    const period = h < 12 ? 'AM' : 'PM';
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${String(display).padStart(2, '0')}:00 ${period}`;
  };

  return (
    <div className="week-view">
      <div className="week-view-head">
        <div className="week-time-gutter" />
        {weekDays.map((d) => (
          <div key={d.label} className={`week-head-cell ${d.active ? 'is-active' : ''}`}>
            <span className="week-head-label">{d.label}</span>
            <span className="week-head-num">{d.num}</span>
          </div>
        ))}
      </div>

      <div className="week-view-body" style={{ height: hours.length * ROW_HEIGHT }}>
        <div className="week-time-gutter">
          {hours.map((h) => (
            <div key={h} className="week-hour-row week-hour-label">{formatHour(h)}</div>
          ))}
        </div>

        {weekDays.map((d, dayIndex) => {
          const dayEvents = events.filter((ev) => isSameDay(new Date(ev.date), d.date));
          return (
            <div key={d.label} className="week-day-column">
              {hours.map((h) => (
                <div key={h} className="week-hour-row" />
              ))}

              {dayEvents.map((ev, i) => {
                const top = (ev.startHour - START_HOUR) * ROW_HEIGHT;
                const height = (ev.endHour - ev.startHour) * ROW_HEIGHT;
                return (
                  <div
                    key={i}
                    className={`week-event chip--${ev.color || 'blue'}`}
                    style={{ top, height, cursor: 'pointer' }}
                    onClick={() => onSelect && onSelect(ev.raw)}
                  >
                    <span className="week-event-title">{ev.title}</span>
                    <span className="week-event-time">{ev.time}</span>
                    {ev.location && <span className="week-event-location">{ev.location}</span>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekView;