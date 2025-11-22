import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPromotion, updatePromotion, listPromotions } from '../services/promotionsApi';
import { fetchVehiclesFromApi } from '../services/vehicleApi';
import { getProfile } from '../services/profileApi';
import type { PromoType, ApplicableTo } from '../types/promotion';
import type { VehicleApiResponse } from '../types/product';
import styles from './PromotionFormPage.module.scss';

interface GroupedModel {
  modelName: string;
  version: string;
  colors: Array<{
    vehicleId: number;
    color: string;
    inStock: boolean;
  }>;
}

const PromotionFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountType: 'PERCENTAGE' as PromoType,
    discountValue: 0,
    startDate: '',
    endDate: '',
    applicableTo: 'VEHICLE' as ApplicableTo,
    vehicleIds: [] as number[]
  });
  const [loading, setLoading] = useState(false);
  const [loadingPromotion, setLoadingPromotion] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [groupedModels, setGroupedModels] = useState<GroupedModel[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [dealerId, setDealerId] = useState<number>(0);
  const [displayValue, setDisplayValue] = useState<string>(''); // For formatted display

  // Format number as VND currency
  const formatCurrency = (value: number): string => {
    if (!value) return '';
    return value.toLocaleString('vi-VN');
  };

  // Parse formatted currency string to number
  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
  };

  // Load dealer info
  useEffect(() => {
    const fetchDealerInfo = async () => {
      try {
        const profile = await getProfile();
        setDealerId(profile.dealerId);
      } catch (error) {
        console.error('Failed to fetch dealer info:', error);
      }
    };
    fetchDealerInfo();
  }, []);

  // Load vehicles
  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const result = await fetchVehiclesFromApi({ size: 1000 });
      
      const grouped = new Map<string, VehicleApiResponse[]>();
      result.vehicles.forEach(vehicle => {
        const key = `${vehicle.modelName}|||${vehicle.version}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(vehicle);
      });
      
      const models: GroupedModel[] = [];
      grouped.forEach((vehicleGroup, key) => {
        const [modelName, version] = key.split('|||');
        models.push({
          modelName,
          version,
          colors: vehicleGroup.map(v => ({
            vehicleId: v.vehicleId,
            color: v.color,
            inStock: v.status === 'AVAILABLE'
          }))
        });
      });
      
      setGroupedModels(models);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  // Load promotion for edit mode
  useEffect(() => {
    if (isEditMode && id && dealerId) {
      loadPromotion();
    }
  }, [isEditMode, id, dealerId, groupedModels]);

  const loadPromotion = async () => {
    setLoadingPromotion(true);
    try {
      const response = await listPromotions(dealerId, { page: 1 });
      const promo = response.items.find((p: any) => p.promoId === parseInt(id!));
      
      if (!promo) {
        alert('Không tìm thấy khuyến mãi');
        navigate('/promotions');
        return;
      }

      // Auto-select models based on vehicleIds
      const modelsToSelect: string[] = [];
      if (promo.vehicleIds && promo.vehicleIds.length > 0 && groupedModels.length > 0) {
        groupedModels.forEach(model => {
          const hasSelectedColors = model.colors.some(c => 
            promo.vehicleIds?.includes(c.vehicleId)
          );
          if (hasSelectedColors) {
            modelsToSelect.push(`${model.modelName}|||${model.version}`);
          }
        });
      }
      
      setFormData({
        title: promo.title,
        description: promo.description,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        startDate: promo.startDate,
        endDate: promo.endDate,
        applicableTo: promo.applicableTo,
        vehicleIds: promo.vehicleIds || []
      });
      
      setSelectedModels(modelsToSelect);
    } catch (error) {
      console.error('Failed to load promotion:', error);
      alert('Có lỗi khi tải thông tin khuyến mãi');
    } finally {
      setLoadingPromotion(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tên chương trình';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Tên chương trình phải có ít nhất 5 ký tự';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Tên chương trình không được vượt quá 200 ký tự';
    }

    if (formData.description.trim() && formData.description.trim().length > 1000) {
      newErrors.description = 'Mô tả không được vượt quá 1000 ký tự';
    }

    if (!formData.discountValue || formData.discountValue <= 0) {
      newErrors.discountValue = 'Giá trị phải lớn hơn 0';
    } else if (formData.discountType === 'PERCENTAGE') {
      if (formData.discountValue < 1) {
        newErrors.discountValue = 'Phần trăm giảm giá phải ít nhất 1%';
      } else if (formData.discountValue > 100) {
        newErrors.discountValue = 'Phần trăm giảm giá không được quá 100%';
      }
    } else if (formData.discountType === 'FIXED_AMOUNT') {
      if (formData.discountValue < 1000) {
        newErrors.discountValue = 'Số tiền giảm giá phải ít nhất 1.000₫';
      } else if (formData.discountValue > 1000000000) {
        newErrors.discountValue = 'Số tiền giảm giá không được quá 1 tỷ đồng';
      }
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Vui lòng chọn ngày bắt đầu';
    } else {
      const startDate = new Date(formData.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      if (!isEditMode && startDate < today) {
        newErrors.startDate = 'Ngày bắt đầu không được trong quá khứ';
      }
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Vui lòng chọn ngày kết thúc';
    } else if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate <= startDate) {
        newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu ít nhất 1 ngày';
      }
      
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 365) {
        newErrors.endDate = 'Thời gian khuyến mãi không nên quá 1 năm';
      }
    }

    if (!formData.vehicleIds || formData.vehicleIds.length === 0) {
      newErrors.vehicleIds = 'Phải chọn ít nhất 1 mẫu xe để áp dụng khuyến mãi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        await updatePromotion(dealerId, parseInt(id!), formData);
        alert('Cập nhật khuyến mãi thành công!');
      } else {
        await createPromotion(dealerId, formData);
        alert('Tạo khuyến mãi thành công!');
      }
      navigate('/promotions');
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

  const handleSelectAllModels = () => {
    if (selectedModels.length === groupedModels.length) {
      setSelectedModels([]);
      setFormData(fd => ({ ...fd, vehicleIds: [] }));
    } else {
      const allModelKeys = groupedModels.map(m => `${m.modelName}|||${m.version}`);
      setSelectedModels(allModelKeys);
    }
  };

  const handleSelectAllColors = () => {
    const allAvailableColorIds = availableColors.map(c => c.vehicleId);
    if (formData.vehicleIds.length === allAvailableColorIds.length) {
      setFormData(fd => ({ ...fd, vehicleIds: [] }));
    } else {
      setFormData(fd => ({ ...fd, vehicleIds: allAvailableColorIds }));
    }
  };

  const availableColors = useMemo(() => {
    if (selectedModels.length === 0) return [];
    const colors: GroupedModel['colors'] = [];
    selectedModels.forEach(modelKey => {
      const model = groupedModels.find(m => `${m.modelName}|||${m.version}` === modelKey);
      if (model) {
        colors.push(...model.colors);
      }
    });
    return colors;
  }, [selectedModels, groupedModels]);

  if (loadingPromotion) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}>
          <i className="fas fa-circle-notch fa-spin"></i>
        </div>
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

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
            <i className={isEditMode ? 'fas fa-edit' : 'fas fa-plus-circle'}></i>
            {isEditMode ? 'Chỉnh sửa khuyến mãi' : 'Tạo khuyến mãi mới'}
          </h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        <div className={styles.formGrid}>
          {/* Left Column */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-info-circle"></i>
              Thông tin chương trình
            </h2>

            <div className={styles.formGroup}>
              <label>
                <i className="fas fa-heading"></i>
                Tên chương trình <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="VD: Khuyến mãi đầu năm 2025 - Giảm giá lên đến 20%"
                maxLength={200}
                className={errors.title ? styles.error : ''}
              />
              {errors.title && (
                <span className={styles.errorText}>
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.title}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>
                <i className="fas fa-align-left"></i>
                Mô tả
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Mô tả chi tiết về chương trình khuyến mãi, điều kiện áp dụng..."
                rows={4}
                maxLength={1000}
                className={errors.description ? styles.error : ''}
              />
              {errors.description && (
                <span className={styles.errorText}>
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.description}
                </span>
              )}
              <small className={styles.charCount}>
                {formData.description.length}/1000 ký tự
              </small>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>
                  <i className="fas fa-tags"></i>
                  Loại khuyến mãi <span className={styles.required}>*</span>
                </label>
                <div className={styles.selectWrapper}>
                  <select
                    value={formData.discountType}
                    onChange={(e) => {
                      const newType = e.target.value as PromoType;
                      handleChange('discountType', newType);
                      handleChange('discountValue', 0);
                      setDisplayValue('');
                    }}
                    className={styles.selectStyled}
                  >
                    <option value="PERCENTAGE">Giảm theo phần trăm</option>
                    <option value="FIXED_AMOUNT">Giảm theo số tiền cố định</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>
                  <i className={formData.discountType === 'PERCENTAGE' ? 'fas fa-percent' : 'fas fa-money-bill-wave'}></i>
                  Giá trị giảm <span className={styles.required}>*</span>
                </label>
                {formData.discountType === 'PERCENTAGE' ? (
                  <input
                    type="number"
                    value={formData.discountValue || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0 && value <= 100) {
                        handleChange('discountValue', value);
                      } else if (e.target.value === '') {
                        handleChange('discountValue', 0);
                      }
                    }}
                    min="0"
                    max="100"
                    step="1"
                    placeholder="VD: 15"
                    className={errors.discountValue ? styles.error : ''}
                  />
                ) : (
                  <input
                    type="text"
                    value={displayValue}
                    onChange={(e) => {
                      const input = e.target.value;
                      const numericValue = parseCurrency(input);
                      if (numericValue <= 1000000000) {
                        handleChange('discountValue', numericValue);
                        setDisplayValue(numericValue ? formatCurrency(numericValue) : '');
                      }
                    }}
                    placeholder="VD: 5.000.000"
                    className={errors.discountValue ? styles.error : ''}
                  />
                )}
                {errors.discountValue && (
                  <span className={styles.errorText}>
                    <i className="fas fa-exclamation-circle"></i>
                    {errors.discountValue}
                  </span>
                )}
                <small className={styles.hint}>
                  {formData.discountType === 'PERCENTAGE' 
                    ? '💡 Nhập số từ 1-100 (%)' 
                    : '💰 Số tiền từ 1.000₫ - 1.000.000.000₫'}
                </small>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>
                  <i className="fas fa-calendar-check"></i>
                  Ngày bắt đầu <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  min={!isEditMode ? new Date().toISOString().split('T')[0] : undefined}
                  className={errors.startDate ? styles.error : ''}
                />
                {errors.startDate && (
                  <span className={styles.errorText}>
                    <i className="fas fa-exclamation-circle"></i>
                    {errors.startDate}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>
                  <i className="fas fa-calendar-times"></i>
                  Ngày kết thúc <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className={errors.endDate ? styles.error : ''}
                />
                {errors.endDate && (
                  <span className={styles.errorText}>
                    <i className="fas fa-exclamation-circle"></i>
                    {errors.endDate}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-car"></i>
              Mẫu xe áp dụng
            </h2>

            <div className={styles.vehicleSelection}>
              {/* Models Section */}
              <div className={styles.selectionSection}>
                <div className={styles.sectionHeader}>
                  <label>
                    
                    Chọn mẫu xe <span className={styles.required}>*</span>
                  </label>
                  <button
                    type="button"
                    className={styles.selectAllBtn}
                    onClick={handleSelectAllModels}
                    disabled={loadingVehicles || groupedModels.length === 0}
                  >
                    <i className={selectedModels.length === groupedModels.length && groupedModels.length > 0 ? 'fas fa-check-square' : 'far fa-square'}></i>
                    {selectedModels.length === groupedModels.length && groupedModels.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>
                
                <div className={`${styles.checkboxContainer} ${errors.vehicleIds ? styles.error : ''}`}>
                  {loadingVehicles ? (
                    <div className={styles.emptyState}>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Đang tải...</span>
                    </div>
                  ) : groupedModels.length === 0 ? (
                    <div className={styles.emptyState}>
                      <i className="fas fa-exclamation-circle"></i>
                      <span>Không có mẫu xe nào</span>
                    </div>
                  ) : (
                    groupedModels.map((model, index) => {
                      const modelKey = `${model.modelName}|||${model.version}`;
                      const isChecked = selectedModels.includes(modelKey);
                      return (
                        <label key={index} className={`${styles.checkboxItem} ${isChecked ? styles.checked : ''}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedModels(prev => prev.filter(k => k !== modelKey));
                                const model = groupedModels.find(m => `${m.modelName}|||${m.version}` === modelKey);
                                if (model) {
                                  const colorIds = model.colors.map(c => c.vehicleId);
                                  setFormData(fd => ({
                                    ...fd,
                                    vehicleIds: fd.vehicleIds.filter(id => !colorIds.includes(id))
                                  }));
                                }
                              } else {
                                setSelectedModels(prev => [...prev, modelKey]);
                              }
                              if (errors.vehicleIds) {
                                setErrors(prev => ({ ...prev, vehicleIds: '' }));
                              }
                            }}
                          />
                          <span className={styles.checkboxLabel}>
                            {model.modelName} <strong>{model.version}</strong>
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
                
                <div className={styles.counter}>
                  <i className="fas fa-check-circle"></i>
                  Đã chọn: <strong>{selectedModels.length}/{groupedModels.length}</strong> mẫu xe
                </div>
              </div>

              {/* Colors Section */}
              <div className={styles.selectionSection}>
                <div className={styles.sectionHeader}>
                  <label>
                    
                    Chọn màu sắc <span className={styles.required}>*</span>
                  </label>
                  <button
                    type="button"
                    className={styles.selectAllBtn}
                    onClick={handleSelectAllColors}
                    disabled={selectedModels.length === 0 || availableColors.length === 0}
                  >
                    <i className={formData.vehicleIds.length === availableColors.length && availableColors.length > 0 ? 'fas fa-check-square' : 'far fa-square'}></i>
                    {formData.vehicleIds.length === availableColors.length && availableColors.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>
                
                <div className={`${styles.checkboxContainer} ${errors.vehicleIds ? styles.error : ''}`}>
                  {selectedModels.length === 0 ? (
                    <div className={styles.emptyState}>
                      <i className="fas fa-info-circle"></i>
                      <span>Chọn mẫu xe trước</span>
                    </div>
                  ) : availableColors.length === 0 ? (
                    <div className={styles.emptyState}>
                      <i className="fas fa-exclamation-circle"></i>
                      <span>Không có màu nào</span>
                    </div>
                  ) : (
                    availableColors.map((color) => {
                      const isChecked = formData.vehicleIds.includes(color.vehicleId);
                      const model = groupedModels.find(m => 
                        m.colors.some(c => c.vehicleId === color.vehicleId)
                      );
                      return (
                        <label key={color.vehicleId} className={`${styles.checkboxItem} ${isChecked ? styles.checked : ''} ${!color.inStock ? styles.outOfStock : ''}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setFormData(fd => ({
                                  ...fd,
                                  vehicleIds: fd.vehicleIds.filter(id => id !== color.vehicleId)
                                }));
                              } else {
                                setFormData(fd => ({
                                  ...fd,
                                  vehicleIds: [...fd.vehicleIds, color.vehicleId]
                                }));
                              }
                              if (errors.vehicleIds) {
                                setErrors(prev => ({ ...prev, vehicleIds: '' }));
                              }
                            }}
                          />
                          <span className={styles.checkboxLabel}>
                            <span className={styles.colorName}>
                              {model?.modelName} {model?.version} - {color.color}
                            </span>
                            {!color.inStock && <span className={styles.outOfStockBadge}>Hết hàng</span>}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
                
                <div className={styles.counter}>
                  <i className="fas fa-check-circle"></i>
                  Đã chọn: <strong>{formData.vehicleIds.length}/{availableColors.length}</strong> màu
                </div>
                
                {errors.vehicleIds && (
                  <span className={styles.errorText}>
                    <i className="fas fa-exclamation-circle"></i>
                    {errors.vehicleIds}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.infoBox}>
              <i className="fas fa-info-circle"></i>
              <div>
                <strong>Lưu ý quan trọng</strong>
                <p>
                  Khuyến mãi sẽ được tự động kích hoạt khi đến ngày bắt đầu và tự động kết thúc khi hết hạn.
                  Hãy đảm bảo chọn đúng mẫu xe và màu sắc áp dụng.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.formFooter}>
          <button type="button" className={styles.cancelBtn} onClick={() => navigate('/promotions')}>
            <i className="fas fa-times"></i>
            Hủy bỏ
          </button>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            <i className={loading ? 'fas fa-spinner fa-spin' : 'fas fa-check'}></i>
            {loading ? 'Đang xử lý...' : (isEditMode ? 'Cập nhật khuyến mãi' : 'Tạo khuyến mãi')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PromotionFormPage;
