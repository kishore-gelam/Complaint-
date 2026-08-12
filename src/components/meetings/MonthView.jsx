import React from 'react';

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const buildMonthWeeks = (currentDate, events = []) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  const weeks = [];
  let cursor = new Date(gridStart);

  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(cursor);
      const dayEvents = events.filter((ev) => isSameDay(new Date(ev.date), cellDate));

      week.push({
        day: cellDate.getDate(),
        muted: cellDate.getMonth() !== month,
        today: isSameDay(cellDate, today),
        events: dayEvents,
      });

      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
};

const MonthView = ({ currentDate, events = [], onSelect }) => {
  const weeks = buildMonthWeeks(currentDate, events);

  return (
    <div className="calendar-grid">
      <div className="calendar-grid-head">
        {DAY_LABELS.map((d) => (
          <div key={d} className="calendar-grid-head-cell">{d}</div>
        ))}
      </div>

      <div className="calendar-grid-body">
        {weeks.map((week, wi) => (
          <div className="calendar-grid-row" key={wi}>
            {week.map((cell, ci) => (
              <div
                key={ci}
                className={`calendar-cell ${cell.muted ? 'is-muted' : ''} ${cell.today ? 'is-today' : ''}`}
              >
                <span className="calendar-cell-day">{cell.day}</span>
                <div className="calendar-cell-events">
                  {cell.events.map((ev, ei) => (
                    <span
                      key={ei}
                      className={`calendar-event-chip chip--${ev.color || 'blue'}`}
                      onClick={() => onSelect && onSelect(ev.raw)}
                      style={{ cursor: 'pointer' }}
                    >
                      {ev.time} {ev.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthView;