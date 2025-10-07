import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { authApi } from '../services/authApi';
import { SuccessModal } from './SuccessModal';
import "../styles/AuthStyles/_authforms.scss";

interface RegisterFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onRegisterSuccess?: (userData: any) => void;
}

interface FormData {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  dealerName: string;
  address: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface FormErrors {
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  dealerName?: string;
  address?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
  general?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ 
  isOpen, 
  onClose, 
  onSwitchToLogin, 
  onRegisterSuccess 
}) => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    dealerName: '',
    address: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredUserName, setRegisteredUserName] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Real-time validation
    const fieldErrors: FormErrors = {};
    
    if (name === 'fullName') {
      if (value.trim() && value.trim().length < 2) {
        fieldErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
      } else if (value.trim() && !/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/.test(value)) {
        fieldErrors.fullName = 'Họ tên chỉ được chứa chữ cái và khoảng trắng';
      } else {
        fieldErrors.fullName = undefined;
      }
    }
    
    if (name === 'username') {
      if (value.trim() && value.length < 3) {
        fieldErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
      } else if (value.trim() && /\s/.test(value)) {
        fieldErrors.username = 'Tên đăng nhập không được chứa khoảng trắng';
      } else if (value.trim() && !/^[a-zA-Z0-9_]+$/.test(value)) {
        fieldErrors.username = 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu _';
      } else {
        fieldErrors.username = undefined;
      }
    }
    
    if (name === 'email') {
      if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        fieldErrors.email = 'Email không hợp lệ';
      } else {
        fieldErrors.email = undefined;
      }
    }
    
    if (name === 'phone') {
      const cleanPhone = value.replace(/[\s\-]/g, '');
      if (value.trim() && !/^(\+84|0)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/.test(cleanPhone)) {
        fieldErrors.phone = 'Số điện thoại không hợp lệ ';
      } else {
        fieldErrors.phone = undefined;
      }
    }
    
    if (name === 'dealerName') {
      if (value.trim() && value.trim().length < 2) {
        fieldErrors.dealerName = 'Tên đại lý phải có ít nhất 2 ký tự';
      } else {
        fieldErrors.dealerName = undefined;
      }
    }
    
    if (name === 'address') {
      if (value.trim() && value.trim().length < 5) {
        fieldErrors.address = 'Địa chỉ phải có ít nhất 5 ký tự';
      } else {
        fieldErrors.address = undefined;
      }
    }
    
    if (name === 'password') {
      if (value && value.length < 6) {
        fieldErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      } else if (value && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(value)) {
        fieldErrors.password = 'Mật khẩu phải chứa chữ hoa, chữ thường và số';
      } else {
        fieldErrors.password = undefined;
      }
    }
    
    if (name === 'confirmPassword') {
      if (value && value !== formData.password) {
        fieldErrors.confirmPassword = 'Xác nhận mật khẩu không khớp';
      } else {
        fieldErrors.confirmPassword = undefined;
      }
    }

    // Update errors
    setErrors(prev => ({
      ...prev,
      [name]: fieldErrors[name as keyof FormErrors]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên là bắt buộc';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
    } else if (!/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/.test(formData.fullName)) {
      newErrors.fullName = 'Họ tên chỉ được chứa chữ cái và khoảng trắng';
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Tên đăng nhập là bắt buộc';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    } else if (/\s/.test(formData.username)) {
      newErrors.username = 'Tên đăng nhập không được chứa khoảng trắng';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu _';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Phone validation - Vietnamese format
    if (!formData.phone) {
      newErrors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^(\+84|0)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/.test(formData.phone.replace(/[\s\-]/g, ''))) {
      newErrors.phone = 'Số điện thoại Việt Nam không hợp lệ (VD: 0901234567)';
    }

    // Dealer name validation
    if (!formData.dealerName.trim()) {
      newErrors.dealerName = 'Tên đại lý là bắt buộc';
    } else if (formData.dealerName.trim().length < 2) {
      newErrors.dealerName = 'Tên đại lý phải có ít nhất 2 ký tự';
    }
    
    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Địa chỉ là bắt buộc';
    } else if (formData.address.trim().length < 5) {
      newErrors.address = 'Địa chỉ phải có ít nhất 5 ký tự';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải chứa chữ hoa, chữ thường và số';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    // Terms agreement validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'Bạn phải đồng ý với điều khoản sử dụng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Call API
      const result = await authApi.register({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        dealerName: formData.dealerName,
        address: formData.address,
        username: formData.username,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });
      
      if (result.success) {
        // Set user name for success modal
        setRegisteredUserName(formData.fullName);
        
        // Reset form
        setFormData({
          fullName: '',
          username: '',
          email: '',
          phone: '',
          dealerName: '',
          address: '',
          password: '',
          confirmPassword: '',
          agreeToTerms: false
        });
        
        // Close register form first
        onClose();
        
        // Then show success modal after a small delay
        setTimeout(() => {
          setShowSuccessModal(true);
        }, 100);
      } else {
        setErrors({ general: result.message || 'Đăng ký thất bại' });
      }
      
    } catch (error) {
      setErrors({
        general: 'Đăng ký thất bại. Vui lòng thử lại sau.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div className="auth-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal register-modal">
        <button className="auth-close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>

        <div className="auth-header">
          <div className="auth-logo">
            <i className="fas fa-user-plus"></i>
          </div>
          <h2>Đăng ký đại lý</h2>
          <p>Tham gia cùng chúng tôi để trở thành đối tác kinh doanh</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {errors.general && (
            <div className="auth-error-message">
              {errors.general}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <div className="input-wrapper">
                <i className="fas fa-user input-icon"></i>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Họ và tên *"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={errors.fullName ? 'error' : ''}
                />
              </div>
              {errors.fullName && (
                <span className="field-error">
                  <i className="fa-solid fa-exclamation-circle"></i>
                  {errors.fullName}
                </span>
              )}
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <i className="fas fa-envelope input-icon"></i>
                <input
                  type="email"
                  name="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'error' : ''}
                />
              </div>
              {errors.email && (
                <span className="field-error">
                  <i className="fa-solid fa-exclamation-circle"></i>
                  {errors.email}
                </span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <div className="input-wrapper">
                <i className="fas fa-at input-icon"></i>
                <input
                  type="text"
                  name="username"
                  placeholder="Tên đăng nhập *"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={errors.username ? 'error' : ''}
                />
              </div>
              {errors.username && (
                <span className="field-error">
                  <i className="fa-solid fa-exclamation-circle"></i>
                  {errors.username}
                </span>
              )}
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <i className="fas fa-building input-icon"></i>
                <input
                  type="text"
                  name="dealerName"
                  placeholder="Tên đại lý"
                  value={formData.dealerName}
                  onChange={handleInputChange}
                  className={errors.dealerName ? 'error' : ''}
                />
              </div>
              {errors.dealerName && (
                <span className="field-error">
                  <i className="fa-solid fa-exclamation-circle"></i>
                  {errors.dealerName}
                </span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <div className="input-wrapper">
                <i className="fas fa-phone input-icon"></i>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Số điện thoại *"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={errors.phone ? 'error' : ''}
                />
              </div>
              {errors.phone && (
                <span className="field-error">
                  <i className="fa-solid fa-exclamation-circle"></i>
                  {errors.phone}
                </span>
              )}
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <i className="fas fa-lock input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Mật khẩu *"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={errors.password ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {errors.password && (
                <span className="field-error">
                  <i className="fa-solid fa-exclamation-circle"></i>
                  {errors.password}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <div className="input-wrapper">
              <i className="fas fa-map-marker-alt input-icon"></i>
              <input
                type="text"
                name="address"
                placeholder="Địa chỉ *"
                value={formData.address}
                onChange={handleInputChange}
                className={errors.address ? 'error' : ''}
              />
            </div>
            {errors.address && (
              <span className="field-error">
                <i className="fa-solid fa-exclamation-circle"></i>
                {errors.address}
              </span>
            )}
          </div>

          <div className="form-group">
            <div className="input-wrapper">
              <i className="fas fa-lock input-icon"></i>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Nhập lại mật khẩu *"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={errors.confirmPassword ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="field-error">
                <i className="fa-solid fa-exclamation-circle"></i>
                {errors.confirmPassword}
              </span>
            )}
          </div>

          <div className="form-group terms-group">
            <label className="terms-checkbox">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
              />
              <span>
                Tôi đồng ý với{' '}
                <a href="#" target="_blank">Điều khoản sử dụng</a> và{' '}
                <a href="#" target="_blank">Chính sách bảo mật</a>
              </span>
            </label>
            {errors.agreeToTerms && (
              <span className="field-error">
                <i className="fa-solid fa-exclamation-circle"></i>
                {errors.agreeToTerms}
              </span>
            )}
          </div>

          <button 
            type="submit" 
            className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Đang đăng ký...
              </>
            ) : (
              'Đăng ký đại lý'
            )}
          </button>

          <div className="auth-switch">
            <p>
              Đã có tài khoản đại lý?{' '}
              <button type="button" onClick={onSwitchToLogin}>
                Đăng nhập ngay
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modalContent, document.body)}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        type="register"
        userName={registeredUserName}
        onContinue={() => {
          setShowSuccessModal(false);
          if (onRegisterSuccess) {
            onRegisterSuccess({ fullName: registeredUserName });
          }
        }}
      />
    </>
  );
};

export default RegisterForm;