import React from 'react';
import type { Staff } from '../../types/staff';
import { STAFF_ROLES } from '../../types/staff';
import styles from '../../styles/StaffStyles/StaffTable.module.scss';

interface StaffTableProps {
  staff: Staff[];
  loading?: boolean;
  onRowClick?: (staff: Staff) => void;
  onView?: (staff: Staff) => void;
  onEdit?: (staff: Staff) => void;
  onDelete?: (staff: Staff) => void;
}

const StaffTable: React.FC<StaffTableProps> = ({
  staff,
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

  // Get role display name
  const getRoleDisplay = (roles: string[]): string => {
    if (!roles || roles.length === 0) return '-';
    // Get first role and map to Vietnamese
    const firstRole = roles[0];
    return STAFF_ROLES[firstRole as keyof typeof STAFF_ROLES] || firstRole;
  };

  // Get role badge class
  const getRoleBadgeClass = (roles: string[]): string => {
    if (!roles || roles.length === 0) return '';
    const firstRole = roles[0];
    if (firstRole === 'DEALER_MANAGER') return 'manager';
    if (firstRole === 'DEALER_STAFF') return 'staff';
    return 'other';
  };

  const handleRowClick = (staffMember: Staff, e: React.MouseEvent) => {
    // Don't trigger row click if clicking on action buttons
    if ((e.target as HTMLElement).closest(`.${styles.actions}`)) {
      return;
    }
    onRowClick?.(staffMember);
  };

  const handleView = (staffMember: Staff, e: React.MouseEvent) => {
    e.stopPropagation();
    onView?.(staffMember);
  };

  const handleEdit = (staffMember: Staff, e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(staffMember);
  };

  const handleDelete = (staffMember: Staff, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(staffMember);
  };

  if (loading) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}>
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <p>Đang tải dữ liệu nhân viên...</p>
        </div>
      </div>
    );
  }

  if (!staff || staff.length === 0) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <i className="fas fa-users-cog"></i>
          </div>
          <h3>Chưa có nhân viên</h3>
          <p>Nhấn "Thêm nhân viên" để bắt đầu quản lý nhân viên của bạn.</p>
        </div>
      </div>
    );
  }

  // Sort staff by userId ascending and create index mapping
  const sortedStaff = [...staff].sort((a, b) => a.userId - b.userId);

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.headerRow}>
              <th className={styles.headerCell}>STT</th>
              <th className={styles.headerCell}>Tên đăng nhập</th>
              <th className={styles.headerCell}>Họ tên</th>
              <th className={styles.headerCell}>Vai trò</th>
              <th className={styles.headerCell}>Email</th>
              <th className={styles.headerCell}>Số điện thoại</th>
              <th className={styles.headerCell}>Trạng thái</th>
              <th className={styles.headerCell}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {sortedStaff.map((staffMember, index) => (
              <tr
                key={staffMember.userId}
                className={styles.dataRow}
                onClick={(e) => handleRowClick(staffMember, e)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleRowClick(staffMember, e as any);
                  }
                }}
              >
                <td className={styles.dataCell}>
                  <span className={styles.indexNumber}>{index + 1}</span>
                </td>
                <td className={styles.dataCell}>
                  <div className={styles.usernameCell}>
                    <i className="fas fa-user-circle" />
                    <span>{staffMember.username}</span>
                  </div>
                </td>
                <td className={styles.dataCell}>
                  <span className={styles.fullNameCell}>{staffMember.fullName}</span>
                </td>
                <td className={styles.dataCell}>
                  <span className={`${styles.positionBadge} ${styles[getRoleBadgeClass(staffMember.roles)]}`}>
                    {getRoleDisplay(staffMember.roles)}
                  </span>
                </td>
                <td className={styles.dataCell}>{staffMember.email}</td>
                <td className={styles.dataCell}>{formatPhoneNumber(staffMember.phone)}</td>
                <td className={styles.dataCell}>
                  <span className={`${styles.statusBadge} ${staffMember.active ? styles.active : styles.inactive}`}>
                    {staffMember.active ? 'Hoạt động' : 'Vô hiệu hóa'}
                  </span>
                </td>
                <td className={styles.dataCell}>
                  <div className={styles.actions}>
                    {onView && (
                      <button
                        className={`${styles.actionButton} ${styles.viewButton}`}
                        onClick={(e) => handleView(staffMember, e)}
                        title="Xem chi tiết"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    )}
                    {onEdit && staffMember.active && (
                      <button
                        className={`${styles.actionButton} ${styles.editButton}`}
                        onClick={(e) => handleEdit(staffMember, e)}
                        title="Chỉnh sửa"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={(e) => handleDelete(staffMember, e)}
                        title="Xóa nhân viên"
                      >
                        <i className="fas fa-trash-alt"></i>
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
