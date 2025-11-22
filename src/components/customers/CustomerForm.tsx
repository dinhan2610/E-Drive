import React, { useState, useEffect } from 'react';
import type { Customer, CustomerFormData } from '../../types/customer';
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
  // Add gender options
  const genderOptions = [
    { value: 'Nam', label: 'Nam' },
    { value: 'Nữ', label: 'Nữ' },
    { value: 'Khác', label: 'Khác' }
  ];

  const [formData, setFormData] = useState<CustomerFormData>({
    fullName: '',
    dob: '',
    gender: '',
    email: '',
    phone: '',
    address: '',
    idCardNo: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize form data when customer prop changes
  useEffect(() => {
    if (customer) {
      setFormData({
        fullName: customer.fullName,
        dob: customer.dob,
        gender: customer.gender,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        idCardNo: customer.idCardNo
      });
    } else {
      // Reset form for new customer
      setFormData({
        fullName: '',
        dob: '',
        gender: '',
        email: '',
        phone: '',
        address: '',
        idCardNo: ''
      });
    }
    setErrors({});
    setTouched({});
  }, [customer, isOpen]);

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleBlur = (field: keyof CustomerFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateField = (field: keyof CustomerFormData, value: string) => {
    const validation = validateCustomerData({ ...formData, [field]: value });
    
    if (!validation.isValid && validation.errors[field]) {
      setErrors(prev => ({ ...prev, [field]: validation.errors[field] }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
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
                <i className="fas fa-user"></i> Họ và tên đầy đủ <span className={styles.required}>*</span>
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                onBlur={() => handleBlur('fullName')}
                className={`${styles.input} ${errors.fullName ? styles.error : ''}`}
                placeholder="VD: Nguyễn Văn A"
                maxLength={100}
                autoFocus
              />
              {errors.fullName && touched.fullName && (
                <span className={styles.errorText}>
                  <i className="fa-solid fa-exclamation-circle"></i>
                  {errors.fullName}
                </span>
              )}
            </div>

            {/* Two column row - DOB & Gender */}
            <div className={styles.twoColumnRow}>
              {/* Date of Birth */}
              <div className={styles.formGroup}>
                <label htmlFor="dob" className={styles.label}>
                  <i className="fas fa-calendar-alt"></i> Ngày sinh <span className={styles.required}>*</span>
                </label>
                <input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                  onBlur={() => handleBlur('dob')}
                  className={`${styles.input} ${errors.dob ? styles.error : ''}`}
                  min="1900-01-01"
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.dob && touched.dob && (
                  <span className={styles.errorText}>
                    <i className="fa-solid fa-exclamation-circle"></i>
                    {errors.dob}
                  </span>
                )}
              </div>

              {/* Gender */}
              <div className={styles.formGroup}>
                <label htmlFor="gender" className={styles.label}>
                  <i className="fas fa-venus-mars"></i> Giới tính <span className={styles.required}>*</span>
                </label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  onBlur={() => handleBlur('gender')}
                  className={`${styles.input} ${errors.gender ? styles.error : ''}`}
                >
                  <option value="">Chọn giới tính</option>
                  {genderOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.gender && touched.gender && (
                  <span className={styles.errorText}>
                    <i className="fa-solid fa-exclamation-circle"></i>
                    {errors.gender}
                  </span>
                )}
              </div>
            </div>

            {/* Email & Phone */}
            <div className={styles.twoColumnRow}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  <i className="fas fa-envelope"></i> Email <span className={styles.required}>*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value.trim())}
                  onBlur={() => handleBlur('email')}
                  className={`${styles.input} ${errors.email ? styles.error : ''}`}
                  placeholder="VD: example@gmail.com"
                  maxLength={100}
                />
                {errors.email && touched.email && (
                  <span className={styles.errorText}>
                    <i className="fa-solid fa-exclamation-circle"></i>
                    {errors.email}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>
                  <i className="fas fa-phone"></i> Số điện thoại <span className={styles.required}>*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    handleInputChange('phone', value);
                  }}
                  onBlur={() => handleBlur('phone')}
                  className={`${styles.input} ${errors.phone ? styles.error : ''}`}
                  placeholder="VD: 0901234567"
                  maxLength={10}
                />
                {errors.phone && touched.phone && (
                  <span className={styles.errorText}>
                    <i className="fa-solid fa-exclamation-circle"></i>
                    {errors.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Address */}
            <div className={styles.formGroup}>
              <label htmlFor="address" className={styles.label}>
                <i className="fas fa-map-marker-alt"></i> Địa chỉ <span className={styles.required}>*</span>
              </label>
              <input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                onBlur={() => handleBlur('address')}
                className={`${styles.input} ${errors.address ? styles.error : ''}`}
                placeholder="VD: 123 Nguyễn Văn Linh, Phường 1, Quận 7, TP.HCM"
                maxLength={500}
              />
              {errors.address && touched.address && (
                <span className={styles.errorText}>
                  <i className="fa-solid fa-exclamation-circle"></i>
                  {errors.address}
                </span>
              )}
            </div>

            {/* ID Card */}
            <div className={styles.formGroup}>
              <label htmlFor="idCardNo" className={styles.label}>
                <i className="fas fa-id-card"></i> CCCD/CMND
              </label>
              <input
                id="idCardNo"
                type="text"
                value={formData.idCardNo}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  handleInputChange('idCardNo', value);
                }}
                onBlur={() => handleBlur('idCardNo')}
                className={`${styles.input} ${errors.idCardNo ? styles.error : ''}`}
                placeholder="VD: 001234567890 (9 hoặc 12 số)"
                maxLength={12}
              />
              {errors.idCardNo && touched.idCardNo && (
                <span className={styles.errorText}>
                  <i className="fa-solid fa-exclamation-circle"></i>
                  {errors.idCardNo}
                </span>
              )}
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={handleCancel}
              className={`${styles.button} ${styles.cancelButton}`}
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.submitButton}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span><i className="fas fa-spinner fa-spin"></i> Đang xử lý...</span>
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