import React from 'react';

const Footer = ({ onLogout = () => {}, userName = 'User', userRole = '' }) => {
  return (
    <div className="sidebar-footer">
      <div className="sidebar-footer-user">
        <div className="sidebar-footer-avatar">{userName.charAt(0).toUpperCase()}</div>
        <div className="sidebar-footer-info">
          <span className="sidebar-footer-name">{userName}</span>
          <span className="sidebar-footer-role">{userRole}</span>
        </div>
      </div>
      <button className="sidebar-logout-icon-btn" onClick={onLogout} aria-label="Logout">
        <i className="fa-solid fa-right-from-bracket"></i>
      </button>
    </div>
  );
};

export default Footer;