import React, { useState, useEffect } from 'react';
import type { Customer, CustomerFormData, CustomerStatus } from '../../types/customer';
import { validateCustomerData } from '../../services/customersApi';
import styles from '../../styles/CustomersStyles/CustomerForm.module.scss';

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  customer?: Customer | null;
  isLoading?: boolean;
}



const CustomerForm: React.FC<CustomerFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customer,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    interestedModel: '',
    notes: '',
    status: 'POTENTIAL'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize form data when customer prop changes
  useEffect(() => {
    if (customer) {
      setFormData({
        fullName: customer.fullName,
        email: customer.email || '',
        phoneNumber: customer.phone,
        address: '',
        interestedModel: customer.interestedModel || '',
        notes: customer.notes || '',
        status: customer.status
      });
    } else {
      // Reset form for new customer
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        address: '',
        interestedModel: '',
        notes: '',
        status: 'POTENTIAL'
      });
    }
    setErrors({});
    setTouched({});
  }, [customer, isOpen]);

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData((prev: CustomerFormData) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  const handleBlur = (field: keyof CustomerFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field] || '');
  };

  const validateField = (field: keyof CustomerFormData, value: string) => {
    const validation = validateCustomerData({ ...formData, [field]: value });
    
    if (!validation.isValid && validation.errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: validation.errors[field as string] }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const validation = validateCustomerData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div 
        className={styles.modal}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-form-title"
      >
        <div className={styles.header}>
          <h2 id="customer-form-title" className={styles.title}>
            <i className={customer ? "fas fa-user-edit" : "fas fa-user-plus"} />
            {customer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleCancel}
            aria-label="Đóng form"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.formGrid}>
            {/* Full Name */}
            <div className={styles.formGroup}>
              <label htmlFor="fullName" className={styles.label}>
                Họ và tên đầy đủ <span className={styles.required}>*</span>
              </label>
                <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                onBlur={() => handleBlur('fullName')}
                className={`${styles.input} ${errors.fullName ? styles.error : ''}`}
                placeholder="Nhập họ và tên đầy đủ của khách hàng"
                autoFocus
              />
              {errors.fullName && touched.fullName && (
                <span className={styles.errorText}>
                  <i className="fa-solid fa-exclamation-circle"></i>
                  {errors.fullName}
                </span>
              )}
            </div>

            {/* Two column row - Email & Phone */}
            <div className={styles.twoColumnRow}>
              {/* Email */}
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Địa chỉ Email <span className={styles.required}>*</span>
                </label>
                <input
                  id="email"
                  type="text"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`${styles.input} ${errors.email ? styles.error : ''}`}
                  placeholder="example@email.com"
                />
                {errors.email && touched.email && (
                  <span className={styles.errorText}>
                    <i className="fa-solid fa-exclamation-circle"></i>
                    {errors.email}
                  </span>
                )}
              </div>

              {/* Phone Number */}
              <div className={styles.formGroup}>
                <label htmlFor="phoneNumber" className={styles.label}>
                  Số điện thoại <span className={styles.required}>*</span>
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  onBlur={() => handleBlur('phoneNumber')}
                  className={`${styles.input} ${errors.phoneNumber ? styles.error : ''}`}
                  placeholder="0987 654 321"
                  pattern="[0-9]{10,11}"
                  autoComplete="tel"
                />
                {errors.phoneNumber && touched.phoneNumber && (
                  <span className={styles.errorText}>
                    <i className="fa-solid fa-exclamation-circle"></i>
                    {errors.phoneNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Two column row - Status & Interested Model */}
            <div className={styles.twoColumnRow}>
              {/* Status */}
              <div className={styles.formGroup}>
                <label htmlFor="status" className={styles.label}>
                  Trạng thái khách hàng
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as CustomerStatus)}
                  className={styles.select}
                >
                  <option value="POTENTIAL">Tiềm năng</option>
                  <option value="TEST_DRIVE">Lái thử</option>
                  <option value="NEED_CONSULTING">Cần tư vấn</option>
                  <option value="PURCHASED">Đã mua</option>
                </select>
              </div>

              {/* Interested Model */}
              <div className={styles.formGroup}>
                <label htmlFor="interestedModel" className={styles.label}>
                  Mẫu xe quan tâm
                </label>
                <input
                  id="interestedModel"
                  type="text"
                  value={formData.interestedModel}
                  onChange={(e) => handleInputChange('interestedModel', e.target.value)}
                  className={styles.input}
                  placeholder="VinFast VF 8, Tesla Model Y, BMW iX..."
                />
              </div>
            </div>

            {/* Address */}
            <div className={styles.formGroup}>
              <label htmlFor="address" className={styles.label}>
                Địa chỉ liên hệ
              </label>
              <input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className={styles.input}
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
              />
            </div>

            {/* Notes */}
            <div className={styles.formGroup}>
              <label htmlFor="notes" className={styles.label}>
                Ghi chú và thông tin bổ sung
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className={styles.textarea}
                placeholder="Thông tin bổ sung về khách hàng, sở thích, yêu cầu đặc biệt..."
                rows={4}
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              <i className="fas fa-times" />
              Hủy
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Đang xử lý...
                </>
              ) : (
                customer ? 'Cập nhật khách hàng' : 'Thêm khách hàng mới'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;