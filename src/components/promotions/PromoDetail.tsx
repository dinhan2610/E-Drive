// src/components/promotions/PromoDetail.tsx
import React, { useState, useEffect } from 'react';
import { fetchVehiclesFromApi } from '../../services/vehicleApi';
import type { Promotion, PromoStatus } from '../../types/promotion';
import type { VehicleApiResponse } from '../../types/product';
import styles from './PromoForm.module.scss';

interface PromoDetailProps {
  promotion: Promotion;
  onClose: () => void;
}

const PromoDetail: React.FC<PromoDetailProps> = ({ promotion, onClose }) => {
  const [selectedVehicles, setSelectedVehicles] = useState<VehicleApiResponse[]>([]);

  // Load vehicles on mount
  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const result = await fetchVehiclesFromApi({ size: 100 });
      
      // Filter selected vehicles
      if (promotion.vehicleIds && promotion.vehicleIds.length > 0) {
        const selected = result.vehicles.filter(v => 
          promotion.vehicleIds.includes(v.vehicleId)
        );
        setSelectedVehicles(selected);
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    }
  };

  // Calculate status based on dates
  const calculateStatus = (): PromoStatus => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const start = new Date(promotion.startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(promotion.endDate);
    end.setHours(23, 59, 59, 999);
    
    if (now > end) return 'EXPIRED';
    if (now < start) return 'SCHEDULED';
    return 'ACTIVE';
  };

  const getStatusBadge = (status: PromoStatus) => {
    const config = {
      ACTIVE: { label: 'Đang hoạt động', icon: 'fa-check-circle', color: '#10b981' },
      INACTIVE: { label: 'Tạm dừng', icon: 'fa-pause-circle', color: '#6b7280' },
      SCHEDULED: { label: 'Sắp diễn ra', icon: 'fa-clock', color: '#3b82f6' },
      EXPIRED: { label: 'Đã hết hạn', icon: 'fa-times-circle', color: '#ef4444' }
    };
    const { label, icon, color } = config[status];
    return (
      <span style={{ color, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
        <i className={`fas ${icon}`}></i>
        {label}
      </span>
    );
  };

  const getTypeLabel = () => {
    switch (promotion.discountType) {
      case 'PERCENTAGE':
        return `Giảm ${promotion.discountValue}%`;
      case 'AMOUNT':
        return `Giảm ${promotion.discountValue.toLocaleString('vi-VN')}₫`;
      default:
        return promotion.discountType;
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const status = calculateStatus();

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h2>
              <i className="fas fa-eye" style={{ color: '#3b82f6' }}></i>
              Chi tiết khuyến mãi
            </h2>
            <p>Xem thông tin chi tiết chương trình khuyến mãi</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          <form className={styles.form}>
            {/* Promotion Info Section */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <i className="fas fa-info-circle"></i>
                Thông tin chương trình
              </h3>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Tên chương trình</label>
                  <div className={styles.detailValue}>
                    <i className="fas fa-tag"></i>
                    {promotion.title}
                  </div>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Mô tả</label>
                  <div className={styles.detailValue}>
                    <i className="fas fa-align-left"></i>
                    {promotion.description || 'Không có mô tả'}
                  </div>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Trạng thái</label>
                  <div className={styles.detailValue}>
                    {getStatusBadge(status)}
                  </div>
                </div>
              </div>
            </div>

            {/* Discount Section */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <i className="fas fa-percentage"></i>
                Thông tin giảm giá
              </h3>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Loại giảm giá</label>
                  <div className={styles.detailValue}>
                    <i className={promotion.discountType === 'PERCENTAGE' ? 'fas fa-percent' : 'fas fa-dollar-sign'}></i>
                    {promotion.discountType === 'PERCENTAGE' ? 'Phần trăm (%)' : 'Số tiền cố định (₫)'}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Giá trị giảm</label>
                  <div className={styles.detailValue} style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.2rem' }}>
                    <i className="fas fa-gift"></i>
                    {getTypeLabel()}
                  </div>
                </div>
              </div>
            </div>

            {/* Time Section */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <i className="fas fa-calendar-alt"></i>
                Thời gian áp dụng
              </h3>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Ngày bắt đầu</label>
                  <div className={styles.detailValue}>
                    <i className="fas fa-calendar-check"></i>
                    {formatDate(promotion.startDate)}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Ngày kết thúc</label>
                  <div className={styles.detailValue}>
                    <i className="fas fa-calendar-times"></i>
                    {formatDate(promotion.endDate)}
                  </div>
                </div>
              </div>
            </div>

            {/* Applicable To Section */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <i className="fas fa-users"></i>
                Đối tượng áp dụng
              </h3>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Phạm vi</label>
                  <div className={styles.detailValue}>
                    <i className={promotion.applicableTo === 'DEALER' ? 'fas fa-store' : 'fas fa-user-friends'}></i>
                    {promotion.applicableTo === 'DEALER' ? 'Dành cho đại lý' : 'Dành cho khách hàng'}
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicles Section */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <i className="fas fa-car"></i>
                Mẫu xe áp dụng
                <span className={styles.badge} style={{ marginLeft: '1rem' }}>
                  {selectedVehicles.length} mẫu xe
                </span>
              </h3>

              {selectedVehicles.length > 0 ? (
                <div className={styles.vehicleGrid}>
                  {selectedVehicles.map(vehicle => (
                    <div key={vehicle.vehicleId} className={styles.vehicleCard}>
                      <div className={styles.vehicleImage}>
                        {vehicle.imageUrl ? (
                          <img src={vehicle.imageUrl} alt={vehicle.modelName} />
                        ) : (
                          <div className={styles.noImage}>
                            <i className="fas fa-car"></i>
                          </div>
                        )}
                      </div>
                      <div className={styles.vehicleInfo}>
                        <h4>{vehicle.modelName}</h4>
                        <p>{vehicle.version}</p>
                        <span className={styles.price}>
                          {vehicle.priceRetail?.toLocaleString('vi-VN')}₫
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyVehicles}>
                  <i className="fas fa-info-circle"></i>
                  <p>Áp dụng cho tất cả mẫu xe</p>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            <i className="fas fa-times"></i>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoDetail;
