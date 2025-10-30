import React from 'react';
import type { Ticket } from '../../types/ticket';
import styles from './TicketDetailModal.module.scss';

interface TicketDetailModalProps {
  ticket: Ticket;
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
    case 'NEW':
      return { label: 'Mới', icon: 'fa-plus-circle', color: '#17a2b8' };
    case 'IN_REVIEW':
      return { label: 'Đang xem xét', icon: 'fa-search', color: '#ffc107' };
    case 'WAITING_CUSTOMER':
      return { label: 'Chờ khách hàng', icon: 'fa-clock', color: '#ff9800' };
    case 'RESOLVED':
      return { label: 'Đã giải quyết', icon: 'fa-check-circle', color: '#28a745' };
    case 'CLOSED':
      return { label: 'Đã đóng', icon: 'fa-times-circle', color: '#6c757d' };
    case 'REJECTED':
      return { label: 'Từ chối', icon: 'fa-ban', color: '#dc3545' };
    default:
      return { label: status, icon: 'fa-info-circle', color: '#757575' };
  }
};

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  onClose,
  onEdit
}) => {
  const statusInfo = getStatusInfo(ticket.status);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <i className="fas fa-comments"></i>
            <div>
              <h2>Chi tiết {ticket.type === 'FEEDBACK' ? 'phản hồi' : 'khiếu nại'}</h2>
              <p className={styles.ticketCode}>Mã: {ticket.code}</p>
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
          {/* Ticket Info */}
          <div className={styles.infoSection}>
            <div className={styles.sectionHeader}>
              <i className="fas fa-info-circle"></i>
              <h3>Thông tin ticket</h3>
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Tiêu đề</label>
                <p>{ticket.title}</p>
              </div>
              <div className={styles.infoItem}>
                <label>Loại</label>
                <p>{ticket.type === 'FEEDBACK' ? 'Phản hồi' : 'Khiếu nại'}</p>
              </div>
              <div className={styles.infoItem}>
                <label>Danh mục</label>
                <p>{ticket.category}</p>
              </div>
              <div className={styles.infoItem}>
                <label>Độ ưu tiên</label>
                <p>{ticket.priority}</p>
              </div>
              <div className={styles.infoItem}>
                <label>Kênh</label>
                <p>{ticket.channel}</p>
              </div>
            </div>
            <div className={styles.fullWidth}>
              <label>Mô tả</label>
              <p className={styles.description}>{ticket.description}</p>
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
                <label>Tên khách hàng</label>
                <p>{ticket.customerName}</p>
              </div>
              {ticket.customerPhone && (
                <div className={styles.infoItem}>
                  <label>Số điện thoại</label>
                  <p>{ticket.customerPhone}</p>
                </div>
              )}
              {ticket.customerEmail && (
                <div className={styles.infoItem}>
                  <label>Email</label>
                  <p>{ticket.customerEmail}</p>
                </div>
              )}
              {ticket.orderCode && (
                <div className={styles.infoItem}>
                  <label>Mã đơn hàng</label>
                  <p>{ticket.orderCode}</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Info */}
          <div className={styles.infoSection}>
            <div className={styles.sectionHeader}>
              <i className="fas fa-calendar-alt"></i>
              <h3>Thời gian</h3>
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Tạo lúc</label>
                <p>{formatDateTime(ticket.createdAt)}</p>
              </div>
              <div className={styles.infoItem}>
                <label>Cập nhật lúc</label>
                <p>{formatDateTime(ticket.updatedAt)}</p>
              </div>
              {ticket.resolvedAt && (
                <div className={styles.infoItem}>
                  <label>Giải quyết lúc</label>
                  <p>{formatDateTime(ticket.resolvedAt)}</p>
                </div>
              )}
              <div className={styles.infoItem}>
                <label>SLA Deadline</label>
                <p>{formatDateTime(ticket.slaDeadline)}</p>
              </div>
            </div>
          </div>

          {/* Assignee Info */}
          {ticket.assigneeName && (
            <div className={styles.infoSection}>
              <div className={styles.sectionHeader}>
                <i className="fas fa-user-tie"></i>
                <h3>Người xử lý</h3>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>Nhân viên</label>
                  <p>{ticket.assigneeName}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          {onEdit && ticket.status !== 'CLOSED' && (
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

export default TicketDetailModal;
