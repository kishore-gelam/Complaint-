import React, { useState, useRef } from 'react';
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
  onMenuClick = () => {},
}) => {
  const searchInputRef = useRef(null);

  return (
    <header className="app-header">
      <button
        className="app-header-hamburger"
        aria-label="Open menu"
        onClick={onMenuClick}
      >
        ☰
      </button>
      <h1 className="app-header-title">{title}</h1>

            <div className="app-header-search">
        <span
          className="app-header-search-icon"
          onClick={() => searchInputRef.current && searchInputRef.current.focus()}
          style={{ cursor: 'pointer' }}
        >
          <i class="fa-solid fa-magnifying-glass"></i>

        </span>
        <input
          ref={searchInputRef}
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

            <div className="app-header-actions">
        <NotificationBell userId={userId} onNotificationClick={onNotificationClick} />
        

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