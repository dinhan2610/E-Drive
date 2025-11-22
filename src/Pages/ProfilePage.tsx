import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../utils/authUtils';
import { getProfile, updateProfile, getDealerProfile } from '../services/profileApi';
import { authApi } from '../services/authApi';
import { getCurrentUserRole } from '../utils/roleUtils';
import '../styles/ProfileStyles/_profile.scss';

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  company: string;
  dealerName: string;
  avatar: string;
  joinDate: string;
  dealerStatus: 'active' | 'pending' | 'inactive';
  totalSales: number;
  commission: number;
  username?: string;
  role?: string;
}

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'settings'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    dealerName: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Load user data from API
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const apiProfile = await getProfile();
        const currentRole = getCurrentUserRole();

        // Use profile API data directly (no need to call dealer endpoint)
        // Profile API already contains all necessary dealer information
        const uiProfile: UserProfile = {
          id: String(apiProfile.dealerId || apiProfile.profileId),
          fullName: apiProfile.fullName,
          email: apiProfile.email,
          phone: apiProfile.phoneNumber,
          address: apiProfile.fullAddress || 'Chưa cập nhật',
          company: apiProfile.agencyName || 'E-Drive Dealer',
          dealerName: apiProfile.agencyName || 'E-Drive',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(apiProfile.fullName)}&background=ff4d30&color=fff&size=200`,
          joinDate: new Date().toLocaleDateString('vi-VN'),
          dealerStatus: 'active',
          totalSales: 42,
          commission: 125000000,
          username: apiProfile.username,
          role: currentRole
        };

        setUser(uiProfile);
        setFormData({
          fullName: apiProfile.fullName,
          email: apiProfile.email,
          phone: apiProfile.phoneNumber,
          address: apiProfile.fullAddress || '',
          company: apiProfile.agencyName || '',
          dealerName: apiProfile.agencyName || ''
        });
        setAvatarPreview(uiProfile.avatar);
      } catch (error) {
        console.error('❌ Failed to load profile:', error);
        // Fallback if API fails
        const parsedUser = getCurrentUser();
        if (parsedUser) {
          const mockUserProfile: UserProfile = {
            id: parsedUser.id || '1',
            fullName: parsedUser.fullName || parsedUser.name || 'Người dùng E-Drive',
            email: parsedUser.email || 'user@edrive.com',
            phone: parsedUser.phone || '0901234567',
            address: parsedUser.address || 'TP. Hồ Chí Minh',
            company: parsedUser.company || 'E-Drive Dealer',
            dealerName: parsedUser.dealerName || 'Đại lý chính thức E-Drive',
            avatar: parsedUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(parsedUser.fullName || parsedUser.name || 'User')}&background=ff4d30&color=fff&size=200`,
            joinDate: parsedUser.joinDate || new Date().toLocaleDateString('vi-VN'),
            dealerStatus: 'active',
            totalSales: 42,
            commission: 125000000
          };

          setUser(mockUserProfile);
          setFormData({
            fullName: mockUserProfile.fullName,
            email: mockUserProfile.email,
            phone: mockUserProfile.phone,
            address: mockUserProfile.address,
            company: mockUserProfile.company,
            dealerName: mockUserProfile.dealerName
          });
          setAvatarPreview(mockUserProfile.avatar);
        }
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);

    try {
      // Get current profile to preserve ward/district/city
      const currentProfile = await getProfile();
      
      // Call real API with all required fields
      const updatedProfile = await updateProfile({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        agencyName: formData.company || 'E-Drive Dealer',
        contactPerson: formData.fullName,
        agencyPhone: formData.phone,
        streetAddress: formData.address || currentProfile.streetAddress || '',
        ward: currentProfile.ward || 'Chưa cập nhật',
        district: currentProfile.district || 'Chưa cập nhật',
        city: currentProfile.city || 'Hồ Chí Minh',
        fullAddress: formData.address || currentProfile.fullAddress || ''
      });

      // Update UI with API response
      const updatedUser: UserProfile = {
        ...user!,
        fullName: updatedProfile.fullName,
        email: updatedProfile.email,
        phone: updatedProfile.phoneNumber,
        address: updatedProfile.fullAddress,
        company: updatedProfile.agencyName
      };

      setUser(updatedUser);

      // Also update localStorage for compatibility with other pages
      localStorage.setItem('e-drive-user', JSON.stringify(updatedUser));

      // Dispatch event để cập nhật navbar
      window.dispatchEvent(new Event('userProfileUpdated'));

      setIsEditing(false);
      setIsSaving(false);

      // Show success message
      alert('Cập nhật thông tin thành công!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      setIsSaving(false);
      alert('Cập nhật thất bại. Vui lòng thử lại!');
    }
  };

  const handleChangePassword = async () => {
    // Reset errors
    setPasswordErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    // Validation
    let hasError = false;
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
      hasError = true;
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới';
      hasError = true;
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
      hasError = true;
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
      hasError = true;
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      hasError = true;
    }

    if (hasError) {
      setPasswordErrors(errors);
      return;
    }

    // Call API
    setIsChangingPassword(true);
    try {
      const result = await authApi.changePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });

      if (result.success) {
        // Reset form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Show success notification
        setNotification({
          show: true,
          message: result.message || 'Đổi mật khẩu thành công!',
          type: 'success'
        });

        // Auto hide after 3 seconds
        setTimeout(() => {
          setNotification({ show: false, message: '', type: 'success' });
        }, 3000);
      } else {
        // Show error notification
        setNotification({
          show: true,
          message: result.message || 'Đổi mật khẩu thất bại!',
          type: 'error'
        });

        // Auto hide after 3 seconds
        setTimeout(() => {
          setNotification({ show: false, message: '', type: 'error' });
        }, 3000);
      }
    } catch (error) {
      console.error('Change password error:', error);
      
      // Show error notification
      setNotification({
        show: true,
        message: 'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại!',
        type: 'error'
      });

      // Auto hide after 3 seconds
      setTimeout(() => {
        setNotification({ show: false, message: '', type: 'error' });
      }, 3000);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return (
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin người dùng...</p>
        </div>
    );
  }

  return (
      <>
        {/* Toast Notification */}
        {notification.show && (
          <div className={`toast-notification ${notification.type}`}>
            <div className="toast-content">
              <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
              <span>{notification.message}</span>
            </div>
            <button 
              className="toast-close" 
              onClick={() => setNotification({ show: false, message: '', type: 'success' })}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        <div className="profile-container">
          <div className="profile-sidebar">
            {/* User Avatar & Basic Info */}
            <div className="profile-header">
              <div className="avatar-section">
                <img
                    src={avatarPreview || user.avatar}
                    alt={user.fullName}
                    className="profile-avatar"
                />
                {isEditing && (
                    <label className="avatar-upload">
                      <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          hidden
                      />
                      <i className="fas fa-camera"></i>
                    </label>
                )}
              </div>

              <div className="profile-info">
                <h3>{user.fullName}</h3>
                <p className="dealer-status">
                  <i className="fas fa-star"></i>
                  {user.dealerName}
                </p>
                <div className={`status-badge ${user.dealerStatus}`}>
                  {user.dealerStatus === 'active' && 'Đại lý hoạt động'}
                  {user.dealerStatus === 'pending' && 'Chờ phê duyệt'}
                  {user.dealerStatus === 'inactive' && 'Tạm ngưng'}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="profile-nav">
              <button
                  className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
              >
                <i className="fas fa-user"></i>
                Thông tin cá nhân
              </button>
              <button
                  className={`nav-tab ${activeTab === 'stats' ? 'active' : ''}`}
                  onClick={() => setActiveTab('stats')}
              >
                <i className="fas fa-chart-bar"></i>
                Thống kê bán hàng
              </button>
              <button
                  className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('settings')}
              >
                <i className="fas fa-cog"></i>
                Cài đặt tài khoản
              </button>
            </nav>

            {/* Quick Actions */}
            <div className="quick-actions">
              <Link to="/products" className="action-btn">
                <i className="fas fa-car"></i>
                Xem mẫu xe
              </Link>
              <Link to="/compare-slots" className="action-btn">
                <i className="fas fa-balance-scale"></i>
                So sánh xe
              </Link>
            </div>
          </div>

          <div className="profile-content">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="tab-content profile-tab">
                  <div className="content-header">
                    <h2>Thông tin cá nhân</h2>
                    <button
                        className={`edit-btn ${isEditing ? 'cancel' : 'edit'}`}
                        onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? (
                          <>
                            <i className="fas fa-times"></i>
                            Hủy
                          </>
                      ) : (
                          <>
                            <i className="fas fa-edit"></i>
                            Chỉnh sửa
                          </>
                      )}
                    </button>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Tên đại lý</label>
                      <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Nhập tên đại lý"
                      />
                    </div>

                    <div className="form-group">
                      <label>Email</label>
                      <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Nhập email"
                      />
                    </div>

                    <div className="form-group">
                      <label>Số điện thoại</label>
                      <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Nhập số điện thoại"
                      />
                    </div>





                    <div className="form-group full-width">
                      <label>Địa chỉ</label>
                      <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Nhập địa chỉ"
                          rows={3}
                      />
                    </div>
                  </div>

                  {isEditing && (
                      <div className="form-actions">
                        <button
                            className="save-btn"
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                        >
                          {isSaving ? (
                              <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Đang lưu...
                              </>
                          ) : (
                              <>
                                <i className="fas fa-save"></i>
                                Lưu thay đổi
                              </>
                          )}
                        </button>
                      </div>
                  )}
                </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
                <div className="tab-content stats-tab">
                  <h2>Thống kê bán hàng</h2>

                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon">
                        <i className="fas fa-car"></i>
                      </div>
                      <div className="stat-info">
                        <h3>{user.totalSales}</h3>
                        <p>Xe đã bán</p>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon">
                        <i className="fas fa-money-bill-wave"></i>
                      </div>
                      <div className="stat-info">
                        <h3>{user.commission.toLocaleString('vi-VN')}đ</h3>
                        <p>Hoa hồng tháng này</p>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon">
                        <i className="fas fa-calendar-alt"></i>
                      </div>
                      <div className="stat-info">
                        <h3>{user.joinDate}</h3>
                        <p>Ngày gia nhập</p>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon">
                        <i className="fas fa-trophy"></i>
                      </div>
                      <div className="stat-info">
                        <h3>Top 10</h3>
                        <p>Đại lý xuất sắc</p>
                      </div>
                    </div>
                  </div>

                  <div className="performance-chart">
                    <h3>Biểu đồ doanh số</h3>
                    <div className="chart-placeholder">
                      <i className="fas fa-chart-line"></i>
                      <p>Biểu đồ doanh số sẽ được cập nhật sớm</p>
                    </div>
                  </div>
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="tab-content settings-tab">
                  <h2>Cài đặt tài khoản</h2>

                  <div className="settings-section">
                    <h3>Đổi mật khẩu</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Mật khẩu hiện tại</label>
                        <input
                            type="password"
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            placeholder="Nhập mật khẩu hiện tại"
                            className={passwordErrors.currentPassword ? 'error' : ''}
                            disabled={isChangingPassword}
                        />
                        {passwordErrors.currentPassword && (
                            <span className="error-message">
                              <i className="fas fa-exclamation-circle"></i>
                              {passwordErrors.currentPassword}
                            </span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Mật khẩu mới</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                            className={passwordErrors.newPassword ? 'error' : ''}
                            disabled={isChangingPassword}
                        />
                        {passwordErrors.newPassword && (
                            <span className="error-message">
                              <i className="fas fa-exclamation-circle"></i>
                              {passwordErrors.newPassword}
                            </span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Xác nhận mật khẩu mới</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            placeholder="Nhập lại mật khẩu mới"
                            className={passwordErrors.confirmPassword ? 'error' : ''}
                            disabled={isChangingPassword}
                        />
                        {passwordErrors.confirmPassword && (
                            <span className="error-message">
                              <i className="fas fa-exclamation-circle"></i>
                              {passwordErrors.confirmPassword}
                            </span>
                        )}
                      </div>
                    </div>

                    <button 
                      className="change-password-btn" 
                      onClick={handleChangePassword}
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-lock"></i>
                          Đổi mật khẩu
                        </>
                      )}
                    </button>
                  </div>

                  <div className="settings-section">
                    <h3>Tùy chọn khác</h3>
                    <div className="settings-options">
                      <label className="setting-option">
                        <input type="checkbox" defaultChecked />
                        <span className="checkmark"></span>
                        Nhận thông báo qua email
                      </label>

                      <label className="setting-option">
                        <input type="checkbox" defaultChecked />
                        <span className="checkmark"></span>
                        Nhận tin tức khuyến mãi
                      </label>

                      <label className="setting-option">
                        <input type="checkbox" />
                        <span className="checkmark"></span>
                        Chế độ tối
                      </label>
                    </div>
                  </div>
                </div>
            )}
          </div>
        </div>

        
      </>
  );
};

export default ProfilePage;