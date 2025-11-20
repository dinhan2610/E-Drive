import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import Logo from "../images/logo/logo.png";
import AuthManager from "./AuthManager";
import { canManagePromotions, canCreateOrder, getCurrentUserRole, isStaff } from "../utils/roleUtils";
import { getValidAuthData, clearAuthData } from "../utils/authUtils";
import { authApi } from "../services/authApi";
import "../styles/NavbarStyles/_navbar.scss";

interface NavLink {
  to: string;
  label: string;
  className: string;
  dropdown?: Array<{
    to: string;
    label: string;
    icon: string;
    state?: any;
  }>;
}

const Navbar: React.FC = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Check login status on component mount
  useEffect(() => {
    checkLoginStatus();
    
    // Listen for login/logout events
    const handleLoginSuccess = () => checkLoginStatus();
    const handleLogoutEvent = () => {
      setIsLoggedIn(false);
      setUserProfile(null);
    };
    const handleProfileUpdate = () => checkLoginStatus();
    
    window.addEventListener('loginSuccess', handleLoginSuccess);
    window.addEventListener('registerSuccess', handleLoginSuccess);
    window.addEventListener('userLogout', handleLogoutEvent);
    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('loginSuccess', handleLoginSuccess);
      window.removeEventListener('registerSuccess', handleLoginSuccess);
      window.removeEventListener('userLogout', handleLogoutEvent);
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, []);

  const checkLoginStatus = () => {
    const authData = getValidAuthData();
    
    if (authData) {
      setIsLoggedIn(true);
      setUserProfile(authData.user);
    } else {
      setIsLoggedIn(false);
      setUserProfile(null);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      
      setIsLoggedIn(false);
      setUserProfile(null);
      window.dispatchEvent(new Event('userLogout'));
      
      window.location.href = '/';
    } catch (error) {
      clearAuthData();
      setIsLoggedIn(false);
      setUserProfile(null);
      window.dispatchEvent(new Event('userLogout'));
      window.location.href = '/';
    }
  };

  const handleSectionScroll = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLoginClick = () => {
    setAuthMode('login');
    setAuthModalOpen(true);
  };

  const handleRegisterClick = () => {
    setAuthMode('register');
    setAuthModalOpen(true);
  };

  const handleCloseAuth = () => {
    setAuthModalOpen(false);
    // Reset authMode sau khi đóng để tránh conflict
    setTimeout(() => {
      setAuthMode('login');
    }, 300);
  };

  

  // Build navigation links based on user role
  const buildNavLinks = (): NavLink[] => {
    const baseLinks: NavLink[] = [
      { to: "/", label: "Trang chủ", className: "home-link" },
      { to: "/products", label: "Mẫu xe", className: "products-link" }
    ];

    // Build dropdown items based on permissions
    const dropdownItems: Array<{ to: string; label: string; icon: string }> = [
      { to: "/customers", label: "Khách hàng", icon: "fa-users" },
      { to: "/dealer-inventory", label: "Kho hàng", icon: "fa-warehouse" },
      { to: "/drive", label: "Quản lý lái thử", icon: "fa-car-side" },
      { to: "/quotes", label: "Quản lý báo giá", icon: "fa-file-invoice-dollar" }
    ];

    // Only add Promotions if user has permission (admin/manager only, not staff)
    if (canManagePromotions()) {
      dropdownItems.push({ to: "/promotions", label: "Khuyến mãi", icon: "fa-tags" });
      dropdownItems.push({ to: "/services-accessories", label: "Dịch vụ & Phụ kiện", icon: "fa-toolbox" });
    }

    // Only add Orders if user has permission (admin/manager only, not staff)
    if (canCreateOrder()) {
      dropdownItems.push({ to: "/delivery-status", label: "Đơn hàng", icon: "fa-truck" });
    }

    // Add remaining items
    dropdownItems.push(
      { to: "/installment", label: "Trả góp", icon: "fa-credit-card" },
      { to: "/feedback", label: "Phản hồi và xử lý khiếu nại", icon: "fa-comments" }
    );

    const managementLink: NavLink = {
      to: "/customers",
      label: "Quản lý",
      className: "customers-link dropdown-parent",
      dropdown: dropdownItems
    };

    return [
      ...baseLinks,
      managementLink,
      { to: "/compare-slots", label: "So sánh xe", className: "compare-link" },
      { to: "/contact", label: "Liên hệ", className: "contact-link" }
    ];
  };

  const navLinks = buildNavLinks();

  return (
    <nav className="nav-wrapper">
      <div className="navbar">
        <div className="navbar__brand">
          <Link to="/" onClick={() => window.scrollTo(0, 0)} className="logo-link">
            <img src={Logo} alt="E-Drive Logo" />
          </Link>
          <span className="brand-tagline">Future Electric</span>
        </div>

        <ul className="navbar__links">
          {navLinks.map((link, index) => (
            <li key={index} className={`nav-item ${link.dropdown ? 'has-dropdown' : ''}`}>
              {link.to.startsWith('#') ? (
                <button 
                  className={`nav-link ${link.className}`} 
                  onClick={() => handleSectionScroll(link.to.substring(1))}
                >
                  <span>{link.label}</span>
                  {link.dropdown && <i className="fas fa-chevron-down dropdown-icon"></i>}
                  <div className="nav-underline"></div>
                </button>
              ) : (
                <Link className={`nav-link ${link.className}`} to={link.to}>
                  <span>{link.label}</span>
                  {link.dropdown && <i className="fas fa-chevron-down dropdown-icon"></i>}
                  <div className="nav-underline"></div>
                </Link>
              )}
              
              {/* Dropdown Menu */}
              {link.dropdown && (
                <div className="nav-dropdown-menu">
                  {link.dropdown.map((item, idx) => (
                    <Link 
                      key={idx} 
                      to={item.to}
                      state={item.state}
                      className="nav-dropdown-item"
                    >
                      <i className={`fas ${item.icon}`}></i>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="navbar__actions">
          {isLoggedIn && userProfile ? (
            <div className="user-profile">
              <div className="profile-avatar-container">
                <img 
                  src={userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.fullName || userProfile.name || 'User')}&background=ff4d30&color=fff&size=100`}
                  alt={userProfile.fullName || userProfile.name}
                  className="profile-avatar"
                />
              </div>
              
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <h4>{userProfile.fullName || userProfile.name}</h4>
                  <p>{userProfile.email}</p>
                  {userProfile.role && (
                    <span className={`role-badge ${userProfile.role.toLowerCase().replace('role_', '').replace('dealer_', '')}`}>
                      {userProfile.role.toLowerCase().includes('staff') ? (
                        <>
                          <i className="fas fa-user-tag"></i>
                          Nhân viên
                        </>
                      ) : userProfile.role.toLowerCase().includes('dealer') || userProfile.role.toLowerCase().includes('manager') ? (
                        <>
                          <i className="fas fa-user-tie"></i>
                          Quản lý
                        </>
                      ) : (
                        <>
                          <i className="fas fa-crown"></i>
                          Admin
                        </>
                      )}
                    </span>
                  )}
                </div>
                
                <div className="dropdown-menu">
                  <Link to="/profile" className="dropdown-item">
                    <i className="fas fa-user"></i>
                    Hồ sơ cá nhân
                  </Link>
                  <Link to="/compare-slots" className="dropdown-item">
                    <i className="fas fa-balance-scale"></i>
                    So sánh xe
                  </Link>
                  
                  {/* Giỏ hàng - Only show for Dealer/Manager, not Staff */}
                  {!userProfile.role?.toLowerCase().includes('staff') && (
                    <Link to="/dealer-order" className="dropdown-item">
                      <i className="fas fa-shopping-cart"></i>
                      Giỏ hàng
                    </Link>
                  )}
                  
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <button 
                className="navbar__actions__signin"
                onClick={handleLoginClick}
              >
                <i className="fas fa-user"></i>
                <span>Đăng nhập</span>
              </button>
              <button 
                className="navbar__actions__register"
                onClick={handleRegisterClick}
              >
                <i className="fas fa-handshake"></i>
                <span>Làm đại lý</span>
                <div className="btn-shimmer"></div>
              </button>
            </>
          )}
        </div>
      </div>

      <AuthManager
        isOpen={authModalOpen}
        onClose={handleCloseAuth}
        initialMode={authMode}
        onAuthSuccess={() => checkLoginStatus()}
      />
    </nav>
  );
};

export default Navbar;
