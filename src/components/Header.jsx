import React, { useState, useRef, useEffect } from 'react';
import NotificationBell from './NotificationBell';

const ROLE_DISPLAY_LABELS = {
  'Super Admin': 'Chairman',
};

const Header = ({
  title = 'Complaint Box User Portal',
  userName = 'ramesh',
  userRole = 'Employee',
  avatarUrl = '',
  searchQuery = '',
  onSearchChange = () => {},
  searchPlaceholder = 'Quick search...',
  userId,
  onNotificationClick,
  onLogout = () => {},
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <header className="app-header">
      <h1 className="app-header-title">{title}</h1>

      <div className="app-header-search">
        <span className="app-header-search-icon">🔍</span>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

            <div className="app-header-actions">
        <NotificationBell userId={userId} onNotificationClick={onNotificationClick} />
        <button className="icon-btn" aria-label="Settings">⚙️</button>

                <div className="app-header-user" ref={menuRef} style={{ position: 'relative' }}>
          <div className="app-header-user-info">
            <span className="app-header-user-name">{userName}</span>
            <span className="app-header-user-role">
              {ROLE_DISPLAY_LABELS[userRole] || userRole}
            </span>
          </div>
          <div
            className="app-header-avatar"
            onClick={() => setMenuOpen((v) => !v)}
            style={{ cursor: 'pointer' }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} />
            ) : (
              <span>{userName.charAt(0)}</span>
            )}
          </div>

          {menuOpen && (
            <div className="user-menu-dropdown">
              <div className="user-menu-info">
                <span className="user-menu-name">{userName}</span>
                <span className="user-menu-role">{ROLE_DISPLAY_LABELS[userRole] || userRole}</span>
              </div>
              <button className="user-menu-item" onClick={onLogout}>
                <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;