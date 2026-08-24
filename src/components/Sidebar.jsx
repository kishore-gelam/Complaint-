import React from 'react';
import Footer from './Footer';

const EMPLOYEE_NAV_ITEMS = [
  { key: 'complaints', label: 'Complaints', icon: 'fa-solid fa-triangle-exclamation' },
  { key: 'meetings', label: 'Meetings', icon: 'fa-solid fa-users' },
];
const SYSTEM_ADMIN_NAV_ITEMS = [
  { key: 'employees', label: 'Employees', icon: 'fa-solid fa-user-gear' },
];
const getAdminNavItems = (userRole) => [
  {
     key: 'dashboard',
    label: 'Dashboard',
    icon: 'fa-solid fa-grid-2',
  },
  { key: 'complaints', label: 'All Complaints', icon: 'fa-solid fa-clipboard-list' },
  { key: 'meetings', label: 'Meetings', icon: 'fa-solid fa-calendar' },
];

const Sidebar = ({ active = 'complaints', onNavigate = () => {}, onLogout = () => {}, userRole, mobileOpen = false, onClose =() =>{} }) => {
 const isAdmin = ['Admin', 'Super Admin'].includes(userRole);
  const isSystemAdmin = userRole === 'System Admin';
  const navItems = isSystemAdmin
    ? SYSTEM_ADMIN_NAV_ITEMS
    : isAdmin
      ? getAdminNavItems(userRole)
      : EMPLOYEE_NAV_ITEMS;
   const handleNavClick = (key) => {   
    onNavigate(key);
    onClose();
  };
    return (
    <>
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      <aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">📋</span>
          <span className="sidebar-brand-text">
            Complaint Box
            {(isAdmin || isSystemAdmin) && (
              <span className="sidebar-brand-subtext">
                {userRole === 'Super Admin'
                  ? "Chairman's Dashboard"
                  : isSystemAdmin
                    ? 'System Admin'
                    : 'Admin Portal'}
              </span>
            )}
          </span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`sidebar-nav-item ${active === item.key ? 'is-active' : ''}`}
              onClick={() => handleNavClick(item.key)}
            >
              <span className="sidebar-nav-icon">
                <i className={item.icon}></i>
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <Footer onLogout={onLogout} />
      </aside>
    </>
  );
};

export default Sidebar;