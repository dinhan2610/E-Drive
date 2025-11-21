import React from 'react';
import type { Staff } from '../../types/staff';
import styles from '../../styles/StaffStyles/StaffTable.module.scss';

interface StaffTableProps {
  staffs: Staff[];
  loading?: boolean;
  onRowClick?: (staff: Staff) => void;
  onView?: (staff: Staff) => void;
  onEdit?: (staff: Staff) => void;
  onDelete?: (staff: Staff) => void;
}

const StaffTable: React.FC<StaffTableProps> = ({
  staffs,
  loading = false,
  onRowClick,
  onView,
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


  const handleRowClick = (staff: Staff, e: React.MouseEvent) => {
    // Don't trigger row click if clicking on action buttons
    if ((e.target as HTMLElement).closest(`.${styles.actions}`)) {
      return;
    }
    onRowClick?.(staff);
  };

  const handleView = (staff: Staff, e: React.MouseEvent) => {
    e.stopPropagation();
    onView?.(staff);
  };

  const handleEdit = (staff: Staff, e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(staff);
  };

  const handleDelete = (staff: Staff, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(staff);
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

  if (!staffs || staffs.length === 0) {
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
              <th className={styles.headerCell}>Chức vụ</th>
              <th className={styles.headerCell}>Trạng thái</th>
              <th className={styles.headerCell}>Email</th>
              <th className={styles.headerCell}>Số điện thoại</th>
              <th className={styles.headerCell}>Ngày vào làm</th>
              <th className={styles.headerCell}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {staffs.map(staff => (
              <tr
                key={staff.staffId}
                className={styles.dataRow}
                onClick={(e) => handleRowClick(staff, e)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleRowClick(staff, e as any);
                  }
                }}
              >
                <td className={styles.dataCell}>{staff.staffId}</td>
                <td className={styles.dataCell}>
                  <div style={{ fontWeight: 600 }}>{staff.fullName}</div>
                </td>
                <td className={styles.dataCell}>
                  <span className={`${styles.positionBadge} ${styles[staff.position.replace(/ /g, '')]}`}>
                    {staff.position}
                  </span>
                </td>
                <td className={styles.dataCell}>
                  <span className={`${styles.statusBadge} ${styles[staff.status.replace(/ /g, '')]}`}>
                    {staff.status}
                  </span>
                </td>
                <td className={styles.dataCell}>{staff.email}</td>
                <td className={styles.dataCell}>{formatPhoneNumber(staff.phone)}</td>
                <td className={styles.dataCell}>{formatDate(staff.hireDate)}</td>
                <td className={styles.dataCell}>
                  <div className={styles.actions}>
                    {onView && (
                      <button
                        className={`${styles.actionButton} ${styles.viewButton}`}
                        onClick={(e) => handleView(staff, e)}
                        title="Xem chi tiết"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    )}
                    {onEdit && (
                      <button
                        className={`${styles.actionButton} ${styles.editButton}`}
                        onClick={(e) => handleEdit(staff, e)}
                        title="Chỉnh sửa"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={(e) => handleDelete(staff, e)}
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

export default StaffTable;