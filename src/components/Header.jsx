import React from 'react';

const ROLE_DISPLAY_LABELS = {
  'Super Admin': 'Chairman',
};

const Header = ({
  title = 'Complaint Box User Portal',
  userName = 'ramesh',
  userRole = 'Employee',
  avatarUrl = '',
}) => {
  return (
    <header className="app-header">
      <h1 className="app-header-title">{title}</h1>

      <div className="app-header-search">
        <span className="app-header-search-icon">🔍</span>
        <input type="text" placeholder="Quick search..." />
      </div>

      <div className="app-header-actions">
        <button className="icon-btn" aria-label="Notifications">🔔</button>
        <button className="icon-btn" aria-label="Settings">⚙️</button>

        <div className="app-header-user">
          <div className="app-header-user-info">
            <span className="app-header-user-name">{userName}</span>
            <span className="app-header-user-role">
              {ROLE_DISPLAY_LABELS[userRole] || userRole}
            </span>
          </div>
          <div className="app-header-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} />
            ) : (
              <span>{userName.charAt(0)}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;