import React, { useState, useEffect, useRef } from 'react';
import { fetchAdminNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationApi';
import type { Notification } from '../types/notification';
import styles from '../styles/AdminStyles/NotificationDropdown.module.scss';

const NotificationDropdown: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Load notifications
  const loadNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Không thể tải thông báo');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and polling every 30 seconds
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.notificationId);
        setNotifications(prev =>
          prev.map(n =>
            n.notificationId === notification.notificationId
              ? { ...n, read: true }
              : n
          )
        );
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      await markAllNotificationsAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className={styles.notificationDropdown} ref={dropdownRef}>
      <button
        className={styles.notificationButton}
        onClick={() => setIsOpen(!isOpen)}
        title="Thông báo"
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          <div className={styles.dropdownHeader}>
            <h3>
              <i className="fas fa-bell"></i>
              Thông báo
            </h3>
            <button
              className={styles.markAllRead}
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              Đánh dấu tất cả đã đọc
            </button>
          </div>

          {isLoading ? (
            <div className={styles.loadingState}>
              <i className="fas fa-spinner fa-spin"></i>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <i className="fas fa-exclamation-circle"></i>
              <p>{error}</p>
              <button className={styles.retryButton} onClick={loadNotifications}>
                Thử lại
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className={styles.emptyState}>
              <i className="fas fa-bell-slash"></i>
              <p>Không có thông báo nào</p>
            </div>
          ) : (
            <>
              <div className={styles.notificationList}>
                {notifications.map((notification) => (
                  <div
                    key={notification.notificationId}
                    className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={styles.notificationIcon}>
                      <i className="fas fa-store"></i>
                    </div>
                    <div className={styles.notificationContent}>
                      <div className={styles.notificationHeader}>
                        <h4 className={styles.notificationTitle}>{notification.title}</h4>
                        <span className={styles.notificationTime}>
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className={styles.notificationDealer}>
                        <i className="fas fa-building"></i> {notification.dealerName}
                      </p>
                      <p className={styles.notificationMessage}>{notification.message}</p>
                    </div>
                    {!notification.read && <div className={styles.unreadDot}></div>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
