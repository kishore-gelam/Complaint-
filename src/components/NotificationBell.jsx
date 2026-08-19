import React, { useState, useEffect, useRef } from 'react';
import { getRecentNotifications } from '../api/complaints';

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const NotificationBell = ({ userId, onNotificationClick }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastSeen, setLastSeen] = useState(0);
  const wrapRef = useRef(null);

  const storageKey = `notif_last_seen_${userId}`;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    setLastSeen(stored ? parseInt(stored, 10) : 0);
    getRecentNotifications().then(setNotifications).catch(() => setNotifications([]));

    const interval = setInterval(() => {
      getRecentNotifications().then(setNotifications).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

    const closeAndMarkRead = () => {
    const now = Date.now();
    localStorage.setItem(storageKey, String(now));
    setLastSeen(now);
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen((wasOpen) => {
          if (wasOpen) {
            const now = Date.now();
            localStorage.setItem(storageKey, String(now));
            setLastSeen(now);
          }
          return false;
        });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = notifications.filter((n) => new Date(n.created_at).getTime() > lastSeen).length;

  const toggleOpen = () => {
    if (!open) {
      setLoading(true);
      getRecentNotifications()
        .then(setNotifications)
        .catch(() => setNotifications([]))
        .finally(() => setLoading(false));
    } else {
      const now = Date.now();
      localStorage.setItem(storageKey, String(now));
      setLastSeen(now);
    }
    setOpen(!open);
  };

  return (
    <div className="notif-bell-wrap" ref={wrapRef}>
      <button className="icon-btn notif-bell-btn" aria-label="Notifications" onClick={toggleOpen}>
        🔔
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">Notifications</div>

          {loading && <p className="table-empty-state" style={{ padding: 16 }}>Loading…</p>}

          {!loading && notifications.length === 0 && (
            <p className="table-empty-state" style={{ padding: 16 }}>No recent activity.</p>
          )}

          {!loading && notifications.length > 0 && (
            <div className="notif-list">
                           {notifications.map((n) => (
                <div
                  className="notif-item notif-item--clickable"
                  key={n.id}
                  onClick={() => {
                    closeAndMarkRead();
                    onNotificationClick && onNotificationClick(n);
                  }}
                >
                  <p className="notif-item-title">
                    {n.reference_id} — {n.event_title}
                  </p>
                  <p className="notif-item-sub">{n.complaint_title}</p>
                  {n.note && <p className="notif-item-note">{n.note}</p>}
                  <p className="notif-item-time">{timeAgo(n.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;