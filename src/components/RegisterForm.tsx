import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { authApi } from '../services/authApi';
import { SuccessModal } from './SuccessModal';
import "../styles/AuthStyles/_authforms.scss";

interface RegisterFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

interface FormData {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  dealerName: string;
  houseNumberAndStreet: string;
  wardOrCommune: string;
  district: string;
  provinceOrCity: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  businessLicense: File | null;
}

interface FormErrors {
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  dealerName?: string;
  houseNumberAndStreet?: string;
  wardOrCommune?: string;
  district?: string;
  provinceOrCity?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
  businessLicense?: string;
  general?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ 
  isOpen, 
  onClose, 
  onSwitchToLogin
}) => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    dealerName: '',
    houseNumberAndStreet: '',
    wardOrCommune: '',
    district: '',
    provinceOrCity: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    businessLicense: null
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredUserName, setRegisteredUserName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        businessLicense: 'Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)'
      }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        businessLicense: 'Kích thước file không được vượt quá 5MB'
      }));
      return;
    }

    // Clear error and set file
    setErrors(prev => ({
      ...prev,
      businessLicense: undefined
    }));

    setFormData(prev => ({
      ...prev,
      businessLicense: file
    }));

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({
      ...prev,
      businessLicense: null
    }));
    setPreviewUrl(null);
    setErrors(prev => ({
      ...prev,
      businessLicense: undefined
    }));
  };

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
        fieldErrors.fullName = 'Họ và Tên phải có ít nhất 2 ký tự';
      } else if (value.trim() && !/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/.test(value)) {
        fieldErrors.fullName = 'Họ và Tên chỉ được chứa chữ cái và khoảng trắng';
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
    
    if (name === 'houseNumberAndStreet') {
      if (value.trim() && value.trim().length < 5) {
        fieldErrors.houseNumberAndStreet = 'Số nhà và tên đường phải có ít nhất 5 ký tự';
      } else {
        fieldErrors.houseNumberAndStreet = undefined;
      }
    }
    
    if (name === 'wardOrCommune') {
      if (value.trim() && value.trim().length < 2) {
        fieldErrors.wardOrCommune = 'Phường/Xã phải có ít nhất 2 ký tự';
      } else {
        fieldErrors.wardOrCommune = undefined;
      }
    }
    
    if (name === 'district') {
      if (value.trim() && value.trim().length < 2) {
        fieldErrors.district = 'Quận/Huyện phải có ít nhất 2 ký tự';
      } else {
        fieldErrors.district = undefined;
      }
    }
    
    if (name === 'provinceOrCity') {
      if (value.trim() && value.trim().length < 2) {
        fieldErrors.provinceOrCity = 'Tỉnh/Thành phố phải có ít nhất 2 ký tự';
      } else {
        fieldErrors.provinceOrCity = undefined;
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
    
    // Address validations
    if (!formData.houseNumberAndStreet.trim()) {
      newErrors.houseNumberAndStreet = 'Số nhà và tên đường là bắt buộc';
    } else if (formData.houseNumberAndStreet.trim().length < 5) {
      newErrors.houseNumberAndStreet = 'Số nhà và tên đường phải có ít nhất 5 ký tự';
    }
    
    if (!formData.wardOrCommune.trim()) {
      newErrors.wardOrCommune = 'Phường/Xã là bắt buộc';
    } else if (formData.wardOrCommune.trim().length < 2) {
      newErrors.wardOrCommune = 'Phường/Xã phải có ít nhất 2 ký tự';
    }
    
    if (!formData.district.trim()) {
      newErrors.district = 'Quận/Huyện là bắt buộc';
    } else if (formData.district.trim().length < 2) {
      newErrors.district = 'Quận/Huyện phải có ít nhất 2 ký tự';
    }
    
    if (!formData.provinceOrCity.trim()) {
      newErrors.provinceOrCity = 'Tỉnh/Thành phố là bắt buộc';
    } else if (formData.provinceOrCity.trim().length < 2) {
      newErrors.provinceOrCity = 'Tỉnh/Thành phố phải có ít nhất 2 ký tự';
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

    // Business license validation (optional - not required)
    // Removed required validation for businessLicense

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
      let result;

      // Check if business license file is provided
      if (formData.businessLicense) {
        // Create FormData for multipart/form-data
        const apiFormData = new FormData();
        apiFormData.append('businessLicense', formData.businessLicense);

        // Create URL with query parameters (use dealerEmail instead of email)
        const params = new URLSearchParams({
          username: formData.username,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          dealerEmail: formData.email, // Backend expects dealerEmail
          phone: formData.phone,
          fullName: formData.fullName,
          dealerName: formData.dealerName,
          houseNumberAndStreet: formData.houseNumberAndStreet,
          wardOrCommune: formData.wardOrCommune,
          district: formData.district,
          provinceOrCity: formData.provinceOrCity
        });

        // Call API with FormData and URL params
        result = await authApi.registerWithFile(apiFormData, params.toString());
      } else {
        // Call standard register API without file (use dealerEmail)
        result = await authApi.register({
          fullName: formData.fullName,
          dealerEmail: formData.email, // Backend expects dealerEmail
          phone: formData.phone,
          dealerName: formData.dealerName,
          houseNumberAndStreet: formData.houseNumberAndStreet,
          wardOrCommune: formData.wardOrCommune,
          district: formData.district,
          provinceOrCity: formData.provinceOrCity,
          username: formData.username,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        });
      }
      
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
          houseNumberAndStreet: '',
          wardOrCommune: '',
          district: '',
          provinceOrCity: '',
          password: '',
          confirmPassword: '',
          agreeToTerms: false,
          businessLicense: null
        });
        setPreviewUrl(null);
        
        // Show success modal with verification pending message
        setShowSuccessModal(true);
      } else {
        setErrors({ general: result.message || 'Đăng ký thất bại' });
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Đăng ký thất bại. Vui lòng thử lại sau.';
      setErrors({
        general: errorMessage
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

          {/* THÔNG TIN CÁ NHÂN */}
          <div className="form-section">
            <h3 className="section-title">
              <i className="fas fa-user-circle"></i>
              Thông tin cá nhân
            </h3>
            
            <div className="form-row">
              <div className="form-group">
                <div className="input-wrapper">
                  <i className="fas fa-user input-icon"></i>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Họ và Tên *"
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

          {/* THÔNG TIN ĐĂNG NHẬP */}
          <div className="form-section">
            <h3 className="section-title">
              <i className="fas fa-shield-alt"></i>
              Thông tin đăng nhập
            </h3>
            
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

            <div className="form-row">
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
            </div>
          </div>

          {/* THÔNG TIN ĐẠI LÝ */}
          <div className="form-section">
            <h3 className="section-title">
              <i className="fas fa-store"></i>
              Thông tin đại lý
            </h3>
            
            <div className="form-group">
              <div className="input-wrapper">
                <i className="fas fa-building input-icon"></i>
                <input
                  type="text"
                  name="dealerName"
                  placeholder="Tên đại lý *"
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

          {/* ĐỊA CHỈ */}
          <div className="form-section">
            <h3 className="section-title">
              <i className="fas fa-map-marked-alt"></i>
              Địa chỉ đại lý
            </h3>
            
            <div className="form-group">
              <div className="input-wrapper">
                <i className="fas fa-map-marker-alt input-icon"></i>
                <input
                  type="text"
                  name="houseNumberAndStreet"
                  placeholder="Số nhà và tên đường *"
                  value={formData.houseNumberAndStreet}
                  onChange={handleInputChange}
                  className={errors.houseNumberAndStreet ? 'error' : ''}
                />
              </div>
              {errors.houseNumberAndStreet && (
                <span className="field-error">
                  <i className="fa-solid fa-exclamation-circle"></i>
                  {errors.houseNumberAndStreet}
                </span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <div className="input-wrapper">
                  <i className="fas fa-map-pin input-icon"></i>
                  <input
                    type="text"
                    name="wardOrCommune"
                    placeholder="Phường/Xã *"
                    value={formData.wardOrCommune}
                    onChange={handleInputChange}
                    className={errors.wardOrCommune ? 'error' : ''}
                  />
                </div>
                {errors.wardOrCommune && (
                  <span className="field-error">
                    <i className="fa-solid fa-exclamation-circle"></i>
                    {errors.wardOrCommune}
                  </span>
                )}
              </div>

              <div className="form-group">
                <div className="input-wrapper">
                  <i className="fas fa-city input-icon"></i>
                  <input
                    type="text"
                    name="district"
                    placeholder="Quận/Huyện *"
                    value={formData.district}
                    onChange={handleInputChange}
                    className={errors.district ? 'error' : ''}
                  />
                </div>
                {errors.district && (
                  <span className="field-error">
                    <i className="fa-solid fa-exclamation-circle"></i>
                    {errors.district}
                  </span>
                )}
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <i className="fas fa-globe-asia input-icon"></i>
                <input
                  type="text"
                  name="provinceOrCity"
                  placeholder="Tỉnh/Thành phố *"
                  value={formData.provinceOrCity}
                  onChange={handleInputChange}
                  className={errors.provinceOrCity ? 'error' : ''}
                />
              </div>
              {errors.provinceOrCity && (
                <span className="field-error">
                  <i className="fa-solid fa-exclamation-circle"></i>
                  {errors.provinceOrCity}
                </span>
              )}
            </div>
          </div>

          {/* GIẤY PHÉP KINH DOANH */}
          <div className="form-section">
            <h3 className="section-title">
              <i className="fas fa-file-contract"></i>
              Giấy phép kinh doanh <span className="optional-label">(Không bắt buộc)</span>
            </h3>
            
            <div className="form-group">
              <div 
                className="file-upload-wrapper"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="businessLicense"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="file-input"
                  style={{ display: 'none' }}
                />
                
                {!formData.businessLicense ? (
                  <label 
                    htmlFor="businessLicense" 
                    className={`file-upload-label ${isDragging ? 'dragging' : ''}`}
                  >
                    <div className="upload-icon">
                      <i className="fas fa-cloud-upload-alt"></i>
                    </div>
                    <div className="upload-text">
                      <p className="upload-title">
                        {isDragging ? 'Thả file vào đây' : 'Tải lên giấy phép kinh doanh'}
                      </p>
                      <p className="upload-subtitle">
                        {isDragging 
                          ? 'Thả file để tải lên' 
                          : 'Kéo thả hoặc click để chọn ảnh JPG, PNG, WEBP (tối đa 5MB)'
                        }
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="file-preview">
                    <div className="preview-header">
                      <div className="file-info">
                        <i className="fas fa-file-image"></i>
                        <span className="file-name">{formData.businessLicense.name}</span>
                        <span className="file-size">
                          ({(formData.businessLicense.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={handleRemoveFile}
                        title="Xóa file"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    {previewUrl && (
                      <div className="image-preview">
                        <img src={previewUrl} alt="Preview" />
                      </div>
                    )}
                  </div>
                )}
              </div>
              {errors.businessLicense && (
                <span className="field-error">
                  <i className="fa-solid fa-exclamation-circle"></i>
                  {errors.businessLicense}
                </span>
              )}
            </div>
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
        onClose={() => {
          setShowSuccessModal(false);
          onClose(); // Close register form when modal is dismissed
        }}
        type="register"
        userName={registeredUserName}
        title="Đăng ký thành công!"
        message="Tài khoản của bạn đã được tạo và đang chờ admin xác minh. Vui lòng đợi email thông báo hoặc liên hệ admin để được hỗ trợ. Cảm ơn bạn đã đăng ký!"
        onContinue={() => {
          setShowSuccessModal(false);
          // Switch to login form after admin verification message
          onSwitchToLogin();
        }}
      />
    </>
  );
};

export default RegisterForm;