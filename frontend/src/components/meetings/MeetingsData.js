// Sample data for the "My Meetings" page. Replace with real API data later.

// ---- Month view grid (Oct 2024, matches the mockup) ----
export const MONTH_LABEL = 'October 2026';

export const MONTH_WEEKS = [
  [
    { day: 29, muted: true }, { day: 30, muted: true },
    { day: 1 }, { day: 2 }, { day: 3 }, { day: 4 }, { day: 5 },
  ],
  [
    { day: 6 }, { day: 7 }, { day: 8 },
    { day: 9, events: [{ time: '09:00', label: 'Grieva', color: 'blue' }] },
    { day: 10 }, { day: 11 }, { day: 12 },
  ],
  [
    { day: 13 },
    {
      day: 14,
      today: true,
      events: [
        { time: '11:30', label: 'Chairman', color: 'blue' },
        { time: '14:00', label: 'Policy Bo', color: 'orange' },
      ],
    },
    { day: 15 }, { day: 16 }, { day: 17 }, { day: 18 }, { day: 19 },
  ],
  [
    { day: 20 }, { day: 21 }, { day: 22 },
    { day: 23, events: [{ time: '10:00', label: 'Final App', color: 'blue' }] },
    { day: 24 }, { day: 25 }, { day: 26 },
  ],
  [
    { day: 27 }, { day: 28 }, { day: 29 }, { day: 30 }, { day: 31 },
    { day: 1, muted: true }, { day: 2, muted: true },
  ],
];

// ---- Week view (Oct 6 - Oct 12) ----
export const WEEK_DAYS = [
  { label: 'SUN', num: '08' },
  { label: 'MON', num: '09' },
  { label: 'TUE', num: '10', active: true },
  { label: 'WED', num: '11' },
  { label: 'THU', num: '12' },
  { label: 'FRI', num: '13' },
  { label: 'SAT', num: '14' },
];

export const WEEK_START_HOUR = 8;
export const WEEK_END_HOUR = 14;

export const WEEK_EVENTS = [
  {
    dayIndex: 2, // TUE 10
    startHour: 9, endHour: 10.5,
    title: 'Strategy Sync', time: '09:00 AM - 10:30 AM',
    color: 'blue',
  },
  {
    dayIndex: 0, // SUN 08
    startHour: 12, endHour: 14,
    title: 'Grievance Review', location: 'Conference Room A', time: '12:00 PM - 02:00 PM',
    color: 'orange',
  },
];

// ---- Day view (agenda for the selected day) ----
export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 17;

export const DAY_EVENTS = [
  {
    startHour: 8.5, endHour: 9.5,
    title: 'Daily Operations Sync',
    location: 'Conference Room A',
    time: '08:30 - 09:30 AM',
    color: 'blue',
    attendees: 3,
  },
  {
    startHour: 10, endHour: 11.5,
    title: 'Complaint Review Panel',
    location: 'Virtual (Teams)',
    time: '10:00 - 11:30 AM',
    color: 'priority',
    badge: 'HIGH PRIORITY',
    description:
      'Reviewing the escalated grievance filed by the logistics department regarding the Q3 delivery delays.',
    joinCall: true,
    now: true,
  },
  {
    startHour: 13, endHour: 14,
    title: '1:1 Performance Check-in',
    location: 'Lounge Area',
    time: '01:00 - 02:00 PM',
    color: 'gray',
    withPerson: 'Michael Chen',
  },
  {
    startHour: 15.5, endHour: 17,
    title: 'Compliance Training Prep',
    location: 'Boardroom 2',
    time: '03:30 - 05:00 PM',
    color: 'gray',
    tags: ['Work Session', 'Planning'],
    attendees: 2,
  },
];

// ---- Right-hand panel (shown on all views) ----
export const UPCOMING_APPOINTMENTS = [
  {
    id: 1,
    time: '09:00 AM - 10:30 AM',
    status: 'SCHEDULED',
    title: 'Grievance Review with Chairman',
    location: 'Conference Room A',
    attendeeCount: 2,
  },
  {
    id: 2,
    time: '11:30 AM - 12:30 PM',
    status: 'SCHEDULED',
    title: 'Strategy Sync: Q4 Directives',
    location: "Chairman's Office",
    attendeeCount: 2,
  },
  {
    id: 3,
    time: '02:00 PM - 03:00 PM',
    status: 'TENTATIVE',
    title: 'HR Policy Amendment Review',
    location: 'Virtual (MS Teams)',
    attendeeCount: 0,
  },
];

export const MEETING_STATS = {
  totalHours: '12.5h',
  totalHoursDelta: '+2h this week',
  conflicts: 2,
};