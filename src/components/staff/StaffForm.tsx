import React, { useState, useEffect } from 'react';
import type { Staff, CreateStaffPayload, UpdateStaffPayload } from '../../types/staff';
import styles from '../../styles/StaffStyles/StaffForm.module.scss';

interface StaffFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStaffPayload | UpdateStaffPayload) => Promise<void>;
  staff?: Staff | null;
  isLoading?: boolean;
}

const StaffForm: React.FC<StaffFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  staff,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    phone: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize form data when staff prop changes
  useEffect(() => {
    if (staff) {
      // Edit mode - only editable fields
      setFormData({
        username: '', // Not editable
        password: '', // Not used in edit
        confirmPassword: '', // Not used in edit
        fullName: staff.fullName,
        email: staff.email,
        phone: staff.phone
      });
    } else {
      // Create mode - reset all fields
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        email: '',
        phone: ''
      });
    }
    setErrors({});
    setTouched({});
  }, [staff, isOpen]);

  const handleInputChange = (field: string, value: string) => {
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

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Common validations for both create and edit
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^0[0-9]{9}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại phải bắt đầu bằng 0 và có 10 chữ số';
    }

    // Create mode validations
    if (!staff) {
      if (!formData.username.trim()) {
        newErrors.username = 'Vui lòng nhập tên đăng nhập';
      } else if (formData.username.trim().length < 3) {
        newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới';
      }

      if (!formData.password) {
        newErrors.password = 'Vui lòng nhập mật khẩu';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      username: true,
      password: true,
      confirmPassword: true,
      fullName: true,
      email: true,
      phone: true
    });

    if (!validateForm()) {
      return;
    }

    try {
      if (staff) {
        // Edit mode - only send editable fields
        const payload: UpdateStaffPayload = {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim()
        };
        await onSubmit(payload);
      } else {
        // Create mode - send all fields
        const payload: CreateStaffPayload = {
          username: formData.username.trim(),
          password: formData.password,
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim()
        };
        await onSubmit(payload);
      }
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

  const isEditMode = !!staff;

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div 
        className={styles.modal}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-form-title"
      >
        <div className={styles.header}>
          <h2 id="staff-form-title" className={styles.title}>
            <i className={isEditMode ? "fas fa-user-edit" : "fas fa-user-plus"} />
            {isEditMode ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
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
            {/* Username - Only for create mode */}
            {!isEditMode && (
              <div className={styles.formGroup}>
                <label htmlFor="username" className={styles.label}>
                  <i className="fas fa-user"></i> Tên đăng nhập <span className={styles.required}>*</span>
                </label>
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value.trim())}
                  onBlur={() => handleBlur('username')}
                  className={`${styles.input} ${errors.username ? styles.error : ''}`}
                  placeholder="VD: nguyenvana"
                  maxLength={50}
                  autoFocus
                />
                {errors.username && touched.username && (
                  <span className={styles.errorText}>
                    <i className="fa-solid fa-exclamation-circle"></i>
                    {errors.username}
                  </span>
                )}
              </div>
            )}

            {/* Password fields - Only for create mode */}
            {!isEditMode && (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="password" className={styles.label}>
                    <i className="fas fa-lock"></i> Mật khẩu <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    className={`${styles.input} ${errors.password ? styles.error : ''}`}
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    maxLength={100}
                  />
                  {errors.password && touched.password && (
                    <span className={styles.errorText}>
                      <i className="fa-solid fa-exclamation-circle"></i>
                      {errors.password}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword" className={styles.label}>
                    <i className="fas fa-lock"></i> Xác nhận mật khẩu <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    onBlur={() => handleBlur('confirmPassword')}
                    className={`${styles.input} ${errors.confirmPassword ? styles.error : ''}`}
                    placeholder="Nhập lại mật khẩu"
                    maxLength={100}
                  />
                  {errors.confirmPassword && touched.confirmPassword && (
                    <span className={styles.errorText}>
                      <i className="fa-solid fa-exclamation-circle"></i>
                      {errors.confirmPassword}
                    </span>
                  )}
                </div>
              </>
            )}

            {/* Full Name */}
            <div className={styles.formGroup}>
              <label htmlFor="fullName" className={styles.label}>
                <i className="fas fa-id-badge"></i> Họ và tên <span className={styles.required}>*</span>
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
                autoFocus={isEditMode}
              />
              {errors.fullName && touched.fullName && (
                <span className={styles.errorText}>
                  <i className="fa-solid fa-exclamation-circle"></i>
                  {errors.fullName}
                </span>
              )}
            </div>

            {/* Email */}
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

            {/* Phone */}
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
                isEditMode ? 'Cập nhật' : 'Thêm nhân viên'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffForm;
