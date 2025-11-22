import React from 'react';
import type { TrackingItem } from '../../types/tracking';
import styles from '../../styles/OrderStyles/OrderDetailModal.module.scss';

interface OrderDetailModalProps {
  order: TrackingItem;
  onClose: () => void;
  onEdit: () => void;
}

const getStatusLabel = (status: string) => {
  switch(status) {
    case 'CONFIRMED': return 'Đã xác nhận';
    case 'ALLOCATED': return 'Đã phân bổ xe';
    case 'IN_TRANSIT': return 'Đang vận chuyển';
    case 'AT_DEALER': return 'Đã về đại lý';
    case 'SCHEDULED': return 'Đã hẹn giao';
    case 'DELIVERED': return 'Đã giao xe';
    case 'ON_HOLD': return 'Tạm dừng';
    case 'CANCELLED': return 'Đã hủy';
    default: return status;
  }
};

const formatDate = (datetime: string) => {
  try {
    const date = new Date(datetime);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return datetime;
  }
};

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose, onEdit }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <i className="fas fa-file-invoice"></i>
            <div>
              <h2>Chi tiết đơn hàng</h2>
              <p className={styles.orderCode}>{order.code}</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Status Badge */}
          <div className={styles.statusSection}>
            <span className={`${styles.statusBadge} ${styles[order.status.toLowerCase()]}`}>
              {getStatusLabel(order.status)}
            </span>
          </div>

          {/* Customer Info */}
          <div className={styles.section}>
            <h3>
              <i className="fas fa-user"></i>
              Thông tin khách hàng
            </h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Họ tên:</span>
                <span className={styles.value}>{order.customerName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Số điện thoại:</span>
                <span className={styles.value}>{order.customerPhoneMasked}</span>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className={styles.section}>
            <h3>
              <i className="fas fa-car"></i>
              Thông tin xe
            </h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Model:</span>
                <span className={styles.value}>{order.vehicle.model}</span>
              </div>
              {order.vehicle.variant && (
                <div className={styles.infoItem}>
                  <span className={styles.label}>Phiên bản:</span>
                  <span className={styles.value}>{order.vehicle.variant}</span>
                </div>
              )}
              <div className={styles.infoItem}>
                <span className={styles.label}>Màu sắc:</span>
                <span className={styles.value}>{order.vehicle.color || '—'}</span>
              </div>
              {order.vehicle.vin && (
                <div className={styles.infoItem}>
                  <span className={styles.label}>VIN:</span>
                  <span className={`${styles.value} ${styles.vin}`}>{order.vehicle.vin}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dealer Info */}
          <div className={styles.section}>
            <h3>
              <i className="fas fa-store"></i>
              Thông tin đại lý
            </h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Đại lý:</span>
                <span className={styles.value}>{order.dealerName}</span>
              </div>
              {order.dealerPhone && (
                <div className={styles.infoItem}>
                  <span className={styles.label}>Liên hệ:</span>
                  <span className={styles.value}>
                    <a href={`tel:${order.dealerPhone}`} className={styles.phoneLink}>
                      {order.dealerPhone}
                    </a>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Info */}
          {order.appointment && (
            <div className={styles.section}>
              <h3>
                <i className="fas fa-calendar-check"></i>
                Lịch hẹn giao xe
              </h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Thời gian:</span>
                  <span className={styles.value}>{order.appointment.date ? formatDate(order.appointment.date) : '—'}</span>
                </div>
                {order.appointment.location && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Địa điểm:</span>
                    <span className={styles.value}>{order.appointment.location}</span>
                  </div>
                )}
                {order.appointment.contact && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Liên hệ:</span>
                    <span className={styles.value}>{order.appointment.contact}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className={styles.section}>
            <h3>
              <i className="fas fa-history"></i>
              Cập nhật gần đây
            </h3>
            <div className={styles.infoItem}>
              <span className={styles.label}>Lần cuối:</span>
              <span className={styles.value}>{formatDate(order.updatedAt)}</span>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.editButton} onClick={onEdit}>
            <i className="fas fa-edit"></i>
            Chỉnh sửa
          </button>
          <button className={styles.closeFooterButton} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
