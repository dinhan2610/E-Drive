import React, { useState, useEffect, useRef } from 'react';
import { 
  fetchAllNotifications, 
  fetchAdminNotifications, 
  fetchDealerManagerNotifications, 
  fetchDealerStaffNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../services/notificationApi';
import { getCurrentUserRole } from '../utils/roleUtils';
import { getProfile } from '../services/profileApi';
import type { Notification } from '../types/notification';
import styles from '../styles/AdminStyles/NotificationDropdown.module.scss';

interface NotificationDropdownProps {
  direction?: 'up' | 'down';
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ direction = 'down' }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDealerId, setCurrentDealerId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Load dealerId once on mount for dealer/staff roles
  useEffect(() => {
    const loadDealerId = async () => {
      const userRole = getCurrentUserRole();
      if (userRole !== 'admin') {
        try {
          const profile = await getProfile();
          setCurrentDealerId(profile.dealerId);
        } catch (err) {
          console.error('Failed to load dealerId:', err);
        }
      }
    };
    
    loadDealerId();
  }, []);

  // Load notifications based on user role
  const loadNotifications = async (silent = false) => {
    if (!silent && notifications.length === 0) {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      const userRole = getCurrentUserRole();
      let data: Notification[];
      
      if (userRole === 'admin') {
        // Admin: fetch admin-specific notifications
        data = await fetchAdminNotifications();
      } else if (userRole === 'dealer') {
        // Dealer Manager: fetch dealer manager notifications
        if (!currentDealerId) {
          throw new Error('Không tìm thấy dealer ID');
        }
        data = await fetchDealerManagerNotifications(currentDealerId);
      } else if (userRole === 'staff') {
        // Dealer Staff: fetch dealer staff notifications
        if (!currentDealerId) {
          throw new Error('Không tìm thấy dealer ID');
        }
        data = await fetchDealerStaffNotifications(currentDealerId);
      } else {
        // Fallback: use /all endpoint for any other case
        data = await fetchAllNotifications();
      }
      
      // Sort notifications by createdAt descending (newest first)
      const sortedData = data.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setNotifications(sortedData);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      if (err.response?.status === 403) {
        setError('Không có quyền truy cập thông báo');
      } else {
        setError('Không thể tải thông báo');
      }
    } finally {
      if (!silent && notifications.length === 0) {
        setIsLoading(false);
      }
    }
  };

  // Initial load and polling every 5 seconds for real-time updates
  useEffect(() => {
    // Chỉ load notifications khi đã có dealerId (cho manager) hoặc là admin
    const userRole = getCurrentUserRole();
    if (userRole === 'admin' || currentDealerId !== null) {
      loadNotifications(); // Lần đầu tiên hiển thị loading
      
      // Polling mỗi 5 giây để cập nhật thông báo mới (silent mode)
      const interval = setInterval(() => loadNotifications(true), 5000);
      
      // Listen for custom events to reload notifications
      const handleReloadNotifications = () => {
        loadNotifications(true); // Silent reload
      };
      
      window.addEventListener('reloadNotifications', handleReloadNotifications);
      window.addEventListener('testDriveCreated', handleReloadNotifications);
      window.addEventListener('orderCreated', handleReloadNotifications);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('reloadNotifications', handleReloadNotifications);
        window.removeEventListener('testDriveCreated', handleReloadNotifications);
        window.removeEventListener('orderCreated', handleReloadNotifications);
      };
    }
  }, [currentDealerId]); // Chạy lại khi currentDealerId thay đổi

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
    if (unreadCount === 0 || isMarkingAllRead) return;

    setIsMarkingAllRead(true);
    try {
      await markAllNotificationsAsRead();
      // Reload notifications để cập nhật trạng thái từ server
      await loadNotifications(true);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      // Fallback: cập nhật local state nếu API thành công nhưng reload lỗi
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } finally {
      setIsMarkingAllRead(false);
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
        <div className={direction === 'up' ? styles.dropdownMenuUp : styles.dropdownMenu}>
          <div className={styles.dropdownHeader}>
            <h3>
              <i className="fas fa-bell"></i>
              Thông báo
            </h3>
            <button
              className={styles.markAllRead}
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0 || isMarkingAllRead}
            >
              {isMarkingAllRead ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Đang xử lý...
                </>
              ) : (
                'Đánh dấu tất cả đã đọc'
              )}
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
              <button className={styles.retryButton} onClick={() => loadNotifications()}>
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
