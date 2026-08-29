import React, { useState } from 'react';
import { deleteMeeting } from '../../api/meetings';
import EditMeetingModal from './EditMeetingModal';

const RANGE_DAYS = { 'Last 30 Days': 30, 'Last 7 Days': 7, 'This Year': 365 };

const statusMeta = (meeting) => {
  const now = new Date();
  if (meeting.status === 'Tentative') return { label: 'RESCHEDULED', cls: 'status-badge--warn' };
  if (new Date(meeting.end_time) < now) return { label: 'COMPLETED', cls: 'status-badge--success' };
  return { label: 'UPCOMING', cls: 'status-badge--info' };
};

const MeetingsListView = ({ meetings, loading, onSelect, onRefresh }) => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [editMeeting, setEditMeeting] = useState(null);
  const pageSize = 4;

  const filtered = meetings.filter((m) => {
    const { label } = statusMeta(m);
    const statusOk = statusFilter === 'All Statuses' || label === statusFilter.toUpperCase();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RANGE_DAYS[dateRange]);
    const dateOk = new Date(m.start_time) >= cutoff;

    return statusOk && dateOk;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const now = new Date();
  const next24h = meetings.filter((m) => {
    const start = new Date(m.start_time);
    return start >= now && start <= new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }).length;

  const handleDelete = async (e, meetingId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this meeting? This cannot be undone.')) return;
    try {
      await deleteMeeting(meetingId);
      onRefresh && onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to delete meeting');
    }
  };

  return (
    <>
      <div className="list-toolbar">
        <select
          className="list-filter"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option>All Statuses</option>
          <option>Upcoming</option>
          <option>Completed</option>
          <option>Rescheduled</option>
        </select>
        <select
          className="list-filter"
          value={dateRange}
          onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
        >
          <option>Last 30 Days</option>
          <option>Last 7 Days</option>
          <option>This Year</option>
        </select>
        <span className="list-result-count">Showing {pageItems.length} of {filtered.length} results</span>
      </div>

      <div className="list-table-wrap">
        <table className="list-table">
          <thead>
            <tr>
              <th>Title & Topic</th>
              <th>Date & Time</th>
              <th>Participants</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="table-empty-state">Loading meetings…</td></tr>
            )}
            {!loading && pageItems.map((m) => {
              const { label, cls } = statusMeta(m);
              const start = new Date(m.start_time);
              const end = new Date(m.end_time);
              return (
                <tr key={m.id} onClick={() => onSelect && onSelect(m)}>
                  <td>
                    <div className="list-title-cell">
                      <span className="list-title-icon">👥</span>
                      <div>
                        <div className="list-title-text">{m.title}</div>
                        <div className="list-title-ref">{m.ref || `MTG-${m.id}`}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    <div className="list-time-range">
                      {start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <div className="avatar-stack">
                      {(m.participants || []).slice(0, 3).map((p, i) => (
                        <span key={i} className="avatar-chip">{p.initials || p.name?.[0]}</span>
                      ))}
                      {(m.participants || []).length > 3 && (
                        <span className="avatar-chip avatar-chip--more">+{m.participants.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td>{m.location || '—'}</td>
                  <td><span className={`status-badge ${cls}`}>{label}</span></td>
                  <td>
                    <div className="row-actions">
                      <button onClick={(e) => { e.stopPropagation(); setEditMeeting(m); }} aria-label="Edit">✏️</button>
                      <button onClick={(e) => handleDelete(e, m.id)} aria-label="Delete">🗑</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && pageItems.length === 0 && (
              <tr><td colSpan={6} className="table-empty-state">No meetings found.</td></tr>
            )}
          </tbody>
        </table>

        <div className="list-pagination">
          <span>Page {page} of {totalPages}</span>
          <div className="pagination-controls">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
            <button className="is-active">{page}</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
          </div>
        </div>
      </div>

      <div className="meetings-stats-row">
        <div className="meetings-stat-card">
          <span className="meetings-stat-value">{next24h}</span>
          <span className="meetings-stat-label">Meetings — Next 24 Hours</span>
        </div>
        <div className="meetings-stat-card">
          <span className="meetings-stat-value">—</span>
          <span className="meetings-stat-label">Pending RSVP</span>
        </div>
        <div className="meetings-stat-card">
          <span className="meetings-stat-value">—</span>
          <span className="meetings-stat-label">Attendance Rate</span>
        </div>
      </div>

      <EditMeetingModal
        open={!!editMeeting}
        meeting={editMeeting}
        onClose={() => setEditMeeting(null)}
        onUpdated={onRefresh}
      />
    </>
  );
};

export default MeetingsListView;