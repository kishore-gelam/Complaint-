import React, { useState, useEffect } from 'react';
import { getComplaints, getComplaintStats } from '../api/complaints';
import ComplaintDetailModal from './ComplaintDetailModal';
import ManageComplaintModal from './ManageComplaintModal';
import AdminResolutionModal from './AdminResolutionModal';

const TABS = ['All Complaints', 'Pending', 'In Progress', 'Resolved'];
const CATEGORIES = ['All Categories', 'Hr', 'IT Department', 'Operations', 'Infrastructure', 'Loans', 'Personal'];
const STATUSES = ['All Status', 'Under Review', 'Meeting Scheduled', 'Resolved'];
const PAGE_SIZE = 10;

// Super Admin is always view-only. "Personal" complaints skip Facility
// Head entirely, so Admin can act on them right away. Every other
// category must clear Facility Head Inspection first — Admin can't
// jump ahead of Facility Head.
const canManageRow = (c, userRole) => {
  if (userRole === 'Super Admin') return false;
  if (c.status === 'Resolved') return false;
  if (c.category === 'Personal') return true;
  return c.current_stage !== 'Submitted';
};

const AdminComplaints = ({ userRole }) => {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ resolved: 0, avgResolutionDays: 0, slaCompliance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All Complaints');
  const [category, setCategory] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [dateFrom, setDateFrom] = useState('');
  const [viewComplaint, setViewComplaint] = useState(null);
  const [manageComplaint, setManageComplaint] = useState(null);
  const [resolveComplaint, setResolveComplaint] = useState(null);
  const [page, setPage] = useState(1);

  const loadData = async () => {
    try {
      setLoading(true);
      const [complaintsData, statsData] = await Promise.all([
        getComplaints(),
        getComplaintStats(),
      ]);
      setComplaints(complaintsData);
      setStats(statsData);
    } catch (err) {
      setError('Could not load complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeTab, category, statusFilter, dateFrom]);

  if (loading) return <main className="dashboard"><p>Loading…</p></main>;
  if (error) return <main className="dashboard"><p className="table-empty-state">{error}</p></main>;

  const mapComplaint = (c) => ({
    dbId: c.id,
    id: c.reference_id,
    date: new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    subject: c.title,
    category: c.category,
    status: c.status,
    current_stage: c.current_stage,
    submitter_name: c.submitter_name,
    description: c.description,
  });

  const filtered = complaints.filter((c) => {
    const matchesCategory = category === 'All Categories' || c.category === category;
    const matchesStatus = statusFilter === 'All Status' || c.status === statusFilter;
    const matchesDate = !dateFrom || new Date(c.created_at) >= new Date(dateFrom);
    const matchesTab =
      activeTab === 'All Complaints' ||
      (activeTab === 'Pending' && c.status === 'Under Review') ||
      (activeTab === 'In Progress' && c.status === 'Meeting Scheduled') ||
      (activeTab === 'Resolved' && c.status === 'Resolved');
    return matchesCategory && matchesStatus && matchesDate && matchesTab;
  });

  const pendingCount = complaints.filter((c) => c.status === 'Under Review').length;
  const inProgressCount = complaints.filter((c) => c.status === 'Meeting Scheduled').length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const handleExportCSV = () => {
    const headers = ['Reference ID', 'Sender', 'Category', 'Date', 'Status'];
    const rows = filtered.map((c) => [
      c.reference_id,
      c.submitter_name || 'Unknown',
      c.category,
      new Date(c.created_at).toLocaleDateString('en-US'),
      c.status,
    ]);
    const csvContent = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'complaints_report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <main className="dashboard">
      <h1 className="admin-dashboard-title">All Complaints Management</h1>
      <p className="admin-page-subtitle">Comprehensive database of all organizational issues and records.</p>

      <div className="admin-stats-row admin-stats-row--three">
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon--green">
            <i className="fa-solid fa-check"></i>
          </div>
          <div>
            <span className="admin-stat-label">Total Resolved</span>
            <span className="admin-stat-value">{stats.resolved}</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon--blue">
            <i className="fa-solid fa-clock"></i>
          </div>
          <div>
            <span className="admin-stat-label">Avg Resolution Time</span>
            <span className="admin-stat-value">{stats.avgResolutionDays} Days</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon--orange">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div>
            <span className="admin-stat-label">SLA Compliance %</span>
            <span className="admin-stat-value">{stats.slaCompliance}%</span>
          </div>
        </div>
      </div>

      <div className="admin-filter-row">
        <div className="admin-filter-field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="admin-filter-field">
          <label>Date Range</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>

        <div className="admin-filter-field">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <button
          className="btn btn--text"
          onClick={() => { setCategory('All Categories'); setStatusFilter('All Status'); setDateFrom(''); }}
        >
          ↺
        </button>
      </div>

      <div className="table-card">
        <div className="admin-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`admin-tab ${activeTab === tab ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              {tab === 'Pending' && <span className="admin-tab-count">{pendingCount}</span>}
              {tab === 'In Progress' && <span className="admin-tab-count">{inProgressCount}</span>}
            </button>
          ))}
        </div>

        <table className="complaints-table">
          <thead>
            <tr>
              <th>Reference ID</th>
              <th>Sender</th>
              <th>Category</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((c) => (
              <tr key={c.id}>
                <td><span className="ref-link">#{c.reference_id}</span></td>
                <td>
                  <div>{c.submitter_name || 'Unknown'}</div>
                  <div className="admin-recent-item-meta">Employee</div>
                </td>
                <td><span className="category-chip">{c.category}</span></td>
                <td>{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
                <td>
                  <span className={`status-pill status--${c.status === 'Resolved' ? 'resolved' : c.status === 'Meeting Scheduled' ? 'meeting' : 'review'}`}>
                    {c.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  <div className="admin-action-group">
                    <button className="icon-btn" aria-label="View" onClick={() => setViewComplaint(mapComplaint(c))}>
                      <i className="fa-solid fa-eye"></i>
                    </button>
                    {canManageRow(c, userRole) && (
                      <>
                        <button className="btn btn--primary btn--small" onClick={() => setResolveComplaint(mapComplaint(c))}>
                          Manage
                        </button>
                        <button
                          className="icon-btn"
                          aria-label="Schedule Meeting"
                          title="Schedule Meeting (Chairman)"
                          onClick={() => setManageComplaint(mapComplaint(c))}
                        >
                          <i className="fa-solid fa-calendar-plus"></i>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && <p className="table-empty-state">No complaints match this filter.</p>}

        {filtered.length > 0 && (
          <div className="table-footer">
            <span>
              Showing {pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length} total entries
            </span>
            <div className="pagination">
              <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
              <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
            </div>
          </div>
        )}
      </div>

      <div className="admin-export-row">
        <button className="btn btn--outline" onClick={handleExportCSV}>
          <i className="fa-solid fa-download"></i> Export CSV Report
        </button>
        <button className="btn btn--primary" onClick={handlePrintSummary}>
          <i className="fa-solid fa-print"></i> Print Summary
        </button>
      </div>

      <ComplaintDetailModal
        open={!!viewComplaint}
        complaint={viewComplaint}
        onClose={() => setViewComplaint(null)}
        userRole={userRole}
      />

      <AdminResolutionModal
        open={!!resolveComplaint}
        complaint={resolveComplaint}
        onClose={() => setResolveComplaint(null)}
        onUpdated={loadData}
      />

      <ManageComplaintModal
        open={!!manageComplaint}
        complaint={manageComplaint}
        onClose={() => setManageComplaint(null)}
        onUpdated={loadData}
      />
    </main>
  );
};

export default AdminComplaints;