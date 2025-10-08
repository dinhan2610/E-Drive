import React, { useState, useEffect } from 'react';
import { CAR_DATA } from '../constants/CarDatas';
import type { CarType } from '../constants/CarDatas';
import styles from '../styles/AdminStyles/AdminPage.module.scss';

interface AdminStats {
  totalCars: number;
  totalUsers: number;
  totalRevenue: number;
  monthlyBookings: number;
  activeBookings: number;
  totalBookings: number;
  avgRating: number;
  pendingMaintenance: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  joinDate: string;
  status: string;
  avatar?: string;
  phone?: string;
  totalBookings: number;
  lastLogin: string;
}

interface Booking {
  id: number;
  userId: number;
  userName: string;
  carId: number;
  carName: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
}

interface CarWithStatus extends CarType {
  id: number;
  status: 'available' | 'rented' | 'maintenance' | 'unavailable';
  totalBookings: number;
  rating: number;
  lastMaintenance: string;
}

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cars' | 'users' | 'bookings' | 'analytics' | 'settings'>('dashboard');
  const [cars, setCars] = useState<CarWithStatus[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalCars: 0,
    totalUsers: 0,
    totalRevenue: 0,
    monthlyBookings: 0,
    activeBookings: 0,
    totalBookings: 0,
    avgRating: 0,
    pendingMaintenance: 0
  });

  useEffect(() => {
    // Enhanced car data with status
    const flattenedCars = CAR_DATA.flat();
    const carsWithStatus: CarWithStatus[] = flattenedCars.map((car, index) => ({
      ...car,
      id: index + 1,
      status: ['available', 'rented', 'maintenance'][Math.floor(Math.random() * 3)] as 'available' | 'rented' | 'maintenance',
      totalBookings: Math.floor(Math.random() * 50) + 10,
      rating: 4.2 + Math.random() * 0.8,
      lastMaintenance: '2024-09-15'
    }));
    setCars(carsWithStatus);

    // Enhanced users data
    const mockUsers: User[] = [
      { 
        id: 1, 
        name: 'Nguyễn Văn A', 
        email: 'nguyenvana@email.com', 
        role: 'Customer', 
        joinDate: '2024-01-15', 
        status: 'Active',
        phone: '0901234567',
        totalBookings: 12,
        lastLogin: '2024-10-08 14:30'
      },
      { 
        id: 2, 
        name: 'Trần Thị B', 
        email: 'tranthib@email.com', 
        role: 'Customer', 
        joinDate: '2024-02-20', 
        status: 'Active',
        phone: '0902345678',
        totalBookings: 8,
        lastLogin: '2024-10-07 16:45'
      },
      { 
        id: 3, 
        name: 'Lê Văn C', 
        email: 'levanc@email.com', 
        role: 'Admin', 
        joinDate: '2023-12-10', 
        status: 'Active',
        phone: '0903456789',
        totalBookings: 0,
        lastLogin: '2024-10-09 08:15'
      },
      { 
        id: 4, 
        name: 'Phạm Thị D', 
        email: 'phamthid@email.com', 
        role: 'Customer', 
        joinDate: '2024-03-05', 
        status: 'Inactive',
        phone: '0904567890',
        totalBookings: 3,
        lastLogin: '2024-09-20 12:00'
      },
    ];
    setUsers(mockUsers);

    // Mock bookings data
    const mockBookings: Booking[] = [
      {
        id: 1,
        userId: 1,
        userName: 'Nguyễn Văn A',
        carId: 1,
        carName: 'VW Golf 6',
        startDate: '2024-10-10',
        endDate: '2024-10-15',
        status: 'confirmed',
        totalAmount: 1850000,
        paymentStatus: 'paid'
      },
      {
        id: 2,
        userId: 2,
        userName: 'Trần Thị B',
        carId: 2,
        carName: 'Audi A1 S-Line',
        startDate: '2024-10-12',
        endDate: '2024-10-14',
        status: 'pending',
        totalAmount: 900000,
        paymentStatus: 'pending'
      }
    ];
    setBookings(mockBookings);

    // Calculate enhanced stats
    setStats({
      totalCars: carsWithStatus.length,
      totalUsers: mockUsers.length,
      totalRevenue: 125000000,
      monthlyBookings: 45,
      activeBookings: mockBookings.filter(b => b.status === 'ongoing').length,
      totalBookings: mockBookings.length,
      avgRating: 4.6,
      pendingMaintenance: carsWithStatus.filter(c => c.status === 'maintenance').length
    });
  }, []);

  const handleDeleteCar = (index: number) => {
    setCars(cars.filter((_, i) => i !== index));
  };

  const handleDeleteUser = (userId: number) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className={styles.adminPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            <i className="fas fa-cog"></i>
            Admin Dashboard
          </h1>
          <p className={styles.subtitle}>Quản lý hệ thống E-Drive</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.navigation}>
        <div className={styles.navTabs}>
          <button
            className={`${styles.navTab} ${activeTab === 'dashboard' ? styles.active : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <i className="fas fa-chart-line"></i>
            Dashboard
          </button>
          <button
            className={`${styles.navTab} ${activeTab === 'cars' ? styles.active : ''}`}
            onClick={() => setActiveTab('cars')}
          >
            <i className="fas fa-car"></i>
            Quản lý xe ({cars.length})
          </button>
          <button
            className={`${styles.navTab} ${activeTab === 'users' ? styles.active : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="fas fa-users"></i>
            Quản lý người dùng ({users.length})
          </button>
          <button
            className={`${styles.navTab} ${activeTab === 'bookings' ? styles.active : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <i className="fas fa-calendar-alt"></i>
            Đặt xe ({bookings.length})
          </button>
          <button
            className={`${styles.navTab} ${activeTab === 'analytics' ? styles.active : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <i className="fas fa-chart-bar"></i>
            Thống kê
          </button>
          <button
            className={`${styles.navTab} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <i className="fas fa-cog"></i>
            Cài đặt
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {activeTab === 'dashboard' && (
          <div className={styles.dashboard}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <i className="fas fa-car"></i>
                </div>
                <div className={styles.statInfo}>
                  <h3>{stats.totalCars}</h3>
                  <p>Tổng số xe</p>
                  <small className={styles.statChange}>+2 xe mới</small>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <i className="fas fa-users"></i>
                </div>
                <div className={styles.statInfo}>
                  <h3>{stats.totalUsers}</h3>
                  <p>Người dùng</p>
                  <small className={styles.statChange}>+15% tháng này</small>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <i className="fas fa-dollar-sign"></i>
                </div>
                <div className={styles.statInfo}>
                  <h3>{formatCurrency(stats.totalRevenue)}</h3>
                  <p>Doanh thu tháng</p>
                  <small className={styles.statChange}>+8.2% so với tháng trước</small>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <i className="fas fa-calendar-check"></i>
                </div>
                <div className={styles.statInfo}>
                  <h3>{stats.monthlyBookings}</h3>
                  <p>Đặt xe tháng này</p>
                  <small className={styles.statChange}>+{stats.activeBookings} đang hoạt động</small>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <i className="fas fa-star"></i>
                </div>
                <div className={styles.statInfo}>
                  <h3>{stats.avgRating.toFixed(1)}</h3>
                  <p>Đánh giá trung bình</p>
                  <small className={styles.statChange}>Tuyệt vời</small>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <i className="fas fa-tools"></i>
                </div>
                <div className={styles.statInfo}>
                  <h3>{stats.pendingMaintenance}</h3>
                  <p>Xe cần bảo trì</p>
                  <small className={styles.statChange}>Cần xem xét</small>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <i className="fas fa-clipboard-list"></i>
                </div>
                <div className={styles.statInfo}>
                  <h3>{stats.totalBookings}</h3>
                  <p>Tổng đặt xe</p>
                  <small className={styles.statChange}>Tất cả thời gian</small>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <i className="fas fa-clock"></i>
                </div>
                <div className={styles.statInfo}>
                  <h3>{stats.activeBookings}</h3>
                  <p>Đang thuê xe</p>
                  <small className={styles.statChange}>Hiện tại</small>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className={styles.recentActivity}>
              <h3>Hoạt động gần đây</h3>
              <div className={styles.activityList}>
                <div className={styles.activityItem}>
                  <i className="fas fa-user-plus"></i>
                  <span>Người dùng mới: Nguyễn Văn A đã đăng ký</span>
                  <time>2 giờ trước</time>
                </div>
                <div className={styles.activityItem}>
                  <i className="fas fa-car"></i>
                  <span>Xe mới được thêm: BMW 320</span>
                  <time>5 giờ trước</time>
                </div>
                <div className={styles.activityItem}>
                  <i className="fas fa-booking"></i>
                  <span>Đặt xe mới: Toyota Camry được đặt</span>
                  <time>1 ngày trước</time>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cars' && (
          <div className={styles.carsManagement}>
            <div className={styles.sectionHeader}>
              <h3>Quản lý xe</h3>
              <button className={styles.addButton}>
                <i className="fas fa-plus"></i>
                Thêm xe mới
              </button>
            </div>
            
            <div className={styles.carsGrid}>
              {cars.map((car, index) => (
                <div key={index} className={`${styles.carCard} ${styles[car.status]}`}>
                  <div className={styles.carStatus}>
                    <span className={`${styles.statusBadge} ${styles[car.status]}`}>
                      {car.status === 'available' && 'Có sẵn'}
                      {car.status === 'rented' && 'Đang thuê'}
                      {car.status === 'maintenance' && 'Bảo trì'}
                      {car.status === 'unavailable' && 'Không khả dụng'}
                    </span>
                  </div>
                  <div className={styles.carImage}>
                    <img src={car.img} alt={car.name} />
                    <div className={styles.carRating}>
                      <i className="fas fa-star"></i>
                      <span>{car.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className={styles.carInfo}>
                    <h4>{car.name}</h4>
                    <p className={styles.carDetails}>
                      {car.mark} • {car.year} • {car.fuel}
                    </p>
                    <div className={styles.carStats}>
                      <span className={styles.bookingCount}>
                        <i className="fas fa-calendar"></i>
                        {car.totalBookings} lượt thuê
                      </span>
                    </div>
                    <p className={styles.carPrice}>{formatCurrency(car.price * 1000000)}/ngày</p>
                  </div>
                  <div className={styles.carActions}>
                    <button className={styles.viewButton} title="Xem chi tiết">
                      <i className="fas fa-eye"></i>
                    </button>
                    <button className={styles.editButton} title="Chỉnh sửa">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className={styles.deleteButton}
                      onClick={() => handleDeleteCar(index)}
                      title="Xóa xe"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className={styles.usersManagement}>
            <div className={styles.sectionHeader}>
              <h3>Quản lý người dùng</h3>
              <button className={styles.addButton}>
                <i className="fas fa-user-plus"></i>
                Thêm người dùng
              </button>
            </div>
            
            <div className={styles.usersTable}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Ngày tham gia</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>#{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`${styles.roleBadge} ${styles[user.role.toLowerCase()]}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{user.joinDate}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[user.status.toLowerCase()]}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.tableActions}>
                          <button className={styles.editButton}>
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className={styles.deleteButton}
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className={styles.bookingsManagement}>
            <div className={styles.sectionHeader}>
              <h3>Quản lý đặt xe</h3>
              <div className={styles.filterButtons}>
                <button className={`${styles.filterButton} ${styles.active}`}>
                  Tất cả ({bookings.length})
                </button>
                <button className={styles.filterButton}>
                  Chờ duyệt ({bookings.filter(b => b.status === 'pending').length})
                </button>
                <button className={styles.filterButton}>
                  Đang thuê ({bookings.filter(b => b.status === 'ongoing').length})
                </button>
              </div>
            </div>
            
            <div className={styles.bookingsTable}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Khách hàng</th>
                    <th>Xe</th>
                    <th>Ngày thuê</th>
                    <th>Ngày trả</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Thanh toán</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(booking => (
                    <tr key={booking.id}>
                      <td>#{booking.id}</td>
                      <td>{booking.userName}</td>
                      <td>{booking.carName}</td>
                      <td>{booking.startDate}</td>
                      <td>{booking.endDate}</td>
                      <td>{formatCurrency(booking.totalAmount)}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[booking.status]}`}>
                          {booking.status === 'pending' && 'Chờ duyệt'}
                          {booking.status === 'confirmed' && 'Đã duyệt'}
                          {booking.status === 'ongoing' && 'Đang thuê'}
                          {booking.status === 'completed' && 'Hoàn thành'}
                          {booking.status === 'cancelled' && 'Đã hủy'}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.paymentBadge} ${styles[booking.paymentStatus]}`}>
                          {booking.paymentStatus === 'pending' && 'Chờ thanh toán'}
                          {booking.paymentStatus === 'paid' && 'Đã thanh toán'}
                          {booking.paymentStatus === 'refunded' && 'Đã hoàn tiền'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.tableActions}>
                          <button className={styles.viewButton} title="Xem chi tiết">
                            <i className="fas fa-eye"></i>
                          </button>
                          <button className={styles.editButton} title="Chỉnh sửa">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button className={styles.approveButton} title="Duyệt">
                            <i className="fas fa-check"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className={styles.analytics}>
            <div className={styles.analyticsHeader}>
              <h3>Thống kê và báo cáo</h3>
              <div className={styles.dateRange}>
                <button className={styles.dateButton}>
                  <i className="fas fa-calendar"></i>
                  Tháng này
                </button>
              </div>
            </div>
            
            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <h4>Doanh thu theo tháng</h4>
                <div className={styles.chartPlaceholder}>
                  <i className="fas fa-chart-line"></i>
                  <p>Biểu đồ xu hướng doanh thu</p>
                  <small>Tích hợp Chart.js để hiển thị data</small>
                </div>
              </div>
              
              <div className={styles.chartCard}>
                <h4>Xe được thuê nhiều nhất</h4>
                <div className={styles.chartPlaceholder}>
                  <i className="fas fa-chart-pie"></i>
                  <p>Biểu đồ tròn phân tích</p>
                  <small>Top 5 xe có lượt thuê cao</small>
                </div>
              </div>

              <div className={styles.chartCard}>
                <h4>Thống kê người dùng</h4>
                <div className={styles.chartPlaceholder}>
                  <i className="fas fa-chart-bar"></i>
                  <p>Biểu đồ cột người dùng</p>
                  <small>Người dùng mới theo tháng</small>
                </div>
              </div>

              <div className={styles.chartCard}>
                <h4>Tỷ lệ sử dụng xe</h4>
                <div className={styles.chartPlaceholder}>
                  <i className="fas fa-chart-area"></i>
                  <p>Biểu đồ diện tích</p>
                  <small>Tỷ lệ % xe được thuê</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={styles.settings}>
            <h3>Cài đặt hệ thống</h3>
            
            <div className={styles.settingsGrid}>
              <div className={styles.settingCard}>
                <div className={styles.settingHeader}>
                  <h4>
                    <i className="fas fa-cog"></i>
                    Cài đặt chung
                  </h4>
                </div>
                <div className={styles.settingContent}>
                  <div className={styles.settingItem}>
                    <label>Tên hệ thống</label>
                    <input type="text" value="E-Drive" className={styles.settingInput} />
                  </div>
                  <div className={styles.settingItem}>
                    <label>Email liên hệ</label>
                    <input type="email" value="admin@e-drive.com" className={styles.settingInput} />
                  </div>
                  <div className={styles.settingItem}>
                    <label>Số điện thoại</label>
                    <input type="tel" value="1900-1234" className={styles.settingInput} />
                  </div>
                </div>
              </div>

              <div className={styles.settingCard}>
                <div className={styles.settingHeader}>
                  <h4>
                    <i className="fas fa-dollar-sign"></i>
                    Cài đặt giá cả
                  </h4>
                </div>
                <div className={styles.settingContent}>
                  <div className={styles.settingItem}>
                    <label>Phí đặt cọc (%)</label>
                    <input type="number" value="20" className={styles.settingInput} />
                  </div>
                  <div className={styles.settingItem}>
                    <label>Phí hủy đặt (%)</label>
                    <input type="number" value="10" className={styles.settingInput} />
                  </div>
                  <div className={styles.settingItem}>
                    <label>Giảm giá thuê dài hạn (%)</label>
                    <input type="number" value="15" className={styles.settingInput} />
                  </div>
                </div>
              </div>

              <div className={styles.settingCard}>
                <div className={styles.settingHeader}>
                  <h4>
                    <i className="fas fa-bell"></i>
                    Thông báo
                  </h4>
                </div>
                <div className={styles.settingContent}>
                  <div className={styles.settingToggle}>
                    <label>Email thông báo đặt xe mới</label>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <div className={styles.settingToggle}>
                    <label>SMS xác nhận đặt xe</label>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <div className={styles.settingToggle}>
                    <label>Thông báo bảo trì xe</label>
                    <input type="checkbox" />
                  </div>
                </div>
              </div>

              <div className={styles.settingCard}>
                <div className={styles.settingHeader}>
                  <h4>
                    <i className="fas fa-shield-alt"></i>
                    Bảo mật
                  </h4>
                </div>
                <div className={styles.settingContent}>
                  <button className={styles.securityButton}>
                    <i className="fas fa-key"></i>
                    Đổi mật khẩu admin
                  </button>
                  <button className={styles.securityButton}>
                    <i className="fas fa-download"></i>
                    Sao lưu dữ liệu
                  </button>
                  <button className={styles.securityButton}>
                    <i className="fas fa-history"></i>
                    Xem lịch sử đăng nhập
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.saveSettings}>
              <button className={styles.saveButton}>
                <i className="fas fa-save"></i>
                Lưu cài đặt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;