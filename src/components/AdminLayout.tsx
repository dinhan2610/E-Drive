import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/AdminStyles/AdminSidebar.module.scss';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  counters: {
    cars: number;
    dealers: number;
    unverifiedDealers: number;
    bookings: number;
    testDrives: number;
  };
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, onTabChange, counters }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'cars': return 'Quản lý xe';
      case 'dealers': return 'Đại lý';
      case 'bookings': return 'Đặt xe';
      case 'contracts': return 'Hợp đồng';
      case 'analytics': return 'Thống kê';
      case 'settings': return 'Cài đặt';
      default: return 'Dashboard';
    }
  };

  const getPageIcon = () => {
    switch (activeTab) {
      case 'dashboard': return 'fas fa-chart-line';
      case 'cars': return 'fas fa-car';
      case 'dealers': return 'fas fa-store';
      case 'bookings': return 'fas fa-calendar-alt';
      case 'contracts': return 'fas fa-file-contract';
      case 'analytics': return 'fas fa-chart-bar';
      case 'settings': return 'fas fa-cog';
      default: return 'fas fa-chart-line';
    }
  };

  return (
    <div className={styles.adminContainer}>
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${sidebarOpen ? styles.show : ''}`}>
        <div className={styles.sidebarHeader}>
          <a href="/" className={styles.logo}>
            <i className="fas fa-bolt"></i>
            <div>
              <h2>E-Drive</h2>
              <p>Admin Panel</p>
            </div>
          </a>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={styles.navSection}>
            <div className={styles.sectionTitle}>Main</div>
            <div
              className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.active : ''}`}
              onClick={() => {
                onTabChange('dashboard');
                setSidebarOpen(false);
              }}
            >
              <i className="fas fa-chart-line"></i>
              <span>Dashboard</span>
            </div>
          </div>

          <div className={styles.navSection}>
            <div className={styles.sectionTitle}>Quản lý</div>
            <div
              className={`${styles.navItem} ${activeTab === 'cars' ? styles.active : ''}`}
              onClick={() => {
                onTabChange('cars');
                setSidebarOpen(false);
              }}
            >
              <i className="fas fa-car"></i>
              <span>Quản lý xe ({counters.cars})</span>
            </div>
            <div
              className={`${styles.navItem} ${activeTab === 'dealers' ? styles.active : ''}`}
              onClick={() => {
                onTabChange('dealers');
                setSidebarOpen(false);
              }}
            >
              <i className="fas fa-store"></i>
              <span>
                Đại lý ({counters.dealers})
                {counters.unverifiedDealers > 0 && (
                  <span className={styles.pendingBadge}>{counters.unverifiedDealers}</span>
                )}
              </span>
            </div>
            <div
              className={`${styles.navItem} ${activeTab === 'bookings' ? styles.active : ''}`}
              onClick={() => {
                onTabChange('bookings');
                setSidebarOpen(false);
              }}
            >
              <i className="fas fa-calendar-alt"></i>
              <span>Đặt xe ({counters.bookings})</span>
            </div>
            <div
              className={`${styles.navItem} ${activeTab === 'contracts' ? styles.active : ''}`}
              onClick={() => {
                navigate('/admin/contracts/new');
                setSidebarOpen(false);
              }}
            >
              <i className="fas fa-file-contract"></i>
              <span>Hợp đồng</span>
            </div>
          </div>

          <div className={styles.navSection}>
            <div className={styles.sectionTitle}>Khác</div>
            <div
              className={`${styles.navItem} ${activeTab === 'analytics' ? styles.active : ''}`}
              onClick={() => {
                onTabChange('analytics');
                setSidebarOpen(false);
              }}
            >
              <i className="fas fa-chart-bar"></i>
              <span>Thống kê</span>
            </div>
            <div
              className={`${styles.navItem} ${activeTab === 'settings' ? styles.active : ''}`}
              onClick={() => {
                onTabChange('settings');
                setSidebarOpen(false);
              }}
            >
              <i className="fas fa-cog"></i>
              <span>Cài đặt</span>
            </div>
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {localStorage.getItem('userName')?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className={styles.userDetails}>
              <p className={styles.userName}>{localStorage.getItem('userName') || 'Admin'}</p>
              <p className={styles.userRole}>{localStorage.getItem('role') || 'Administrator'}</p>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      <div 
        className={`${styles.overlay} ${sidebarOpen ? styles.show : ''}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Top Bar */}
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button className={styles.menuToggle} onClick={() => setSidebarOpen(!sidebarOpen)}>
              <i className="fas fa-bars"></i>
            </button>
            <h1 className={styles.pageTitle}>
              <i className={getPageIcon()}></i>
              {getPageTitle()}
            </h1>
          </div>

          <div className={styles.topBarRight}>
            <div className={styles.searchBox}>
              <i className="fas fa-search"></i>
              <input type="text" placeholder="Tìm kiếm..." />
            </div>
            <button className={styles.iconBtn}>
              <i className="fas fa-bell"></i>
              <span className={styles.badge}>3</span>
            </button>
            <button className={styles.iconBtn}>
              <i className="fas fa-envelope"></i>
              <span className={styles.badge}>5</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className={styles.contentArea}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
