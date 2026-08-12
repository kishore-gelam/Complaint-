import React, { useState, useEffect } from 'react';
import { getComplaints, getComplaintStats } from '../api/complaints';
import { getMeetings } from '../api/meetings';

const EMPTY_STATS = { open: 0, underReview: 0, meetingsScheduled: 0, resolved: 0 };

const URGENCY_STYLES = {
  Low: 'urgency--low',
  Medium: 'urgency--medium',
  High: 'urgency--high',
};

const AdminDashboard = ({ userRole, onViewAllComplaints }) => {
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

  const recent = [...complaints]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const upcomingMeetings = [...meetings]
    .filter((m) => new Date(m.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(0, 4);

  return (
    <main className="dashboard">
      <h1 className="admin-dashboard-title">Management Dashboard</h1>

      <div className="admin-dashboard-grid">
        <div className="admin-dashboard-main">
          <div className="admin-stats-row">
            <div className="admin-stat-card">
              <span className="admin-stat-label">Total Complaints</span>
              <span className="admin-stat-value">{complaints.length}</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Pending Review</span>
              <span className="admin-stat-value admin-stat-value--warn">{stats.underReview}</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Scheduled Meetings</span>
              <span className="admin-stat-value admin-stat-value--ok">{meetings.length}</span>
            </div>
          </div>

          <div className="table-card">
            <div className="table-card-header">
              <h2 className="table-card-title">Recent Complaints</h2>
              <button className="link-btn" onClick={onViewAllComplaints}>View All</button>
            </div>

            {recent.length === 0 && (
              <p className="table-empty-state">No complaints yet.</p>
            )}

            <div className="admin-recent-list">
              {recent.map((c) => (
                <div className="admin-recent-item" key={c.id}>
                  <div className="admin-recent-item-main">
                    <p className="admin-recent-item-title">{c.title}</p>
                    <p className="admin-recent-item-meta">
                      From {c.submitter_name || 'Unknown'} · {c.category}
                    </p>
                  </div>
                  <div className="admin-recent-item-badges">
                    {c.urgency && (
                      <span className={`urgency-pill ${URGENCY_STYLES[c.urgency] || ''}`}>
                        {c.urgency}
                      </span>
                    )}
                    <span className={`status-pill status--${c.status === 'Resolved' ? 'resolved' : c.status === 'Meeting Scheduled' ? 'meeting' : 'review'}`}>
                      {c.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-dashboard-side">
          <div className="table-card">
            <div className="table-card-header">
              <h2 className="table-card-title">Upcoming Meetings</h2>
              <span className="admin-tab-count">{upcomingMeetings.length} Active</span>
            </div>

            {upcomingMeetings.length === 0 && (
              <p className="table-empty-state">No upcoming meetings.</p>
            )}

            <div className="reminder-list">
              {upcomingMeetings.map((m) => (
                <div className="reminder-card" key={m.id}>
                  <p className="reminder-title">{m.title}</p>
                  <p className="reminder-time">
                    {new Date(m.start_time).toLocaleString('en-US', {
                      month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  {m.location && <p className="reminder-location">{m.location}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;