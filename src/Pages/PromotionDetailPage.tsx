import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchVehiclesFromApi } from '../services/vehicleApi';
import { listPromotions } from '../services/promotionsApi';
import { getProfile } from '../services/profileApi';
import type { Promotion, PromoStatus } from '../types/promotion';
import type { VehicleApiResponse } from '../types/product';
import styles from './PromotionDetailPage.module.scss';

const PromotionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [selectedVehicles, setSelectedVehicles] = useState<VehicleApiResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPromotionDetail();
    }
  }, [id]);

  const loadPromotionDetail = async () => {
    try {
      setLoading(true);
      
      // Get dealer info first
      const profile = await getProfile();
      const dealerId = profile.dealerId;
      
      // Fetch promotions by dealer ID
      const response = await listPromotions(dealerId, { limit: 100 });
      const promo = response.items.find((p: any) => p.promoId === parseInt(id!));
      
      if (!promo) {
        console.error('Promotion not found');
        navigate('/promotions');
        return;
      }
      
      setPromotion(promo);

      // Load vehicles
      const vehiclesResult = await fetchVehiclesFromApi({ size: 100 });
      
      // Filter selected vehicles
      if (promo.vehicleIds && promo.vehicleIds.length > 0) {
        const selected = vehiclesResult.vehicles.filter(v => 
          promo.vehicleIds.includes(v.vehicleId)
        );
        setSelectedVehicles(selected);
      }
    } catch (error) {
      console.error('Failed to load promotion detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatus = (): PromoStatus => {
    if (!promotion) return 'INACTIVE';
    
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
      ACTIVE: { label: 'Đang hoạt động', icon: 'fa-check-circle', class: styles.statusActive },
      INACTIVE: { label: 'Tạm dừng', icon: 'fa-pause-circle', class: styles.statusInactive },
      SCHEDULED: { label: 'Sắp diễn ra', icon: 'fa-clock', class: styles.statusScheduled },
      EXPIRED: { label: 'Đã hết hạn', icon: 'fa-times-circle', class: styles.statusExpired }
    };
    const { label, icon, class: className } = config[status];
    return (
      <span className={`${styles.statusBadge} ${className}`}>
        <i className={`fas ${icon}`}></i>
        {label}
      </span>
    );
  };

  const getTypeLabel = () => {
    if (!promotion) return '';
    
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

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}>
          <i className="fas fa-circle-notch fa-spin"></i>
        </div>
        <p>Đang tải thông tin khuyến mãi...</p>
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className={styles.errorContainer}>
        <i className="fas fa-exclamation-triangle"></i>
        <p>Không tìm thấy thông tin khuyến mãi</p>
        <button onClick={() => navigate('/promotions')} className={styles.backBtn}>
          <i className="fas fa-arrow-left"></i>
          Quay lại
        </button>
      </div>
    );
  }

  const status = calculateStatus();

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button onClick={() => navigate('/promotions')} className={styles.backButton}>
          <i className="fas fa-arrow-left"></i>
          Quay lại
        </button>
        <div className={styles.headerContent}>
          <h1>
            <i className="fas fa-gift"></i>
            {promotion.title}
          </h1>
          {getStatusBadge(status)}
        </div>
      </div>

      {/* Content */}
      <div className={styles.pageContent}>
        {/* Info Cards Grid */}
        <div className={styles.infoGrid}>
          {/* Promotion Info Card */}
          <div className={styles.infoCard}>
            <div className={styles.cardHeader}>
              <h2>
                <i className="fas fa-info-circle"></i>
                Thông tin chương trình
              </h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.infoItem}>
                <label>
                  <i className="fas fa-tag"></i>
                  Tên chương trình
                </label>
                <div className={styles.value}>{promotion.title}</div>
              </div>
              <div className={styles.infoItem}>
                <label>
                  <i className="fas fa-align-left"></i>
                  Mô tả
                </label>
                <div className={styles.value}>{promotion.description || 'Không có mô tả'}</div>
              </div>
              <div className={styles.infoItem}>
                <label>
                  <i className="fas fa-users"></i>
                  Đối tượng áp dụng
                </label>
                <div className={styles.value}>
                  {promotion.applicableTo === 'DEALER' ? (
                    <span className={styles.badge}>
                      <i className="fas fa-store"></i>
                      Dành cho đại lý
                    </span>
                  ) : (
                    <span className={styles.badge}>
                      <i className="fas fa-user-friends"></i>
                      Dành cho khách hàng
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Discount Card */}
          <div className={styles.infoCard}>
            <div className={styles.cardHeader}>
              <h2>
                <i className="fas fa-percentage"></i>
                Thông tin giảm giá
              </h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.infoItem}>
                <label>
                  <i className="fas fa-list"></i>
                  Loại giảm giá
                </label>
                <div className={styles.value}>
                  {promotion.discountType === 'PERCENTAGE' ? (
                    <span className={styles.badge}>
                      <i className="fas fa-percent"></i>
                      Phần trăm (%)
                    </span>
                  ) : (
                    <span className={styles.badge}>
                      <i className="fas fa-dollar-sign"></i>
                      Số tiền cố định (₫)
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.infoItem}>
                <label>
                  <i className="fas fa-gift"></i>
                  Giá trị giảm
                </label>
                <div className={`${styles.value} ${styles.discountValue}`}>
                  {getTypeLabel()}
                </div>
              </div>
            </div>
          </div>

          {/* Time Card */}
          <div className={styles.infoCard}>
            <div className={styles.cardHeader}>
              <h2>
                <i className="fas fa-calendar-alt"></i>
                Thời gian áp dụng
              </h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.infoItem}>
                <label>
                  <i className="fas fa-calendar-check"></i>
                  Ngày bắt đầu
                </label>
                <div className={styles.value}>{formatDate(promotion.startDate)}</div>
              </div>
              <div className={styles.infoItem}>
                <label>
                  <i className="fas fa-calendar-times"></i>
                  Ngày kết thúc
                </label>
                <div className={styles.value}>{formatDate(promotion.endDate)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicles Section */}
        <div className={styles.vehiclesSection}>
          <div className={styles.sectionHeader}>
            <h2>
              <i className="fas fa-car"></i>
              Mẫu xe áp dụng
            </h2>
            <span className={styles.count}>
              {selectedVehicles.length > 0 ? `${selectedVehicles.length} mẫu xe` : 'Tất cả mẫu xe'}
            </span>
          </div>

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
                    <h3>{vehicle.modelName}</h3>
                    <p className={styles.version}>{vehicle.version}</p>
                    <p className={styles.color}>
                      <i className="fas fa-palette"></i>
                      {vehicle.color}
                    </p>
                    <div className={styles.price}>
                      <span className={styles.label}>Giá niêm yết:</span>
                      <span className={styles.amount}>
                        {vehicle.priceRetail?.toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                    {vehicle.status && (
                      <div className={`${styles.stock} ${vehicle.status === 'AVAILABLE' ? styles.inStock : styles.outOfStock}`}>
                        <i className={`fas ${vehicle.status === 'AVAILABLE' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                        {vehicle.status === 'AVAILABLE' ? 'Còn hàng' : 'Hết hàng'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyVehicles}>
              <i className="fas fa-info-circle"></i>
              <p>Chương trình áp dụng cho tất cả mẫu xe</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromotionDetailPage;
