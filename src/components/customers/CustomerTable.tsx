import React from 'react';
import type { Customer } from '../../types/customer';
import { CUSTOMER_STATUS_CONFIG } from '../../types/customer';
import { formatPhoneNumber } from '../../services/customersApi';
import styles from '../../styles/CustomersStyles/CustomerTable.module.scss';

interface CustomerTableProps {
  customers: Customer[];
  loading?: boolean;
  onRowClick?: (customer: Customer) => void;
  onEdit?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
}

const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  loading = false,
  onRowClick,
  onEdit,
  onDelete
}) => {
  const getStatusBadge = (status: Customer['status']) => {
    const config = CUSTOMER_STATUS_CONFIG[status];
    return (
      <span 
        className={styles.statusBadge}
        style={{
          color: config.color,
          backgroundColor: config.bgColor,
          borderColor: config.borderColor
        }}
      >
        {config.label}
      </span>
    );
  };

  const getInitials = (fullName: string): string => {
    return fullName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatRelativeTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  const handleRowClick = (customer: Customer, e: React.MouseEvent) => {
    // Don't trigger row click if clicking on action buttons
    if ((e.target as HTMLElement).closest(`.${styles.actions}`)) {
      return;
    }
    onRowClick?.(customer);
  };

  const handleEdit = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(customer);
  };

  const handleDelete = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(customer);
  };

  if (loading) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}>
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <p>Đang tải dữ liệu khách hàng...</p>
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <i className="fas fa-users"></i>
          </div>
          <h3>Chưa có khách hàng</h3>
          <p>Nhấn "Thêm khách hàng" để bắt đầu quản lý hồ sơ khách hàng của bạn.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.headerRow}>
              <th className={styles.headerCell}>Khách hàng</th>
              <th className={styles.headerCell}>Điện thoại</th>
              <th className={styles.headerCell}>Email</th>
              <th className={styles.headerCell}>Trạng thái</th>
              <th className={styles.headerCell}>Quan tâm</th>
              <th className={styles.headerCell}>Cập nhật</th>
              <th className={styles.headerCell}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => (
              <tr
                key={customer.id || customer.phone || index}
                className={styles.dataRow}
                onClick={(e) => handleRowClick(customer, e)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleRowClick(customer, e as any);
                  }
                }}
              >
                <td className={styles.dataCell}>
                  <div className={styles.customerInfo}>
                    <div className={styles.avatar}>
                      {getInitials(customer.fullName)}
                    </div>
                    <div className={styles.customerDetails}>
                      <div className={styles.customerName}>
                        {customer.fullName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className={styles.dataCell}>
                  <span className={styles.phoneNumber}>
                    {formatPhoneNumber(customer.phone)}
                  </span>
                </td>
                <td className={styles.dataCell}>
                  <span className={styles.email}>
                    {customer.email || '-'}
                  </span>
                </td>
                <td className={styles.dataCell}>
                  {getStatusBadge(customer.status)}
                </td>
                <td className={styles.dataCell}>
                  <span className={styles.interestedModel}>
                    {customer.interestedModel || '-'}
                  </span>
                </td>
                <td className={styles.dataCell}>
                  <span className={styles.relativeTime}>
                    {formatRelativeTime(customer.updatedAt)}
                  </span>
                </td>
                <td className={styles.dataCell}>
                  <div className={styles.actions}>
                    {onEdit && (
                      <button
                        className={`${styles.actionButton} ${styles.editButton}`}
                        onClick={(e) => handleEdit(customer, e)}
                        title="Chỉnh sửa"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={(e) => handleDelete(customer, e)}
                        title="Xóa"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerTable;