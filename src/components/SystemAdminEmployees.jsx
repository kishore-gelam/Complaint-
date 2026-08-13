import React, { useState, useEffect } from 'react';
import { listEmployees, createEmployee, updateEmployee } from '../api/employees';

const ROLE_OPTIONS = [
  'Employee',
  'Infrastructure Head',
  'Operations Head',
  'Loans Head',
  'IT Head',
  'Hr Head',
  'Admin',
  'HR',
  'Super Admin',
  'System Admin',
];

const FIELD_KEY_MAP = { employee_name: 'name', employee_email: 'email', employee_password: 'password' };

const SystemAdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    employee_code: '',
    name: '',
    email: '',
    password: '',
    role: 'Employee',
    department: '',
  });

  const loadEmployees = (targetPage = page) => {
    setLoading(true);
    listEmployees(targetPage, PAGE_SIZE)
      .then((res) => {
        setEmployees(res.items);
        setTotal(res.total);
        setPage(targetPage);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleChange = (e) => {
    const key = FIELD_KEY_MAP[e.target.name] || e.target.name;
    setForm({ ...form, [key]: e.target.value });
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({ employee_code: '', name: '', email: '', password: '', role: 'Employee', department: '' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (emp) => {
    setEditingId(emp.id);
    setForm({
      employee_code: emp.employee_code || '',
      name: emp.name,
      email: emp.email,
      password: '',
      role: emp.role,
      department: emp.department || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        const updates = {
          employee_code: form.employee_code,
          name: form.name,
          email: form.email,
          role: form.role,
          department: form.department || null,
        };
        if (form.password) updates.password = form.password;
        await updateEmployee(editingId, updates);
        setShowModal(false);
        loadEmployees(page);
      } else {
        await createEmployee(form);
        setShowModal(false);
        loadEmployees(1);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    return isNaN(d) ? '—' : d.toLocaleDateString();
  };

  return (
    <div className="system-admin-employees">
      <div className="page-header-row">
        <h2>Employees</h2>
        <button className="btn-primary" onClick={openAddModal}>
          + Add Employee
        </button>
      </div>

      {error && !showModal && <div className="form-error">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="employees-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td className="employee-id-cell">{emp.employee_code || '—'}</td>
                <td>{emp.name}</td>
                <td>{emp.email}</td>
                <td>
                  <span className={`role-badge role-${emp.role.replace(/\s+/g, '-').toLowerCase()}`}>
                    {emp.role}
                  </span>
                </td>
                <td>{emp.department || '—'}</td>
                <td>{formatDate(emp.created_at)}</td>
                <td>
                  <button className="btn-link" onClick={() => openEditModal(emp)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && total > PAGE_SIZE && (
        <div className="pagination-bar">
          <button
            className="btn-secondary"
            disabled={page === 1}
            onClick={() => loadEmployees(page - 1)}
          >
            Prev
          </button>
          <span className="pagination-info">
            Page {page} of {Math.ceil(total / PAGE_SIZE)}
          </span>
          <button
            className="btn-secondary"
            disabled={page >= Math.ceil(total / PAGE_SIZE)}
            onClick={() => loadEmployees(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? 'Edit Employee' : 'Add Employee'}</h3>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleSubmit} autoComplete="off">
              <label>Employee ID</label>
              <input
                name="employee_code"
                autoComplete="off"
                value={form.employee_code}
                onChange={handleChange}
                placeholder="e.g. GK0801"
                required
              />

              <label>Name</label>
              <input
                name="employee_name"
                autoComplete="off"
                value={form.name}
                onChange={handleChange}
                required
              />

              <label>Email</label>
              <input
                type="email"
                name="employee_email"
                autoComplete="off"
                value={form.email}
                onChange={handleChange}
                required
              />

              <label>Password {editingId && <span className="field-hint">(leave blank to keep unchanged)</span>}</label>
              <input
                type="password"
                name="employee_password"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                required={!editingId}
              />

              <label>Department Name</label>
              <input
                name="department"
                autoComplete="off"
                value={form.department}
                onChange={handleChange}
                placeholder="e.g. Infrastructure, Operations, Loans"
              />

              <label>Role</label>
              <select name="role" value={form.role} onChange={handleChange}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemAdminEmployees;