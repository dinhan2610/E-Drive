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
              <p className={styles.testDriveId}>ID: #{testDrive.testdriveId}</p>
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
          {/* Vehicle Info */}
          <div className={styles.infoSection}>
            <div className={styles.sectionHeader}>
              <i className="fas fa-car"></i>
              <h3>Thông tin xe</h3>
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Mã xe</label>
                <p>#{testDrive.vehicleId}</p>
              </div>
              <div className={styles.infoItem}>
                <label>Model xe</label>
                <p>{testDrive.vehicleModel}</p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className={styles.infoSection}>
            <div className={styles.sectionHeader}>
              <i className="fas fa-user"></i>
              <h3>Thông tin khách hàng</h3>
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Mã khách hàng</label>
                <p>#{testDrive.customerId}</p>
              </div>
              <div className={styles.infoItem}>
                <label>Tên khách hàng</label>
                <p>{testDrive.customerName}</p>
              </div>
            </div>
          </div>

          {/* Dealer Info */}
          <div className={styles.infoSection}>
            <div className={styles.sectionHeader}>
              <i className="fas fa-store"></i>
              <h3>Thông tin đại lý</h3>
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Mã đại lý</label>
                <p>#{testDrive.dealerId}</p>
              </div>
              <div className={styles.infoItem}>
                <label>Tên đại lý</label>
                <p>{testDrive.dealerName}</p>
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
                <label>Thời gian lái thử</label>
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
