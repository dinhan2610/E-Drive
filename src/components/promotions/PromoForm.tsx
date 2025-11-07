// src/components/promotions/PromoForm.tsx
import React, { useState, useEffect } from 'react';
import { createPromotion, updatePromotion } from '../../services/promotionsApi';
import { fetchVehiclesFromApi } from '../../services/vehicleApi';
import type { Promotion, PromoType, ApplicableTo } from '../../types/promotion';
import type { VehicleApiResponse } from '../../types/product';
import styles from './PromoForm.module.scss';

interface PromoFormProps {
  promotion: Promotion | null;
  dealerId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const PromoForm: React.FC<PromoFormProps> = ({ promotion, dealerId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountType: 'PERCENTAGE' as PromoType,
    discountValue: 0,
    startDate: '',
    endDate: '',
    applicableTo: 'CUSTOMER' as ApplicableTo,
    vehicleIds: [] as number[]
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [vehicles, setVehicles] = useState<VehicleApiResponse[]>([]);
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false);

  // Load vehicles on mount
  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      console.log('🚗 Loading vehicles...');
      const result = await fetchVehiclesFromApi({ size: 100 }); // Get all vehicles
      console.log('✅ Vehicles loaded:', result);
      setVehicles(result.vehicles);
    } catch (error) {
      console.error('❌ Failed to load vehicles:', error);
    }
  };

  useEffect(() => {
    if (promotion) {
      setFormData({
        title: promotion.title,
        description: promotion.description,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        applicableTo: promotion.applicableTo,
        vehicleIds: promotion.vehicleIds || []
      });
    }
  }, [promotion]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    if (!formData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tên chương trình';
    }

    if (formData.discountValue <= 0) {
      newErrors.discountValue = 'Giá trị phải lớn hơn 0';
    }

    if (formData.discountType === 'PERCENTAGE' && (formData.discountValue < 1 || formData.discountValue > 100)) {
      newErrors.discountValue = 'Phần trăm phải từ 1-100';
    }

    // Validate start date
    if (formData.startDate) {
      const startDate = new Date(formData.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        newErrors.startDate = 'Ngày bắt đầu không được trong quá khứ';
      }
    }

    // Validate end date
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate <= startDate) {
        newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
    }

    if (!formData.vehicleIds || formData.vehicleIds.length === 0) {
      newErrors.vehicleIds = 'Phải chọn ít nhất 1 mẫu xe';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    try {
      if (promotion) {
        await updatePromotion(dealerId, promotion.promoId, formData);
      } else {
        await createPromotion(dealerId, formData);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleVehicleSelect = (vehicleId: number) => {
    const currentIds = formData.vehicleIds;
    const newIds = currentIds.includes(vehicleId)
      ? currentIds.filter(id => id !== vehicleId)
      : [...currentIds, vehicleId];
    handleChange('vehicleIds', newIds);
  };

  const handleSelectAll = () => {
    if (formData.vehicleIds.length === vehicles.length) {
      handleChange('vehicleIds', []);
    } else {
      handleChange('vehicleIds', vehicles.map(v => v.vehicleId));
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>
            <i className="fas fa-tags"></i>
            {promotion ? 'Chỉnh sửa khuyến mãi' : 'Tạo khuyến mãi mới'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.body}>
          <div className={styles.grid}>
            {/* Left Column */}
            <div className={styles.column}>
              <h3>Thông tin chính</h3>

              <div className={styles.formGroup}>
                <label>
                  Tên chương trình <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="VD: Khuyến mãi đầu năm"
                  className={errors.title ? styles.error : ''}
                />
                {errors.title && <span className={styles.errorText}>{errors.title}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Mô tả chi tiết về chương trình..."
                  rows={3}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>
                    Loại khuyến mãi <span className={styles.required}>*</span>
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => handleChange('discountType', e.target.value as PromoType)}
                  >
                    <option value="PERCENTAGE">Giảm theo %</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>
                    Giá trị <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => handleChange('discountValue', parseFloat(e.target.value))}
                    min="0"
                    step={formData.discountType === 'PERCENTAGE' ? '1' : '1000'}
                    className={errors.discountValue ? styles.error : ''}
                  />
                  {errors.discountValue && <span className={styles.errorText}>{errors.discountValue}</span>}
                  <small>
                    {formData.discountType === 'PERCENTAGE' ? 'Nhập số từ 1-100' : 'Nhập số tiền (VNĐ)'}
                  </small>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={errors.startDate ? styles.error : ''}
                  />
                  {errors.startDate && <span className={styles.errorText}>{errors.startDate}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label>Ngày kết thúc</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    className={errors.endDate ? styles.error : ''}
                  />
                  {errors.endDate && <span className={styles.errorText}>{errors.endDate}</span>}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className={styles.column}>
              <h3>Điều kiện áp dụng</h3>

              <div className={styles.formGroup}>
                <label>Áp dụng cho</label>
                <select
                  value={formData.applicableTo}
                  onChange={(e) => handleChange('applicableTo', e.target.value as ApplicableTo)}
                >
                  <option value="CUSTOMER">Khách hàng</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>
                  Mẫu xe áp dụng <span className={styles.required}>*</span>
                </label>
                
                <div className={`${styles.vehicleSelectBox} ${errors.vehicleIds ? styles.error : ''}`}>
                  <div 
                    className={styles.selectHeader}
                    onClick={() => setVehicleDropdownOpen(!vehicleDropdownOpen)}
                  >
                    <div className={styles.selectedInfo}>
                      <i className="fas fa-car"></i>
                      <span>
                        {formData.vehicleIds.length === 0 
                          ? 'Chọn mẫu xe...' 
                          : `Đã chọn ${formData.vehicleIds.length} mẫu xe`}
                      </span>
                    </div>
                    <i className={`fas fa-chevron-${vehicleDropdownOpen ? 'up' : 'down'}`}></i>
                  </div>
                  
                  {vehicleDropdownOpen && (
                    <div className={styles.dropdownContent}>
                      <div className={styles.selectAllRow}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={formData.vehicleIds.length === vehicles.length && vehicles.length > 0}
                            onChange={handleSelectAll}
                          />
                          <span>Chọn tất cả ({formData.vehicleIds.length}/{vehicles.length})</span>
                        </label>
                      </div>
                      
                      <div className={styles.vehicleList}>
                        {vehicles.length === 0 ? (
                          <div className={styles.emptyVehicles}>
                            <i className="fas fa-spinner fa-spin"></i>
                            <p>Đang tải danh sách xe...</p>
                          </div>
                        ) : (
                          vehicles.map(vehicle => (
                            <label key={vehicle.vehicleId} className={styles.vehicleItem}>
                              <input
                                type="checkbox"
                                checked={formData.vehicleIds.includes(vehicle.vehicleId)}
                                onChange={() => handleVehicleSelect(vehicle.vehicleId)}
                              />
                              <div className={styles.vehicleInfo}>
                                <div className={styles.vehicleName}>
                                  <strong>{vehicle.modelName}</strong>
                                  <span className={styles.version}>{vehicle.version}</span>
                                </div>
                                <div className={styles.vehicleDetails}>
                                  <span className={styles.color}>
                                    <i className="fas fa-circle"></i>
                                    {vehicle.color}
                                  </span>
                                  <span className={styles.price}>
                                    {vehicle.priceRetail.toLocaleString('vi-VN')}₫
                                  </span>
                                </div>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {errors.vehicleIds && <span className={styles.errorText}>{errors.vehicleIds}</span>}
                <small>Chọn ít nhất 1 mẫu xe để áp dụng khuyến mãi.</small>
              </div>

              <div className={styles.infoBox}>
                <i className="fas fa-info-circle"></i>
                <div>
                  <strong>Lưu ý</strong>
                  <p>
                    Khuyến mãi sẽ được tự động kích hoạt khi đến ngày bắt đầu và tự động kết thúc khi hết hạn.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              <i className="fas fa-times"></i>
              Hủy
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              <i className={loading ? 'fas fa-spinner fa-spin' : 'fas fa-check'}></i>
              {loading ? 'Đang xử lý...' : (promotion ? 'Cập nhật' : 'Tạo mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromoForm;
