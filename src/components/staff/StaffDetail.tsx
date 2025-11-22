import React from 'react';
import type { Staff } from '../../types/staff';
import { STAFF_ROLES } from '../../types/staff';
import styles from '../../styles/StaffStyles/StaffDetail.module.scss';

interface StaffDetailProps {
  staff: Staff | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (staff: Staff) => void;
  onDelete?: (staff: Staff) => void;
}

const StaffDetail: React.FC<StaffDetailProps> = ({
  staff,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {

  // Format phone number utility
  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    return phone;
  };

  // Get role display
  const getRoleDisplay = (roles: string[]): string => {
    if (!roles || roles.length === 0) return '-';
    return roles.map(role => STAFF_ROLES[role as keyof typeof STAFF_ROLES] || role).join(', ');
  };

  // Get role badge class
  const getRoleBadgeClass = (roles: string[]): string => {
    if (!roles || roles.length === 0) return '';
    const firstRole = roles[0];
    if (firstRole === 'DEALER_MANAGER') return 'manager';
    if (firstRole === 'DEALER_STAFF') return 'staff';
    return 'other';
  };

  if (!isOpen || !staff) return null;

  const handleEdit = () => {
    if (onEdit && staff) {
      onEdit(staff);
    }
  };

  const handleDelete = () => {
    if (onDelete && staff) {
      onDelete(staff);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={styles.modal}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-detail-title"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 id="staff-detail-title" className={styles.modalTitle}>
              <i className="fas fa-user-circle" />
              Chi tiết nhân viên
            </h2>
            <span className={styles.userId}>ID: #{staff.userId}</span>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            title="Đóng"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="fas fa-user" />
              Tên đăng nhập
            </label>
            <div className={styles.staticValue}>{staff.username}</div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="fas fa-id-card" />
              Họ và tên
            </label>
            <div className={styles.staticValue}>{staff.fullName}</div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="fas fa-user-tag" />
              Vai trò
            </label>
            <div className={styles.staticValue}>
              <span className={`${styles.roleBadge} ${getRoleBadgeClass(staff.roles)}`}>
                {getRoleDisplay(staff.roles)}
              </span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="fas fa-envelope" />
              Email
            </label>
            <div className={styles.staticValue}>
              {staff.email ? (
                <a href={`mailto:${staff.email}`} className={styles.emailLink}>
                  {staff.email}
                </a>
              ) : (
                <span className={styles.emptyValue}>Chưa có</span>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="fas fa-phone" />
              Số điện thoại
            </label>
            <div className={styles.staticValue}>
              <a href={`tel:${staff.phone}`} className={styles.phoneLink}>
                {formatPhoneNumber(staff.phone)}
              </a>
            </div>
          </div>

          {staff.dealerName && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <i className="fas fa-building" />
                Đại lý
              </label>
              <div className={styles.staticValue}>{staff.dealerName}</div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.btnClose}
            onClick={onClose}
          >
            <i className="fas fa-times" />
            Đóng
          </button>
          {onEdit && (
            <button
              type="button"
              className={styles.btnEdit}
              onClick={handleEdit}
            >
              <i className="fas fa-edit" />
              Chỉnh sửa
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className={styles.btnDelete}
              onClick={handleDelete}
            >
              <i className="fas fa-trash-alt" />
              Xóa
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDetail;
