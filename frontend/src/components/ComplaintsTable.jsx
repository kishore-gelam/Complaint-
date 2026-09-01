import React, { useState } from 'react';

const STATUS_STYLES = {
  'Under Review': 'status--review',
  'Meeting Scheduled': 'status--meeting',
  'Resolved': 'status--resolved',
};

const CATEGORIES = ['All Categories', 'Hr', 'IT Department', 'Operations', 'Infrastructure', 'Loans', 'Personal'];
const STATUSES = ['All Statuses', 'Under Review', 'Meeting Scheduled', 'Resolved'];
const PAGE_SIZE = 10;
const DEPARTMENT_HEAD_ROLES = ['Infrastructure Head', 'Operations Head', 'Loans Head', 'IT Head', 'Hr Head'];

const ComplaintsTable = ({
  complaints,
  totalCount,
  onAddNew,
  onView,
  statusFilter,
  onStatusFilterChange,
  onStatusChange,
  userRole,
  showAddButton,
}) => {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [page, setPage] = useState(1);

  const canEditStatus = userRole === 'Admin';
  const isDepartmentHead = DEPARTMENT_HEAD_ROLES.includes(userRole);

  const status = statusFilter;

  const filtered = complaints.filter((c) => {
    const matchesCategory = category === 'All Categories' || c.category === category;
    const matchesStatus = status === 'All Statuses' || c.status === status;
    return matchesCategory && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const maxButtons = 3;
  const pageNumbers = [];
  for (let i = 1; i <= Math.min(maxButtons, totalPages); i++) {
    pageNumbers.push(i);
  }

  return (
    <section className="complaints-panel">
           <div className="complaints-toolbar">
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            onStatusFilterChange(e.target.value);
            setPage(1);
          }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="table-card">
        <div className="table-card-header">
          <h2 className="table-card-title">Recent Activity</h2>
          {showAddButton && (
            <button className="btn btn--primary complaints-add-btn" onClick={onAddNew}>
              + Add New Complaint
            </button>
          )}
        </div>

        <table className="complaints-table">
          <thead>
            <tr>
              <th>Submission Date</th>
              <th>Reference ID</th>
              <th>Subject</th>
              <th>Category</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((c) => (
              <tr key={c.id}>
                <td>{c.date}</td>
                <td><a href={`#${c.id}`} className="ref-link">#{c.id}</a></td>
                <td>{c.subject}</td>
                <td><span className="category-chip">{c.category}</span></td>
                <td>
                  {canEditStatus ? (
                    <select
                      className={`status-pill-select ${STATUS_STYLES[c.status] || ''}`}
                      value={c.status}
                      onChange={(e) => onStatusChange && onStatusChange(c.dbId, e.target.value)}
                    >
                      <option value="Under Review">UNDER REVIEW</option>
                      <option value="Meeting Scheduled">MEETING SCHEDULED</option>
                      <option value="Resolved">RESOLVED</option>
                    </select>
                  ) : (
                    <span className={`status-pill ${STATUS_STYLES[c.status] || ''}`}>
                      {c.status.toUpperCase()}
                    </span>
                  )}
                </td>
                <td>
                  {isDepartmentHead ? (
                    <button className="btn btn--outline btn--small" onClick={() => onView && onView(c)}>
                      Manage
                    </button>
                  ) : (
                    <button className="icon-btn" aria-label="View" onClick={() => onView && onView(c)}>
                      👁
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="table-empty-state">No complaints match this filter.</p>
        )}

        {filtered.length > 0 && (
          <div className="table-footer">
            <span>
              Showing {pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length} submissions
            </span>
            <div className="pagination">
              <button disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
              {pageNumbers.map((p) => (
                <button key={p} className={safePage === p ? 'is-active' : ''} onClick={() => setPage(p)}>{p}</button>
              ))}
              {totalPages > maxButtons && (
                <>
                  <span className="pagination-ellipsis">…</span>
                  <button className={safePage === totalPages ? 'is-active' : ''} onClick={() => setPage(totalPages)}>
                    {totalPages}
                  </button>
                </>
              )}
              <button disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ComplaintsTable;