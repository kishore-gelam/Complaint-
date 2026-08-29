import React from 'react';

const StatsCards = ({ stats, onFilterClick, activeFilter }) => {
  const cards = [
    { key: 'open', label: 'Open Reports', value: stats.open, icon: 'fa-regular fa-folder-open', filterValue: 'All Statuses' },
    { key: 'review', label: 'Under Review', value: stats.underReview, icon: 'fa-regular fa-pen-to-square', filterValue: 'Under Review' },
    { key: 'meetings', label: 'Meetings\nScheduled', value: stats.meetingsScheduled, icon: 'fa-regular fa-calendar', filterValue: 'Meeting Scheduled' },
    { key: 'resolved', label: 'Resolved\nReports', value: stats.resolved, icon: 'fa-solid fa-circle-check', filterValue: 'Resolved' },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card) => {
        const isActive = activeFilter === card.filterValue;
        return (
          <div
            key={card.key}
            className={`stat-card ${isActive ? 'stat-card--primary' : 'stat-card--light'}`}
            onClick={() => onFilterClick(card.filterValue)}
            role="button"
            tabIndex={0}
          >
            <div className="stat-card-text">
              <span className="stat-card-label">{card.label}</span>
              <span className="stat-card-value">{card.value}</span>
            </div>
            <div className="stat-card-icon">
              <i className={card.icon}></i>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;