import React, { useState } from 'react';
import type { Customer } from '../../types/customer';
import { CUSTOMER_STATUS_CONFIG } from '../../types/customer';
import { formatPhoneNumber, getRelativeTime } from '../../services/customersApi';
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
  const [activeTab, setActiveTab] = useState<'info' | 'testDrives' | 'orders'>('info');

  if (!isOpen || !customer) return null;

  const statusConfig = CUSTOMER_STATUS_CONFIG[customer.status];

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
              <div 
                className={styles.statusBadge}
                style={{
                  color: statusConfig.color,
                  backgroundColor: statusConfig.bgColor,
                  borderColor: statusConfig.borderColor
                }}
              >
                {statusConfig.label}
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

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'info' ? styles.active : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <i className="fas fa-user" />
            Thông tin
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'testDrives' ? styles.active : ''}`}
            onClick={() => setActiveTab('testDrives')}
          >
            <i className="fas fa-car" />
            Lái thử ({customer.testDrives?.length || 0})
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'orders' ? styles.active : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <i className="fas fa-shopping-cart" />
            Đơn hàng ({customer.orders?.length || 0})
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {activeTab === 'info' && (
            <div className={styles.infoTab}>
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
                </div>
              </div>

              {customer.interestedModel && (
                <div className={styles.infoSection}>
                  <h3 className={styles.sectionTitle}>
                    <i className="fas fa-car" />
                    Sở thích
                  </h3>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <div className={styles.infoLabel}>
                        <i className="fas fa-heart" />
                        Mẫu xe quan tâm
                      </div>
                      <div className={styles.infoValue}>{customer.interestedModel}</div>
                    </div>
                  </div>
                </div>
              )}

              {customer.notes && (
                <div className={styles.infoSection}>
                  <h3 className={styles.sectionTitle}>
                    <i className="fas fa-sticky-note" />
                    Ghi chú
                  </h3>
                  <div className={styles.notesContent}>
                    {customer.notes}
                  </div>
                </div>
              )}

              <div className={styles.infoSection}>
                <h3 className={styles.sectionTitle}>
                  <i className="fas fa-clock" />
                  Thời gian
                </h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>
                      <i className="fas fa-plus" />
                      Tạo lúc
                    </div>
                    <div className={styles.infoValue}>
                      {getRelativeTime(customer.createdAt)}
                      <div className={styles.absoluteTime}>
                        {new Date(customer.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>
                      <i className="fas fa-edit" />
                      Cập nhật lúc
                    </div>
                    <div className={styles.infoValue}>
                      {getRelativeTime(customer.updatedAt)}
                      <div className={styles.absoluteTime}>
                        {new Date(customer.updatedAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'testDrives' && (
            <div className={styles.listTab}>
              {customer.testDrives && customer.testDrives.length > 0 ? (
                <div className={styles.itemsList}>
                  {customer.testDrives.map((testDrive) => (
                    <div key={testDrive.id} className={styles.listItem}>
                      <div className={styles.itemIcon}>
                        <i className="fas fa-car" />
                      </div>
                      <div className={styles.itemContent}>
                        <div className={styles.itemTitle}>{testDrive.model}</div>
                        <div className={styles.itemDate}>
                          {new Date(testDrive.date).toLocaleDateString('vi-VN')}
                        </div>
                        {testDrive.result && (
                          <div className={`${styles.itemResult} ${
                            testDrive.result === 'Positive' ? styles.positive : styles.negative
                          }`}>
                            {testDrive.result}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <i className="fas fa-car" />
                  <h3>Chưa có lái thử</h3>
                  <p>Khách hàng chưa thực hiện lái thử nào.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className={styles.listTab}>
              {customer.orders && customer.orders.length > 0 ? (
                <div className={styles.itemsList}>
                  {customer.orders.map((order) => (
                    <div key={order.id} className={styles.listItem}>
                      <div className={styles.itemIcon}>
                        <i className="fas fa-shopping-cart" />
                      </div>
                      <div className={styles.itemContent}>
                        <div className={styles.itemTitle}>{order.model}</div>
                        <div className={styles.itemDate}>
                          {new Date(order.date).toLocaleDateString('vi-VN')}
                        </div>
                        <div className={styles.itemAmount}>
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(order.amount)}
                        </div>
                        <div className={`${styles.itemStatus} ${styles[order.status.toLowerCase()]}`}>
                          {order.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <i className="fas fa-shopping-cart" />
                  <h3>Chưa có đơn hàng</h3>
                  <p>Khách hàng chưa có đơn hàng nào.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;