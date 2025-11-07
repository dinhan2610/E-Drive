import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/authApi';
import { SuccessModal } from './SuccessModal';
import "../styles/AuthStyles/_authforms.scss";

interface LoginFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onLoginSuccess?: (userData: any) => void;
}

interface FormData {
  username: string;
  password: string;
}

interface FormErrors {
  username?: string;
  password?: string;
  general?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  isOpen, 
  onClose, 
  onSwitchToRegister, 
  onLoginSuccess 
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loggedInUserName, setLoggedInUserName] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'dealer'>('dealer');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Real-time validation
    const fieldErrors: FormErrors = {};
    
    if (name === 'username') {
      if (value.trim() && value.length < 3) {
        fieldErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
      } else if (value.trim() && /\s/.test(value)) {
        fieldErrors.username = 'Tên đăng nhập không được chứa khoảng trắng';
      } else {
        fieldErrors.username = undefined;
      }
    }
    
    if (name === 'password') {
      if (value && value.length < 6) {
        fieldErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      } else {
        fieldErrors.password = undefined;
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

    // Username validation
    if (!formData.username) {
      newErrors.username = 'Tên đăng nhập là bắt buộc';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    } else if (/\s/.test(formData.username)) {
      newErrors.username = 'Tên đăng nhập không được chứa khoảng trắng';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
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
      // Call login API
      const result = await authApi.login({
        username: formData.username,
        password: formData.password
      });
      
      if (result.success && result.data) {
        const { user, token, refreshToken } = result.data;
        
        // Debug: Log user data from API
        console.log('🔍 User data from API:', user);
        console.log('🔍 User role from API:', user?.role);
        
        // Set user name for success modal
        setLoggedInUserName(user?.fullName || user?.name || formData.username);
        
        // Store user data for persistence (including role)
        // Chuẩn hóa role: "ROLE_ADMIN" -> "admin", "ROLE_DEALER" -> "dealer"
        let detectedRole = user?.role || 'dealer';
        
        // Normalize role từ Spring Security format (ROLE_ADMIN -> admin)
        if (detectedRole && typeof detectedRole === 'string') {
          detectedRole = detectedRole.replace('ROLE_', '').toLowerCase();
        }
        
        // Fallback: nếu vẫn không có role, detect từ username
        if (!detectedRole || detectedRole === 'dealer') {
          if (formData.username.toLowerCase().startsWith('admin')) {
            detectedRole = 'admin';
            console.log('⚠️ Role detected from username');
          }
        }
        
        const userData = {
          ...user,
          fullName: user?.fullName || user?.name || formData.username,
          name: user?.fullName || user?.name || formData.username,
          username: formData.username,
          role: detectedRole
        };
        
        console.log('💾 User data to be stored:', userData);
        console.log('👤 Final normalized role:', userData.role);
        
        localStorage.setItem('e-drive-user', JSON.stringify(userData));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', userData.role); // Lưu role riêng để dễ check
        
        // Set role for redirect
        setUserRole(userData.role);
        setLoggedInUserName(userData.fullName);
        
        // Verify tokens are stored
        const storedAccessToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        
        console.log('💾 Đã lưu thông tin user:', userData);
        console.log('🔑 Token check:', {
          tokenFromAPI: token ? `${token.substring(0, 30)}...` : 'NULL',
          storedAccessToken: storedAccessToken ? `${storedAccessToken.substring(0, 30)}...` : 'NULL',
          refreshTokenFromAPI: refreshToken ? 'EXISTS' : 'NULL',
          storedRefreshToken: storedRefreshToken ? 'EXISTS' : 'NULL'
        });
        
        // Dispatch login success event
        window.dispatchEvent(new Event('loginSuccess'));
        
        // Reset form
        setFormData({ username: '', password: '' });
        
        // Show success modal immediately
        setShowSuccessModal(true);
        
        // Call onLoginSuccess callback if provided
        if (onLoginSuccess) {
          onLoginSuccess(userData);
        }
      } else {
        setErrors({ general: result.message || 'Đăng nhập thất bại' });
        return;
      }
      
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general: 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
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
      <div className="auth-modal">
        <button className="auth-close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>

        <div className="auth-header">
          <div className="auth-logo">
            <i className="fas fa-user"></i>
          </div>
          <h2>Đăng nhập đại lý</h2>
          <p>Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {errors.general && (
            <div className="auth-error-message">
              {errors.general}
            </div>
          )}

          <div className="form-group">
            <div className="input-wrapper">
              <i className="fas fa-user input-icon"></i>
              <input
                type="text"
                name="username"
                placeholder="Tên đăng nhập"
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
              <i className="fas fa-lock input-icon"></i>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Mật khẩu"
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

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <a href="#" className="forgot-password">Quên mật khẩu?</a>
          </div>

          <button 
            type="submit" 
            className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>

          <div className="auth-divider">
            <span>Hoặc</span>
          </div>

          <button type="button" className="google-auth-btn">
            <i className="fab fa-google"></i>
            Đăng nhập với Google
          </button>

          <div className="auth-switch">
            <p>
              Chưa có tài khoản đại lý?{' '}
              <button type="button" onClick={onSwitchToRegister}>
                Đăng ký ngay
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
          onClose(); // Close login form when modal is dismissed
        }}
        type="login"
        userName={loggedInUserName}
        onContinue={() => {
          setShowSuccessModal(false);
          onClose(); // Close login form
          
          // Redirect based on role
          if (userRole === 'admin') {
            navigate('/admin');
          } else {
            // Dealer stays on current page or home
            navigate('/');
          }
          
          // Dispatch success event for other components
          window.dispatchEvent(new CustomEvent('loginSuccess', {
            detail: { userName: loggedInUserName, role: userRole }
          }));
        }}
      />
    </>
  );
};

export default LoginForm;