import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MeetingsPage from './components/meetings/MeetingsPage';
import LoginPage from './components/LoginPage';
import { getSession, clearSession } from './api/auth';
import AdminDashboard from './components/AdminDashboard';
import AdminComplaints from './components/AdminComplaints';
import AdminMeetingsPage from './components/AdminMeetingsPage';
import ChairmanDashboard from './components/ChairmanDashboard';
import ChairmanMeetings from './components/ChairmanMeetings';
import ChairmanComplaints from './components/ChairmanComplaints';
import './App.css';
import SystemAdminEmployees from './components/SystemAdminEmployees';
import './components/SystemAdminEmployees.css';

const getPageTitle = (nav, role) => {
  const isAdmin = ['Admin', 'Super Admin'].includes(role);
  const brand = role === 'Super Admin' ? "Complaint Box Chairman's Dashboard" : 'Complaint Box Admin';

  if (nav === 'dashboard') return brand;
  if (nav === 'complaints') return isAdmin ? brand : 'Complaint Box User Portal';
  if (nav === 'meetings') return isAdmin ? brand : 'Complaint Box User Portal';

  return '';
};
const getSearchPlaceholder = (nav) => {
  if (nav === 'employees') return 'Search employees…';
  if (nav === 'meetings') return 'Search meetings…';
  if (nav === 'complaints' || nav === 'dashboard') return 'Search complaints…';
  return 'Quick search...';
};

const App = () => {
  const [activeNav, setActiveNav] = useState('complaints');
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const[searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const session = getSession();
    if (session) setCurrentUser(session.user);
    setCheckingSession(false);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'System Admin') {
      setActiveNav('employees');
    } else if (['Admin', 'Super Admin'].includes(currentUser.role)) {
      setActiveNav('dashboard');
    }
  }, [currentUser]);
    useEffect(() => {
    setSearchQuery('');
  }, [activeNav]);

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
  };

  if (checkingSession) return null; // avoid a login-page flash on refresh

  if (!currentUser) {
    return <LoginPage onLoginSuccess={setCurrentUser} />;
  }

  const isAdmin = ['Admin', 'Super Admin'].includes(currentUser.role);

  return (
    <div className="app-shell">
      <Sidebar active={activeNav} onNavigate={setActiveNav} onLogout={handleLogout} userRole={currentUser.role} />

      <div className="app-body">
                        <Header
  title={getPageTitle(activeNav, currentUser.role)}
  userName={currentUser.name}
  userRole={currentUser.role}
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  searchPlaceholder={getSearchPlaceholder(activeNav)}
  userId={currentUser.id}
/>

    {activeNav === 'dashboard' && (
  currentUser.role === 'Super Admin'
    ? <ChairmanDashboard onViewAllComplaints={() => setActiveNav('complaints')} />
    : <AdminDashboard userRole={currentUser.role} onViewAllComplaints={() => setActiveNav('complaints')} />
)}
               {activeNav === 'complaints' && (
  currentUser.role === 'Super Admin'
    ? <ChairmanComplaints searchQuery={searchQuery} />
    : isAdmin
      ? <AdminComplaints userRole={currentUser.role} searchQuery={searchQuery} />
      : <Dashboard userRole={currentUser.role} searchQuery={searchQuery} />
)}
      {activeNav === 'meetings' && (
  currentUser.role === 'Super Admin'
    ? <ChairmanMeetings />
    : ['Admin'].includes(currentUser.role)
      ? <AdminMeetingsPage />
      : <MeetingsPage />
)}

               {activeNav === 'employees' && currentUser.role === 'System Admin' && (
          <SystemAdminEmployees searchQuery={searchQuery} />
        )}
      </div>
    </div>
  );
};

export default App;