import React from 'react';

const ROW_HEIGHT = 64;
const START_HOUR = 8;
const END_HOUR = 18;

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const DayView = ({ currentDate, events = [], onSelect }) => {
  const hours = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) hours.push(h);

  const formatHour = (h) => {
    const period = h < 12 ? 'AM' : 'PM';
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${String(display).padStart(2, '0')}:00 ${period}`;
  };

  const totalHeight = hours.length * ROW_HEIGHT;

  const now = new Date();
  const isToday = isSameDay(currentDate, now);
  const nowHourDecimal = now.getHours() + now.getMinutes() / 60;
  const nowTop = (nowHourDecimal - START_HOUR) * ROW_HEIGHT;

  const dayEvents = events.filter((ev) => isSameDay(new Date(ev.date), currentDate));

  return (
    <div className="day-view">
      <div className="day-view-body" style={{ height: totalHeight }}>
        <div className="day-time-gutter">
          {hours.map((h) => (
            <div key={h} className="day-hour-row day-hour-label">{formatHour(h)}</div>
          ))}
        </div>

        <div className="day-events-column">
          {hours.map((h) => (
            <div key={h} className="day-hour-row" />
          ))}

          {isToday && nowHourDecimal >= START_HOUR && nowHourDecimal <= END_HOUR && (
            <div className="day-now-line" style={{ top: nowTop }}>
              <span className="day-now-badge">NOW</span>
            </div>
          )}

          {dayEvents.map((ev, i) => {
            const top = (ev.startHour - START_HOUR) * ROW_HEIGHT;
            const height = (ev.endHour - ev.startHour) * ROW_HEIGHT;
            return (
              <div
                key={i}
                className={`day-event chip--${ev.color || 'blue'} ${ev.now ? 'is-now' : ''}`}
                style={{ top, height, cursor: 'pointer' }}
                onClick={() => onSelect && onSelect(ev.raw)}
              >
                <div className="day-event-top">
                  <div>
                    <p className="day-event-title">{ev.title}</p>
                    <p className="day-event-meta">{ev.location} · {ev.time}</p>
                  </div>
                  {ev.badge && <span className="day-event-badge">{ev.badge}</span>}
                </div>

                {ev.description && <p className="day-event-desc">{ev.description}</p>}

                <div className="day-event-bottom">
                  {ev.withPerson && <span className="day-event-person">👤 with {ev.withPerson}</span>}
                  {ev.tags && ev.tags.map((t) => <span key={t} className="day-event-tag">{t}</span>)}
                  {ev.joinCall && (
                    <button className="btn btn--join" onClick={(e) => e.stopPropagation()}>
                      <i className="fa-solid fa-video"></i> Join Call
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DayView;