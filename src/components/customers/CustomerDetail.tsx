import React from 'react';
import type { Customer } from '../../types/customer';
import styles from '../../styles/CustomersStyles/CustomerDetail.module.scss';

interface CustomerDetailProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({
  customer,
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

  if (!isOpen || !customer) return null;

  const handleEdit = () => {
    if (onEdit && customer) {
      onEdit(customer);
    }
  };

  const handleDelete = () => {
    if (onDelete && customer) {
      onDelete(customer);
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
        aria-labelledby="customer-detail-title"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className="fas fa-user-circle" />
            </div>
            <div>
              <h2 id="customer-detail-title" className={styles.modalTitle}>
                Chi tiết khách hàng
              </h2>
              <p className={styles.modalSubtitle}>ID: #{customer.customerId}</p>
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
          <div className={styles.customerCard}>
            <div className={styles.avatar}>
              {customer.fullName.charAt(0).toUpperCase()}
            </div>
            <div className={styles.customerMainInfo}>
              <h3>{customer.fullName}</h3>
              <div className={styles.customerMeta}>
                <span>
                  <i className="fas fa-id-card" />
                  {customer.idCardNo}
                </span>
                <span>
                  <i className="fas fa-venus-mars" />
                  {customer.gender}
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
                <div className={styles.infoValue}>{formatDate(customer.dob)}</div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <i className="fas fa-phone" />
              </div>
              <div className={styles.infoContent}>
                <div className={styles.infoLabel}>Số điện thoại</div>
                <div className={styles.infoValue}>
                  <a href={`tel:${customer.phone}`} className={styles.link}>
                    {formatPhoneNumber(customer.phone)}
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
                  {customer.email ? (
                    <a href={`mailto:${customer.email}`} className={styles.link}>
                      {customer.email}
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
                <div className={styles.infoValue}>{customer.address}</div>
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

export default CustomerDetail;