import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { getProfile, updateProfile, type UserProfile as APIUserProfile, type Dealer } from '../services/profileApi';
import '../styles/ProfileStyles/_profile.scss';

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  username: string;
  role: string;
  dealer: Dealer | null;
  avatar: string;
  joinDate: string;
  dealerStatus: 'active' | 'pending' | 'inactive';
  totalSales: number;
  commission: number;
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
    username: '',
    dealerName: '',
    houseNumberAndStreet: '',
    wardOrCommune: '',
    district: '',
    provinceOrCity: '',
    contactPerson: '',
    dealerPhone: '',
    fullAddress: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Load user data from API
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const apiProfile = await getProfile();
        
        // Map API data to UI format
        const userProfile: UserProfile = {
          id: String(apiProfile.id),
          fullName: apiProfile.fullName,
          email: apiProfile.email,
          phone: apiProfile.phone,
          username: apiProfile.username,
          role: apiProfile.role,
          dealer: apiProfile.dealer,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(apiProfile.fullName)}&background=ff4d30&color=fff&size=200`,
          joinDate: new Date().toLocaleDateString('vi-VN'),
          dealerStatus: 'active',
          totalSales: 42,
          commission: 125000000
        };
        
        setUser(userProfile);
        setFormData({
          fullName: userProfile.fullName,
          email: userProfile.email,
          phone: userProfile.phone,
          username: userProfile.username,
          dealerName: apiProfile.dealer?.dealerName || '',
          houseNumberAndStreet: apiProfile.dealer?.houseNumberAndStreet || '',
          wardOrCommune: apiProfile.dealer?.wardOrCommune || '',
          district: apiProfile.dealer?.district || '',
          provinceOrCity: apiProfile.dealer?.provinceOrCity || '',
          contactPerson: apiProfile.dealer?.contactPerson || '',
          dealerPhone: apiProfile.dealer?.phone || '',
          fullAddress: apiProfile.dealer?.fullAddress || ''
        });
        setAvatarPreview(userProfile.avatar);
      } catch (error) {
        console.error('Failed to load profile:', error);
        alert('Không thể tải thông tin profile. Vui lòng thử lại!');
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
      // Call real API
      const updatedProfile = await updateProfile({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone
      });
      
      // Update UI with API response
      const updatedUser: UserProfile = {
        ...user!,
        fullName: updatedProfile.fullName,
        email: updatedProfile.email,
        phone: updatedProfile.phone
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

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    // Simulate password change
    setTimeout(() => {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      alert('Đổi mật khẩu thành công!');
    }, 1000);
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
                {user.dealer?.dealerName || 'E-Drive'}
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
                  <label>Họ và tên</label>
                  <input 
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div className="form-group">
                  <label>Tên đăng nhập</label>
                  <input 
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={true}
                    placeholder="Tên đăng nhập"
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

                <div className="form-group">
                  <label>Tên đại lý</label>
                  <input 
                    type="text"
                    name="dealerName"
                    value={formData.dealerName}
                    onChange={handleInputChange}
                    disabled={true}
                    placeholder="Tên đại lý"
                  />
                </div>

                <div className="form-group">
                  <label>Người liên hệ</label>
                  <input 
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    disabled={true}
                    placeholder="Người liên hệ"
                  />
                </div>

                <div className="form-group">
                  <label>Số nhà và tên đường</label>
                  <input 
                    type="text"
                    name="houseNumberAndStreet"
                    value={formData.houseNumberAndStreet}
                    onChange={handleInputChange}
                    disabled={true}
                    placeholder="Số nhà và tên đường"
                  />
                </div>

                <div className="form-group">
                  <label>Phường/Xã</label>
                  <input 
                    type="text"
                    name="wardOrCommune"
                    value={formData.wardOrCommune}
                    onChange={handleInputChange}
                    disabled={true}
                    placeholder="Phường/Xã"
                  />
                </div>

                <div className="form-group">
                  <label>Quận/Huyện</label>
                  <input 
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    disabled={true}
                    placeholder="Quận/Huyện"
                  />
                </div>

                <div className="form-group">
                  <label>Tỉnh/Thành phố</label>
                  <input 
                    type="text"
                    name="provinceOrCity"
                    value={formData.provinceOrCity}
                    onChange={handleInputChange}
                    disabled={true}
                    placeholder="Tỉnh/Thành phố"
                  />
                </div>

                <div className="form-group">
                  <label>SĐT đại lý</label>
                  <input 
                    type="tel"
                    name="dealerPhone"
                    value={formData.dealerPhone}
                    onChange={handleInputChange}
                    disabled={true}
                    placeholder="SĐT đại lý"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Địa chỉ đầy đủ</label>
                  <textarea 
                    name="fullAddress"
                    value={formData.fullAddress}
                    onChange={handleInputChange}
                    disabled={true}
                    placeholder="Địa chỉ đầy đủ"
                    rows={2}
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
                    />
                  </div>

                  <div className="form-group">
                    <label>Mật khẩu mới</label>
                    <input 
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Nhập mật khẩu mới"
                    />
                  </div>

                  <div className="form-group">
                    <label>Xác nhận mật khẩu mới</label>
                    <input 
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>
                </div>

                <button className="change-password-btn" onClick={handleChangePassword}>
                  <i className="fas fa-lock"></i>
                  Đổi mật khẩu
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

      <Footer />
    </>
  );
};

export default ProfilePage;