import React, { useState, useEffect } from 'react';
import { getComplaints, getComplaintStats } from '../api/complaints';
import { getMeetings } from '../api/meetings';

const EMPTY_STATS = {
  open: 0,
  underReview: 0,
  meetingsScheduled: 0,
  resolved: 0,
  avgResolutionDays: 0,
  slaCompliance: 0,
};

const URGENCY_STYLES = {
  Low: 'urgency--low',
  Medium: 'urgency--medium',
  High: 'urgency--high',
};

const STATUS_STYLES = {
  Resolved: 'status--resolved',
  'Meeting Scheduled': 'status--meeting',
  'Under Review': 'status--review',
};

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function buildLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: d,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      resolved: 0,
      highUrgency: 0,
    });
  }
  return days;
}

function formatWeekRange(days) {
  const first = days[0].date;
  const last = days[days.length - 1].date;
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(first)} - ${fmt(last)}`;
}

const Sparkline = ({ values, colorClass }) => {
  const max = Math.max(1, ...values);
  return (
    <div className="sparkline">
      {values.map((v, i) => (
        <span
          key={i}
          className={`sparkline-bar ${colorClass} ${v === 0 ? 'sparkline-bar--empty' : ''}`}
          style={{ height: `${Math.max(10, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
};

const ChairmanDashboard = ({ onViewAllComplaints }) => {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [complaintsData, statsData, meetingsData] = await Promise.all([
          getComplaints(),
          getComplaintStats(),
          getMeetings().catch(() => []),
        ]);
        setComplaints(complaintsData);
        setStats(statsData);
        setMeetings(meetingsData);
      } catch (err) {
        setError('Could not load dashboard data. Is the backend running on port 8000?');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <main className="dashboard"><p>Loading dashboard…</p></main>;
  }

  if (error) {
    return (
      <main className="dashboard">
        <p className="table-empty-state">{error}</p>
      </main>
    );
  }

  const today = new Date();
  const last7Days = buildLast7Days();

  complaints.forEach((c) => {
    const created = new Date(c.created_at);
    const bucket = last7Days.find((d) => isSameDay(d.date, created));
    if (!bucket) return;
    if (c.status === 'Resolved') bucket.resolved += 1;
    if (c.urgency === 'High') bucket.highUrgency += 1;
  });

  const hasEscalationTrend = last7Days.some((d) => d.highUrgency > 0);
  const hasResolvedTrend = last7Days.some((d) => d.resolved > 0);

  const openHighUrgency = complaints.filter(
    (c) => c.urgency === 'High' && c.status !== 'Resolved'
  );

  const todaysMeetings = meetings
    .filter((m) => isSameDay(new Date(m.start_time), today) && m.status !== 'Cancelled')
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const nextSession = todaysMeetings.find((m) => new Date(m.end_time) >= today) || todaysMeetings[0];

  const priorityReview = [...complaints]
    .filter((c) => c.status !== 'Resolved')
    .sort((a, b) => {
      const order = { High: 0, Medium: 1, Low: 2 };
      const urgencyDiff = order[a.urgency] - order[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return new Date(a.created_at) - new Date(b.created_at);
    })
    .slice(0, 6);

  const weeklyTrend = last7Days;
  const hasTrendData = hasEscalationTrend || hasResolvedTrend;
  const maxTrendValue = Math.max(1, ...weeklyTrend.map((d) => d.resolved + d.highUrgency));

  return (
    <main className="dashboard">
      <div className="chairman-header-row">
        <div>
          <h1 className="admin-dashboard-title">Chairman's Executive Overview</h1>
          <p className="admin-page-subtitle">
            {priorityReview.length > 0
              ? `Reviewing ${priorityReview.length} pending item${priorityReview.length === 1 ? '' : 's'} for ${today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.`
              : `No items pending review as of ${today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.`}
          </p>
        </div>
        <div className="chairman-week-badge">
          <i className="fa-regular fa-calendar"></i>
          <span>{formatWeekRange(last7Days)}</span>
        </div>
      </div>

      <div className="chairman-stats-row">
        <div className="admin-stat-card admin-stat-card--column">
          <div className="admin-stat-card-top">
            <span className="admin-stat-icon admin-stat-icon--orange">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </span>
          </div>
          <span className="admin-stat-label">Urgent Escalations</span>
          <div className="admin-stat-value-row">
            <span className="admin-stat-value admin-stat-value--warn">
              {String(openHighUrgency.length).padStart(2, '0')}
            </span>
            {hasEscalationTrend && (
              <Sparkline
                values={last7Days.map((d) => d.highUrgency)}
                colorClass="sparkline-bar--warn"
              />
            )}
          </div>
          <span className="admin-stat-sublabel">
            {openHighUrgency.length > 0 ? 'Open, High urgency' : 'No open high-urgency items'}
          </span>
        </div>

        <div className="admin-stat-card admin-stat-card--column">
          <div className="admin-stat-card-top">
            <span className="admin-stat-icon admin-stat-icon--blue">
              <i className="fa-solid fa-calendar-day"></i>
            </span>
            {nextSession && (
              <span className="admin-stat-tag">NEXT SESSION</span>
            )}
          </div>
          <span className="admin-stat-label">Today's Meetings</span>
          <span className="admin-stat-value">{todaysMeetings.length}</span>
          {nextSession ? (
            <span className="admin-stat-sublabel">
              {nextSession.title} · {new Date(nextSession.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              {nextSession.location ? ` · ${nextSession.location}` : ''}
            </span>
          ) : (
            <span className="admin-stat-sublabel">No sessions today</span>
          )}
        </div>

        <div className="admin-stat-card admin-stat-card--column">
          <div className="admin-stat-card-top">
            <span className="admin-stat-icon admin-stat-icon--green">
              <i className="fa-solid fa-circle-check"></i>
            </span>
          </div>
          <span className="admin-stat-label">Resolution Rate</span>
          <div className="admin-stat-value-row">
            <span className="admin-stat-value admin-stat-value--ok">{stats.slaCompliance}%</span>
            {hasResolvedTrend && (
              <Sparkline
                values={last7Days.map((d) => d.resolved)}
                colorClass="sparkline-bar--ok"
              />
            )}
          </div>
          <div className="admin-progress-track">
            <div
              className="admin-progress-fill"
              style={{ width: `${Math.min(100, stats.slaCompliance)}%` }}
            />
          </div>
          <span className="admin-stat-sublabel">
            Avg {stats.avgResolutionDays} day{stats.avgResolutionDays === 1 ? '' : 's'} to resolve
          </span>
        </div>
      </div>

      <div className="admin-dashboard-grid">
        <div className="admin-dashboard-main">
          <div className="table-card">
            <div className="table-card-header">
              <h2 className="table-card-title">Priority Review List</h2>
              <button className="link-btn" onClick={onViewAllComplaints}>View All</button>
            </div>

            {priorityReview.length === 0 && (
              <p className="table-empty-state">No complaints pending review.</p>
            )}

            <div className="admin-recent-list">
              {priorityReview.map((c) => (
                <div className="admin-recent-item" key={c.id}>
                  <div className="admin-recent-item-main">
                    <p className="admin-recent-item-title">
                      <span className="priority-ref">{c.reference_id}</span> — {c.title}
                    </p>
                    <p className="admin-recent-item-meta">
                      {c.category} · {c.submitter_name || 'Unknown'} · {timeAgo(c.created_at)}
                    </p>
                  </div>
                  <div className="admin-recent-item-badges">
                    <span className={`urgency-pill ${URGENCY_STYLES[c.urgency] || ''}`}>
                      {c.urgency}
                    </span>
                    <span className={`status-pill ${STATUS_STYLES[c.status] || ''}`}>
                      {c.status.toUpperCase()}
                    </span>
                    <span className="delegate-avatar delegate-avatar--empty" title="No delegate data">
                      <i className="fa-solid fa-user"></i>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="table-card">
            <div className="table-card-header">
              <h2 className="table-card-title">Weekly Performance Trend</h2>
              <span className="admin-tab-count">Resolved vs High Urgency (by report date)</span>
            </div>

            {!hasTrendData && (
              <p className="table-empty-state">Not enough data yet.</p>
            )}

            {hasTrendData && (
              <div className="weekly-trend-chart">
                {weeklyTrend.map((d) => (
                  <div className="weekly-trend-col" key={d.label + d.date.toISOString()}>
                    <div className="weekly-trend-bar-track">
                      {d.resolved > 0 && (
                        <div
                          className="weekly-trend-bar weekly-trend-bar--resolved"
                          style={{ height: `${(d.resolved / maxTrendValue) * 100}%` }}
                          title={`${d.resolved} resolved`}
                        />
                      )}
                      {d.highUrgency > 0 && (
                        <div
                          className="weekly-trend-bar weekly-trend-bar--urgent"
                          style={{ height: `${(d.highUrgency / maxTrendValue) * 100}%` }}
                          title={`${d.highUrgency} high urgency`}
                        />
                      )}
                    </div>
                    <span className="weekly-trend-label">{d.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="admin-dashboard-side">
          <div className="table-card">
            <div className="table-card-header">
              <h2 className="table-card-title">Daily Executive Agenda</h2>
            </div>

            {todaysMeetings.length === 0 && (
              <p className="table-empty-state">No sessions scheduled today.</p>
            )}

            <div className="reminder-list">
              {todaysMeetings.map((m) => (
                <div className="reminder-card" key={m.id}>
                  <p className="reminder-time">
                    {new Date(m.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    {' – '}
                    {new Date(m.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="reminder-title">{m.title}</p>
                  {m.location && <p className="reminder-location">{m.location}</p>}
                  {m.status === 'Tentative' && (
                    <span className="status-pill status--review">TENTATIVE</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ChairmanDashboard;