import React, { useState, useEffect } from 'react';
import StatsCards from './StatsCards';
import ComplaintsTable from './ComplaintsTable';
import SubmitComplaintModal from './SubmitComplaintModal';
import ComplaintDetailModal from './ComplaintDetailModal';
import ComplaintResolutionModal from './ComplaintResolutionModal';
import { getComplaints, getComplaintStats, createComplaint, updateComplaintStatus, uploadAttachment } from '../api/complaints';

const EMPTY_STATS = { open: 0, underReview: 0, meetingsScheduled: 0, resolved: 0 };

const Dashboard = ({ userRole }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewComplaint, setViewComplaint] = useState(null);

  const canAddComplaint = userRole === 'Employee';

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [complaintsData, statsData] = await Promise.all([
        getComplaints(),
        getComplaintStats(),
      ]);

      const mapped = complaintsData.map((c) => ({
        dbId: c.id,
        id: c.reference_id,
        date: new Date(c.created_at).toLocaleDateString('en-US', {
          month: 'short', day: '2-digit', year: 'numeric',
        }),
        subject: c.title,
        category: c.category,
        status: c.status,
        current_stage: c.current_stage,
        submitter_name: c.submitter_name,
        description: c.description,
      }));

      setComplaints(mapped);
      setStats(statsData);
    } catch (err) {
      setError('Could not load complaints. Is the backend running on port 8000?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (newComplaint) => {
    try {
      const created = await createComplaint({
        title: newComplaint.title,
        category: newComplaint.category,
        urgency: newComplaint.urgency,
        description: newComplaint.description,
      });

      if (newComplaint.files && newComplaint.files.length > 0) {
        for (const file of newComplaint.files) {
          await uploadAttachment(created.id, file);
        }
      }

      setModalOpen(false);
      await loadData();
    } catch (err) {
      alert('Failed to submit complaint. Please try again.');
    }
  };

  const handleStatusChange = async (dbId, newStatus) => {
    try {
      await updateComplaintStatus(dbId, newStatus);
      await loadData();
    } catch (err) {
      alert('Failed to update status. Please try again.');
    }
  };

  if (loading) {
    return <main className="dashboard"><p>Loading complaints…</p></main>;
  }

  if (error) {
    return (
      <main className="dashboard">
        <p className="table-empty-state">{error}</p>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <StatsCards stats={stats} onFilterClick={setStatusFilter} activeFilter={statusFilter} />

      <ComplaintsTable
        complaints={complaints}
        totalCount={complaints.length}
        onAddNew={canAddComplaint ? () => setModalOpen(true) : undefined}
        showAddButton={canAddComplaint}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onStatusChange={handleStatusChange}
        onView={(complaint) => setViewComplaint(complaint)}
        userRole={userRole}
      />

      {canAddComplaint && (
        <SubmitComplaintModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

{['Infrastructure Head', 'Operations Head', 'Loans Head', 'IT Head', 'Hr Head'].includes(userRole) ? (        <ComplaintResolutionModal
          open={!!viewComplaint}
          complaint={viewComplaint}
          onClose={() => setViewComplaint(null)}
          onUpdated={loadData}
        />
      ) : (
        <ComplaintDetailModal
          open={!!viewComplaint}
          complaint={viewComplaint}
          onClose={() => setViewComplaint(null)}
          userRole={userRole}
        />
      )}
    </main>
  );
};

export default Dashboard;