// src/components/promotions/PromoTable.tsx
import React, { useState } from 'react';
import { removePromotion } from '../../services/promotionsApi';
import { canManagePromotions } from '../../utils/roleUtils';
import type { Promotion, PromoStatus } from '../../types/promotion';
import ConfirmDialog from '../common/ConfirmDialog';
import styles from './PromoTable.module.scss';

interface PromoTableProps {
  promotions: Promotion[];
  loading: boolean;
  dealerId: number;
  onEdit: (promo: Promotion) => void;
  onView: (promo: Promotion) => void;
  onRefresh: () => void;
}

const PromoTable: React.FC<PromoTableProps> = ({ promotions, loading, dealerId, onEdit, onView, onRefresh }) => {
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

  // Check if user has manage permission
  const hasManagePermission = canManagePromotions();

  // Tính status dựa trên ngày giờ thực tế
  const calculateStatus = (startDate: string, endDate: string): PromoStatus => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day for comparison
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day
    
    // Check if expired (past end date)
    if (now > end) return 'EXPIRED';
    
    // Check if scheduled (before start date)
    if (now < start) return 'SCHEDULED';
    
    // Active (between start and end date)
    return 'ACTIVE';
  };

  const getStatusBadge = (status: PromoStatus) => {
    const config = {
      ACTIVE: { label: 'Đang hoạt động', className: styles.active },
      INACTIVE: { label: 'Tạm dừng', className: styles.inactive },
      SCHEDULED: { label: 'Sắp diễn ra', className: styles.scheduled },
      EXPIRED: { label: 'Đã hết hạn', className: styles.expired }
    };
    const { label, className } = config[status];
    return <span className={`${styles.badge} ${className}`}>{label}</span>;
  };

  const getTypeLabel = (type: string, value: number) => {
    switch (type) {
      case 'PERCENTAGE':
        return `-${value}%`;
      case 'FIXED_AMOUNT':
        return `-${value.toLocaleString('vi-VN')}₫`;
      default:
        return type;
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const handleDelete = (promo: Promotion) => {
    setConfirmDialog({
      show: true,
      title: 'Xóa khuyến mãi',
      message: `Bạn có chắc muốn xóa "${promo.title}"? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        try {
          await removePromotion(dealerId, promo.promoId);
          onRefresh();
        } catch (error) {
          alert('Không thể xóa khuyến mãi');
        }
        setConfirmDialog({ ...confirmDialog, show: false });
      }
    });
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <i className="fas fa-spinner fa-spin"></i>
        <span>Đang tải...</span>
      </div>
    );
  }

  if (!promotions || promotions.length === 0) {
    return (
      <div className={styles.empty}>
        <i className="fas fa-tags"></i>
        <h3>Chưa có khuyến mãi nào</h3>
        <p>Nhấn "Tạo khuyến mãi" để bắt đầu</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.table}>
        <div className={styles.header}>
          <div>Tên chương trình</div>
          <div>Loại/Giá trị</div>
          <div>Phạm vi</div>
          <div>Thời gian</div>
          <div>Trạng thái</div>
          <div>Thao tác</div>
        </div>

        {Array.isArray(promotions) && promotions.map((promo) => {
          const status = calculateStatus(promo.startDate, promo.endDate);
          return (
          <div key={promo.promoId} className={styles.row}>
            <div className={styles.name}>
              <strong>{promo.title}</strong>
              {promo.applicableTo === 'DEALER' && <span className={styles.exclusive}>Dành cho đại lý</span>}
            </div>
            
            <div className={styles.value}>
              <span className={styles.valueLabel}>{getTypeLabel(promo.discountType, promo.discountValue)}</span>
            </div>

            <div className={styles.scope}>
              {promo.vehicleIds && promo.vehicleIds.length > 0 ? (
                <span>{promo.vehicleIds.length} mẫu xe</span>
              ) : (
                <span>Tất cả</span>
              )}
            </div>

            <div className={styles.dates}>
              <div>{formatDate(promo.startDate)} - {formatDate(promo.endDate)}</div>
              <small>{promo.description}</small>
            </div>

            <div>{getStatusBadge(status)}</div>

            <div className={styles.actions}>
              <button
                className={styles.actionBtn}
                onClick={() => onView(promo)}
                title="Xem chi tiết"
              >
                <i className="fas fa-eye"></i>
              </button>

              {hasManagePermission && (
                <>
                  <button
                    className={styles.actionBtn}
                    onClick={() => onEdit(promo)}
                    title="Chỉnh sửa"
                  >
                    <i className="fas fa-edit"></i>
                  </button>

                  <button
                    className={`${styles.actionBtn} ${styles.delete}`}
                    onClick={() => handleDelete(promo)}
                    title="Xóa"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </>
              )}
            </div>
          </div>
        );
        })}
      </div>

      {confirmDialog.show && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ ...confirmDialog, show: false })}
        />
      )}
    </>
  );
};

export default PromoTable;
