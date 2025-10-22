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
        className={styles.drawer}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-detail-title"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.customerHeader}>
            <div className={styles.avatar}>
              {customer.fullName.charAt(0).toUpperCase()}
            </div>
            <div className={styles.customerInfo}>
              <h2 id="customer-detail-title" className={styles.customerName}>
                {customer.fullName}
              </h2>
              <div className={styles.customerMeta}>
                <span>
                  <i className="fas fa-id-card" style={{marginRight: '6px'}}></i>
                  {customer.idCardNo}
                </span>
              </div>
            </div>
          </div>
          
          <div className={styles.headerActions}>
            {onEdit && (
              <button
                type="button"
                className={styles.editButton}
                onClick={handleEdit}
                title="Chỉnh sửa"
              >
                <i className="fas fa-edit" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className={styles.deleteButton}
                onClick={handleDelete}
                title="Xóa"
              >
                <i className="fas fa-trash" />
              </button>
            )}
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              title="Đóng"
            >
              <i className="fas fa-times" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <div className={styles.infoTab}>
            <div className={styles.infoSection}>
              <h3 className={styles.sectionTitle}>
                <i className="fas fa-user" />
                Thông tin cá nhân
              </h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <i className="fas fa-birthday-cake" />
                    Ngày sinh
                  </div>
                  <div className={styles.infoValue}>
                    {formatDate(customer.dob)}
                  </div>
                </div>
                
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <i className="fas fa-venus-mars" />
                    Giới tính
                  </div>
                  <div className={styles.infoValue}>
                    {customer.gender}
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <i className="fas fa-id-card" />
                    CCCD/CMND
                  </div>
                  <div className={styles.infoValue}>
                    {customer.idCardNo}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.infoSection}>
              <h3 className={styles.sectionTitle}>
                <i className="fas fa-address-card" />
                Thông tin liên hệ
              </h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <i className="fas fa-phone" />
                    Số điện thoại
                  </div>
                  <div className={styles.infoValue}>
                    <a href={`tel:${customer.phone}`} className={styles.phoneLink}>
                      <i className="fas fa-phone-alt" style={{marginRight: '8px', fontSize: '12px'}}></i>
                      {formatPhoneNumber(customer.phone)}
                    </a>
                  </div>
                </div>
                
                {customer.email && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>
                      <i className="fas fa-envelope" />
                      Email
                    </div>
                    <div className={styles.infoValue}>
                      <a href={`mailto:${customer.email}`} className={styles.emailLink}>
                        {customer.email}
                      </a>
                    </div>
                  </div>
                )}

                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <i className="fas fa-map-marker-alt" />
                    Địa chỉ
                  </div>
                  <div className={styles.infoValue}>
                    {customer.address}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;