import React from 'react';
import type { TestDrive } from '../../services/testDriveApi';
import styles from './TestDriveDetailModal.module.scss';

interface TestDriveDetailModalProps {
  testDrive: TestDrive;
  onClose: () => void;
  onEdit?: () => void;
}

const formatDateTime = (datetime: string) => {
  try {
    const date = new Date(datetime);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return datetime;
  }
};

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'PENDING':
      return { label: 'Chờ xác nhận', icon: 'fa-clock', color: '#ff9800' };
    case 'CONFIRMED':
      return { label: 'Đã xác nhận', icon: 'fa-check-circle', color: '#4caf50' };
    case 'COMPLETED':
      return { label: 'Hoàn thành', icon: 'fa-flag-checkered', color: '#2196f3' };
    case 'CANCELLED':
      return { label: 'Đã hủy', icon: 'fa-times-circle', color: '#f44336' };
   
    default:
      return { label: status, icon: 'fa-info-circle', color: '#757575' };
  }
};

const TestDriveDetailModal: React.FC<TestDriveDetailModalProps> = ({
  testDrive,
  onClose,
  onEdit
}) => {
  const statusInfo = getStatusInfo(testDrive.status);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <i className="fas fa-car-side"></i>
            <div>
              <h2>Chi tiết lịch lái thử</h2>
             
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Status Badge */}
        <div className={styles.statusSection}>
          <div 
            className={styles.statusBadge}
            style={{ backgroundColor: statusInfo.color }}
          >
            <i className={`fas ${statusInfo.icon}`}></i>
            <span>{statusInfo.label}</span>
          </div>
        </div>

        {/* Content */}
        <div className={styles.modalBody}>
          {/* Summary Info - 2 rows layout */}
          <div className={styles.infoSection}>
            <div className={styles.sectionHeader}>
              <i className="fas fa-info-circle"></i>
              <h3>Thông tin lịch hẹn</h3>
            </div>
            <div className={styles.summaryGrid}>
              <div className={styles.infoItem}>
                <label><i className="fas fa-hashtag"></i> Mã lịch hẹn</label>
                <p>#{testDrive.testdriveId}</p>
              </div>
              <div className={styles.infoItem}>
                <label><i className="fas fa-user"></i> Khách hàng</label>
                <p>{testDrive.customerName}</p>
                <span className={styles.subtext}>ID: {testDrive.customerId}</span>
              </div>
              <div className={styles.infoItem}>
                <label><i className="fas fa-car"></i> Xe điện</label>
                <p>{testDrive.vehicleModel}</p>
                <span className={styles.subtext}>ID: {testDrive.vehicleId}</span>
              </div>
              <div className={styles.infoItem}>
                <label><i className="fas fa-store"></i> Đại lý</label>
                <p>{testDrive.dealerName}</p>
                <span className={styles.subtext}>ID: {testDrive.dealerId}</span>
              </div>
            </div>
          </div>

          {/* Schedule Info */}
          <div className={styles.infoSection}>
            <div className={styles.sectionHeader}>
              <i className="fas fa-calendar-alt"></i>
              <h3>Lịch hẹn</h3>
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Thời gian đăng ký</label>
                <p>{formatDateTime(testDrive.scheduleDatetime)}</p>
              </div>
              {testDrive.completedAt && (
                <div className={styles.infoItem}>
                  <label>Hoàn thành lúc</label>
                  <p>{formatDateTime(testDrive.completedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Cancel Reason */}
          {testDrive.cancelReason && (
            <div className={styles.infoSection}>
              <div className={styles.sectionHeader}>
                <i className="fas fa-exclamation-circle"></i>
                <h3>Lý do hủy</h3>
              </div>
              <div className={styles.cancelReason}>
                <p>{testDrive.cancelReason}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          {onEdit && testDrive.status !== 'COMPLETED' && testDrive.status !== 'CANCELLED' && (
            <button className={styles.editButton} onClick={onEdit}>
              <i className="fas fa-edit"></i>
              Chỉnh sửa
            </button>
          )}
          <button className={styles.closeFooterButton} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestDriveDetailModal;
