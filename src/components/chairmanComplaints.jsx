import React, { useState, useEffect } from 'react';
import { getComplaints, getComplaintStats } from '../api/complaints';
import ComplaintDetailModal from './ComplaintDetailModal';
import DeptHeadActionModal from './DeptHeadActionModal';
import VerifyAdminStatusModal from './VerifyAdminStatusModal';
import FinalApprovalActionsModal from './FinalApprovalActionsModal';

const TABS = ['All Complaints', 'Pending', 'In Progress', 'Resolved'];
const CATEGORIES = ['All Categories', 'Hr', 'IT Department', 'Operations', 'Infrastructure', 'Loans', 'Personal'];
const STATUSES = ['All Status', 'Under Review', 'Meeting Scheduled', 'Resolved'];
const PAGE_SIZE = 10;

const URGENCY_STYLES = {
  Low: 'urgency--low',
  Medium: 'urgency--medium',
  High: 'urgency--high',
};
const CATEGORY_TO_HEAD_ROLE = {
  Infrastructure: 'Infrastructure Head',
  Operations: 'Operations Head',
  Loans: 'Loans Head',
  'IT Department': 'IT Head',
  Hr: 'Hr Head',
};

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const ChairmanComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ open: 0, underReview: 0, resolved: 0, avgResolutionDays: 0, slaCompliance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All Complaints');
  const [category, setCategory] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [dateFrom, setDateFrom] = useState('');
  const [viewComplaint, setViewComplaint] = useState(null);
  const [deptHeadComplaint, setDeptHeadComplaint] = useState(null);
  const [verifyAdminComplaint, setVerifyAdminComplaint] = useState(null);
  const [finalApprovalComplaint, setFinalApprovalComplaint] = useState(null);
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);

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

  const criticalCount = complaints.filter((c) => c.urgency === 'High' && c.status !== 'Resolved').length;
  const nextActionItem = complaints
    .filter((c) => c.urgency === 'High' && c.status !== 'Resolved')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];

  const categoryVolume = CATEGORIES.filter((c) => c !== 'All Categories')
    .map((cat) => ({
      category: cat,
      count: complaints.filter((c) => c.category === cat).length,
    }))
    .filter((row) => row.count > 0)
    .map((row) => ({ ...row, pct: Math.round((row.count / complaints.length) * 100) }))
    .sort((a, b) => b.count - a.count);

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
      <h1 className="admin-dashboard-title">Executive Oversight: Complaint Registry</h1>
      <p className="admin-page-subtitle">Governance view for organizational escalations and resolution tracking.</p>

      <div className="exec-stats-row">
        <div className="exec-stat-card exec-stat-card--critical">
          <div className="exec-stat-card-header">
            <span className="exec-stat-label exec-stat-label--critical">Critical Escalations</span>
          </div>
          <span className="exec-stat-value">{criticalCount}</span>
          {nextActionItem ? (
            <div className="exec-stat-footnote">
              <span className="exec-stat-footnote-label">NEXT ACTION REQUIRED</span>
              <span className="exec-stat-footnote-text">{nextActionItem.title}</span>
            </div>
          ) : (
            <span className="exec-stat-footnote-text">No open critical items.</span>
          )}
        </div>

        <div className="exec-stat-card exec-stat-card--warn">
          <div className="exec-stat-card-header">
            <span className="exec-stat-label exec-stat-label--warn">Under Review</span>
          </div>
          <span className="exec-stat-value">{stats.underReview}</span>
          <div className="admin-progress-track">
            <div
              className="admin-progress-fill admin-progress-fill--warn"
              style={{ width: `${complaints.length ? Math.round((stats.underReview / complaints.length) * 100) : 0}%` }}
            />
          </div>
          <span className="exec-stat-footnote-text">
            Avg {stats.avgResolutionDays} day{stats.avgResolutionDays === 1 ? '' : 's'} resolution time
          </span>
        </div>

        <div className="exec-stat-card exec-stat-card--ok">
          <div className="exec-stat-card-header">
            <span className="exec-stat-label exec-stat-label--ok">Total Resolved</span>
          </div>
          <span className="exec-stat-value">{stats.resolved}</span>
          <div className="admin-progress-track">
            <div
              className="admin-progress-fill"
              style={{ width: `${stats.slaCompliance}%` }}
            />
          </div>
          <span className="exec-stat-footnote-text">SLA compliance: {stats.slaCompliance}%</span>
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

        <span className="admin-filter-count">
          Showing {filtered.length === 0 ? 0 : pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length} results
        </span>

        <div className="filter-row-pagination">
          <button
            className="icon-btn icon-btn--sm"
            aria-label="Previous page"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </button>
          <button
            className="icon-btn icon-btn--sm"
            aria-label="Next page"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            ›
          </button>
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
              <th>Case ID</th>
              <th>Complainant</th>
              <th>Department</th>
              <th>Assigned To</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((c) => (
              <tr key={c.id}>
                <td><span className="ref-link">#{c.reference_id}</span></td>
                <td>
                  <div className="list-title-cell">
                    <span className="avatar-chip">{getInitials(c.submitter_name)}</span>
                    <div>
                      <div>{c.submitter_name || 'Unknown'}</div>
                      <div className="admin-recent-item-meta">Employee</div>
                    </div>
                  </div>
                </td>
                <td><span className="category-chip">{c.category}</span></td>
                <td>{CATEGORY_TO_HEAD_ROLE[c.category] || '—'}</td>
                <td>
                  <span className={`urgency-pill ${URGENCY_STYLES[c.urgency] || ''}`}>
                    {c.urgency}
                  </span>
                </td>
                <td>
                  <span className={`status-pill status--${c.status === 'Resolved' ? 'resolved' : c.status === 'Meeting Scheduled' ? 'meeting' : 'review'}`}>
                    {c.status.toUpperCase()}
                  </span>
                </td>
                <td className="action-cell">
                  <button
                    className="icon-btn"
                    aria-label="Actions"
                    onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                  >
                    <i className="fa-solid fa-ellipsis-vertical"></i>
                  </button>

                  {openMenuId === c.id && (
                    <>
                      <div className="action-menu-backdrop" onClick={() => setOpenMenuId(null)} />
                      <div className="action-menu">
                        <button
                          className="action-menu-item"
                          onClick={() => {
                            setViewComplaint(mapComplaint(c));
                            setOpenMenuId(null);
                          }}
                        >
                          <i className="fa-regular fa-file-lines"></i> View Employee Submission
                        </button>
                        <button
                          className="action-menu-item"
                          onClick={() => {
                            setDeptHeadComplaint(mapComplaint(c));
                            setOpenMenuId(null);
                          }}
                        >
                          <i className="fa-regular fa-id-badge"></i> Review Dept Head Action
                        </button>
                                                <button
                          className="action-menu-item"
                          onClick={() => {
                            setVerifyAdminComplaint(mapComplaint(c));
                            setOpenMenuId(null);
                          }}
                        >
                          <i className="fa-regular fa-square-check"></i> Verify Admin Status Update
                        </button>
                                                <button
                          className="action-menu-item"
                          onClick={() => {
                            setFinalApprovalComplaint(mapComplaint(c));
                            setOpenMenuId(null);
                          }}
                        >
                          <i className="fa-solid fa-stamp"></i> Final Approval Actions
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && <p className="table-empty-state">No complaints match this filter.</p>}

        
      </div>

      <div className="table-card">
        <h2 className="table-card-title">Complaint Volume by Category</h2>

        {categoryVolume.length === 0 && (
          <p className="table-empty-state">No complaints yet.</p>
        )}

        <div className="volume-list">
          {categoryVolume.map((row) => (
            <div className="volume-row" key={row.category}>
              <div className="volume-row-top">
                <span>{row.category}</span>
                <span>{row.pct}%</span>
              </div>
              <div className="admin-progress-track">
                <div className="admin-progress-fill admin-progress-fill--blue" style={{ width: `${row.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
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
        userRole="Super Admin"
        onUpdated={loadData}
      />
      <DeptHeadActionModal
        open={!!deptHeadComplaint}
        complaint={deptHeadComplaint}
        onClose={() => setDeptHeadComplaint(null)}
      />
      <VerifyAdminStatusModal
        open={!!verifyAdminComplaint}
        complaint={verifyAdminComplaint}
        onClose={() => setVerifyAdminComplaint(null)}
      />
      <FinalApprovalActionsModal
        open={!!finalApprovalComplaint}
        complaint={finalApprovalComplaint}
        onClose={() => setFinalApprovalComplaint(null)}
      />
    </main>
  );
};

export default ChairmanComplaints;