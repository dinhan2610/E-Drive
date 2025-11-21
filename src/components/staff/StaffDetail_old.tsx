import React from 'react';
import type { Staff } from '../../types/staff';
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

  // Format date utility
  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
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
            <div>
              <h2 id="staff-detail-title" className={styles.modalTitle}>
                Chi tiết khách hàng
              </h2>
              <p className={styles.modalSubtitle}>ID: #{staff.staffId}</p>
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
              {staff.fullName.charAt(0).toUpperCase()}
            </div>
            <div className={styles.staffMainInfo}>
              <h3>{staff.fullName}</h3>
              <div className={styles.staffMeta}>
                <span>
                  <i className="fas fa-id-card" />
                  {staff.idCardNo}
                </span>
                <span>
                  <i className="fas fa-venus-mars" />
                  {staff.gender}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                <i className="fas fa-birthday-cake" />
              </div>
              <div className={styles.infoContent}>
                <div className={styles.infoLabel}>Ngày sinh</div>
                <div className={styles.infoValue}>{formatDate(staff.dob)}</div>
              </div>
            </div>

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

            <div className={styles.infoCard} style={{ gridColumn: '1 / -1' }}>
              <div className={styles.infoIcon} style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                <i className="fas fa-map-marker-alt" />
              </div>
              <div className={styles.infoContent}>
                <div className={styles.infoLabel}>Địa chỉ</div>
                <div className={styles.infoValue}>{staff.address}</div>
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