import React, { useEffect } from 'react';
import '../styles/SuccessNotification.scss';

interface SuccessNotificationProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  type?: 'success' | 'error' | 'warning' | 'info';
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  message,
  isVisible,
  onClose,
  duration = 5000,
  type = 'success'
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
        return 'fas fa-times-circle';
      case 'warning':
        return 'fas fa-exclamation-triangle';
      case 'info':
        return 'fas fa-info-circle';
      default:
        return 'fas fa-check-circle';
    }
  };

  return (
    <div className={`success-notification ${type} ${isVisible ? 'show' : ''}`}>
      <div className="notification-content">
        <div className={`notification-icon ${type}`}>
          <i className={getIcon()}></i>
        </div>
        <div className="notification-message">{message}</div>
        <button className="notification-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      <div className="notification-progress">
        <div 
          className="progress-bar" 
          style={{ animationDuration: `${duration}ms` }}
        ></div>
      </div>
    </div>
  );
};

export default SuccessNotification;

