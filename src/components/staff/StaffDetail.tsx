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
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className="fas fa-user-circle" />
            </div>
            <div className={styles.headerInfo}>
              <div className={styles.titleRow}>
                <h2 id="staff-detail-title" className={styles.modalTitle}>
                  Chi tiết nhân viên
                </h2>
                {onEdit && (
                  <button
                    type="button"
                    className={styles.quickEditButton}
                    onClick={handleEdit}
                    title="Chỉnh sửa"
                  >
                    <i className="fas fa-edit" />
                  </button>
                )}
              </div>
              <div className={styles.headerMeta}>
                <span className={styles.userId}>ID: #{staff.userId}</span>
                <span className={`${styles.statusBadge} ${staff.active ? styles.active : styles.inactive}`}>
                  <i className={staff.active ? "fas fa-check-circle" : "fas fa-times-circle"} />
                  {staff.active ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                </span>
              </div>
            </div>
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
          <div className={styles.staffCard}>
            <div className={styles.avatar}>
              <span className={styles.avatarText}>{staff.fullName.charAt(0).toUpperCase()}</span>
              <div className={styles.avatarBadge}>
                <i className="fas fa-id-badge" />
              </div>
            </div>
            <div className={styles.staffMainInfo}>
              <h3 className={styles.staffName}>{staff.fullName}</h3>
              <div className={styles.staffMeta}>
                <span className={styles.usernameTag}>
                  <i className="fas fa-at" />
                  {staff.username}
                </span>
                <span className={`${styles.roleBadge} ${getRoleBadgeClass(staff.roles)}`}>
                  <i className="fas fa-user-tag" />
                  {getRoleDisplay(staff.roles)}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <i className="fas fa-phone" />
              </div>
              <div className={styles.infoContent}>
                <div className={styles.infoLabel}>Số điện thoại</div>
                <div className={styles.infoValue}>
                  <a href={`tel:${staff.phone}`} className={styles.link}>
                    {formatPhoneNumber(staff.phone)}
                  </a>
                </div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <i className="fas fa-envelope" />
              </div>
              <div className={styles.infoContent}>
                <div className={styles.infoLabel}>Email</div>
                <div className={styles.infoValue}>
                  {staff.email ? (
                    <a href={`mailto:${staff.email}`} className={styles.link}>
                      {staff.email}
                    </a>
                  ) : (
                    <span className={styles.emptyValue}>Chưa có</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.btnClose}
            onClick={onClose}
          >
            <i className="fas fa-times" />
            <span>Đóng</span>
          </button>
          {onEdit && (
            <button
              type="button"
              className={styles.btnEdit}
              onClick={handleEdit}
            >
              <i className="fas fa-edit" />
              <span>Chỉnh sửa</span>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className={styles.btnDelete}
              onClick={handleDelete}
            >
              <i className="fas fa-trash-alt" />
              <span>Xóa</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDetail;
