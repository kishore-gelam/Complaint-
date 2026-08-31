import React from 'react';

const Footer = ({ onLogout = () => {} }) => {
  return (
    <div className="sidebar-footer">
      <div className="sidebar-footer-avatar">👤</div>
      <button className="sidebar-logout-btn" onClick={onLogout}>
        <span className="sidebar-logout-icon"><i class="fa-solid fa-right-from-bracket"></i></span>
        Logout
      </button>
    </div>
  );
};

export default Footer;