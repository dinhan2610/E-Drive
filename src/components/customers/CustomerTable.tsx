import React from 'react';
import type { Customer } from '../../types/customer';
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
  // Format phone number utility
  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    return phone;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
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
              <th className={styles.headerCell}>ID</th>
              <th className={styles.headerCell}>Họ tên</th>
              <th className={styles.headerCell}>Ngày sinh</th>
              <th className={styles.headerCell}>Giới tính</th> 
              <th className={styles.headerCell}>Email</th>
              <th className={styles.headerCell}>Số điện thoại</th>
              <th className={styles.headerCell}>Địa chỉ</th>
              <th className={styles.headerCell}>CCCD/CMND</th>
              <th className={styles.headerCell}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr
                key={customer.customerId}
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
                <td className={styles.dataCell}>{customer.customerId}</td>
                <td className={styles.dataCell}>{customer.fullName}</td>
                <td className={styles.dataCell}>{formatDate(customer.dob)}</td>
                <td className={styles.dataCell}>{customer.gender}</td>
                <td className={styles.dataCell}>{customer.email}</td>
                <td className={styles.dataCell}>{formatPhoneNumber(customer.phone)}</td>
                <td className={styles.dataCell}>{customer.address}</td>
                <td className={styles.dataCell}>{customer.idCardNo}</td>
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