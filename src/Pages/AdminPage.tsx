import React, { useState, useEffect } from 'react';
import { CAR_DATA } from '../constants/CarDatas';
import type { CarType } from '../constants/CarDatas';
import { fetchVehiclesFromApi, createVehicle, getVehicleById, updateVehicle, deleteVehicle } from '../services/vehicleApi';
import styles from '../styles/AdminStyles/AdminPage.module.scss';

// Helper functions để format giá tiền
const formatPriceInput = (value: number | string): string => {
  if (!value) return '';
  const numValue = typeof value === 'string' ? parseInt(value.replace(/\./g, ''), 10) : value;
  if (isNaN(numValue)) return '';
  return numValue.toLocaleString('vi-VN');
};

const parsePriceInput = (value: string): number => {
  if (!value) return 0;
  return parseInt(value.replace(/\./g, ''), 10) || 0;
};

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

interface TestDriveBooking {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  idCardNo: string;
  dealerId: number;
  dealerName: string;
  vehicleId: number;
  vehicleName: string;
  scheduleDatetime: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  note: string;
  createdAt: string;
  updatedAt: string;
}



const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cars' | 'users' | 'bookings' | 'testdrives' | 'analytics' | 'settings'>('dashboard');
  const [cars, setCars] = useState<CarWithStatus[]>([]);
  const [testDrives, setTestDrives] = useState<TestDriveBooking[]>([]);
  const [showAddCarModal, setShowAddCarModal] = useState<boolean>(false);
  const [showViewCarModal, setShowViewCarModal] = useState<boolean>(false);
  const [showEditCarModal, setShowEditCarModal] = useState<boolean>(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [editingCar, setEditingCar] = useState<any>(null);
  const [newCar, setNewCar] = useState({
    modelName: '',
    version: '',
    color: '',
    batteryCapacityKwh: 0,
    rangeKm: 0,
    maxSpeedKmh: 0,
    chargingTimeHours: 0,
    seatingCapacity: 0,
    motorPowerKw: 0,
    weightKg: 0,
    lengthMm: 0,
    widthMm: 0,
    heightMm: 0,
    priceRetail: 0,
    status: 'AVAILABLE' as 'AVAILABLE' | 'DISCONTINUED',
    manufactureYear: new Date().getFullYear()
  });
  const [editCar, setEditCar] = useState({
    modelName: '',
    version: '',
    color: '',
    batteryCapacityKwh: 0,
    rangeKm: 0,
    maxSpeedKmh: 0,
    chargingTimeHours: 0,
    seatingCapacity: 0,
    motorPowerKw: 0,
    weightKg: 0,
    lengthMm: 0,
    widthMm: 0,
    heightMm: 0,
    priceRetail: 0,
    status: 'AVAILABLE' as 'AVAILABLE' | 'DISCONTINUED',
    manufactureYear: new Date().getFullYear()
  });
  const [isCreatingVehicle, setIsCreatingVehicle] = useState<boolean>(false);
  const [isUpdatingVehicle, setIsUpdatingVehicle] = useState<boolean>(false);
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
    // Fetch vehicles from API for Cars management tab
    (async () => {
      try {
        const { vehicles } = await fetchVehiclesFromApi({ page: 0, size: 20 });
        const apiCars: CarWithStatus[] = vehicles.map((v) => ({
          // Map API fields to UI fields
          id: v.vehicleId,
          name: `${v.modelName} ${v.version}`,
          img: `src/images/cars-big/car-${v.vehicleId}.jpg`,
          mark: v.modelName,
          model: v.version || v.modelName,
          year: (v as any).manufactureYear || 2024,
          doors: '4/5',
          air: 'Yes',
          transmission: 'Automatic',
          fuel: 'Electric',
          price: v.priceRetail,
          rating: 4.2 + Math.random() * 0.8,
          totalBookings: Math.floor(Math.random() * 50) + 10,
          status: v.status === 'AVAILABLE' ? 'available' : (v.status === 'DISCONTINUED' ? 'unavailable' : 'available'),
          lastMaintenance: '2024-09-15'
        }));
        setCars(apiCars);
      } catch (err) {
        // Fallback to existing mock in case API fails
        const flattenedCars = CAR_DATA.flat();
        const fallbackCars: CarWithStatus[] = flattenedCars.map((car, index) => ({
          ...car,
          id: index + 1,
          status: ['available', 'rented', 'maintenance'][Math.floor(Math.random() * 3)] as 'available' | 'rented' | 'maintenance',
          totalBookings: Math.floor(Math.random() * 50) + 10,
          rating: 4.2 + Math.random() * 0.8,
          lastMaintenance: '2024-09-15'
        }));
        setCars(fallbackCars);
      }
    })();

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

    // Mock test drives data
    const mockTestDrives: TestDriveBooking[] = [
      {
        id: 1,
        customerId: 1,
        customerName: 'Nguyễn Văn A',
        customerEmail: 'nguyenvana@email.com',
        customerPhone: '0901234567',
        idCardNo: '123456789012',
        vehicleId: 1,
        vehicleName: 'VW Golf 6',
        dealerId: 1,
        dealerName: 'E-Drive Hà Nội',
        scheduleDatetime: '2024-10-15T14:30:00',
        date: '2024-10-15',
        time: '14:30',
        note: 'Muốn lái thử để cảm nhận cảm giác lái',
        status: 'pending',
        createdAt: '2024-10-13T10:20:00',
        updatedAt: '2024-10-13T10:20:00'
      },
      {
        id: 2,
        customerId: 2,
        customerName: 'Trần Thị B',
        customerEmail: 'tranthib@email.com',
        customerPhone: '0902345678',
        idCardNo: '987654321098',
        vehicleId: 2,
        vehicleName: 'Audi A1 S-Line',
        dealerId: 2,
        dealerName: 'E-Drive TP.HCM',
        scheduleDatetime: '2024-10-16T10:00:00',
        date: '2024-10-16',
        time: '10:00',
        note: 'Quan tâm đến tính năng an toàn',
        status: 'confirmed',
        createdAt: '2024-10-12T15:45:00',
        updatedAt: '2024-10-13T09:15:00'
      },
      {
        id: 3,
        customerId: 3,
        customerName: 'Lê Minh C',
        customerEmail: 'leminhc@email.com',
        customerPhone: '0903456789',
        idCardNo: '456789123456',
        vehicleId: 3,
        vehicleName: 'Toyota Camry',
        dealerId: 1,
        dealerName: 'E-Drive Hà Nội',
        scheduleDatetime: '2024-10-14T16:00:00',
        date: '2024-10-14',
        time: '16:00',
        note: 'Cần tư vấn về động cơ hybrid',
        status: 'completed',
        createdAt: '2024-10-10T11:30:00',
        updatedAt: '2024-10-14T16:30:00'
      },
      {
        id: 4,
        customerId: 4,
        customerName: 'Phạm Thị D',
        customerEmail: 'phamthid@email.com',
        customerPhone: '0904567890',
        idCardNo: '789123456789',
        vehicleId: 4,
        vehicleName: 'BMW 320',
        dealerId: 3,
        dealerName: 'E-Drive Đà Nẵng',
        scheduleDatetime: '2024-10-18T11:30:00',
        date: '2024-10-18',
        time: '11:30',
        note: 'So sánh với các dòng xe cùng phân khúc',
        status: 'confirmed',
        createdAt: '2024-10-13T14:20:00',
        updatedAt: '2024-10-13T14:20:00'
      }
    ];
    setTestDrives(mockTestDrives);

    // Calculate enhanced stats
    setStats({
      totalCars: cars.length || 0,
      totalUsers: mockUsers.length,
      totalRevenue: 125000000,
      monthlyBookings: 45,
      activeBookings: mockBookings.filter(b => b.status === 'ongoing').length,
      totalBookings: mockBookings.length,
      avgRating: 4.6,
      pendingMaintenance: 0
    });
  }, []);

  const handleDeleteCar = async (carId: number, carName: string) => {
    // Hiển thị dialog xác nhận trước khi xóa
    const confirmMessage = `Bạn có chắc chắn muốn xóa xe "${carName}"?\n\nHành động này không thể hoàn tác.`;

    if (!window.confirm(confirmMessage)) {
      return; // Người dùng hủy xóa
    }

    try {
      console.log('🗑️ Deleting car with ID:', carId);

      // Gọi API để xóa xe từ database
      await deleteVehicle(carId);

      // Cập nhật state để loại bỏ xe đã xóa khỏi danh sách
      setCars(cars.filter(car => car.id !== carId));

      // Hiển thị thông báo thành công
      alert(`✅ Đã xóa xe "${carName}" thành công!`);

      // Cập nhật stats
      setStats(prevStats => ({
        ...prevStats,
        totalCars: prevStats.totalCars - 1
      }));

    } catch (error) {
      console.error('❌ Error deleting car:', error);
      alert(`❌ Không thể xóa xe "${carName}". ${error instanceof Error ? error.message : 'Vui lòng thử lại.'}`);
    }
  };

  const handleViewCar = async (carId: number) => {
    try {
      console.log('🔍 Viewing car with ID:', carId);

      const vehicleData = await getVehicleById(carId);
      setSelectedCar(vehicleData);
      setShowViewCarModal(true);
    } catch (error) {
      console.error('❌ Error fetching car details:', error);
      alert('❌ Không thể tải thông tin xe. Vui lòng thử lại.');
    }
  };



  const handleEditCar = async (carId: number) => {
    try {
      console.log('✏️ Editing car with ID:', carId);

      const vehicleData = await getVehicleById(carId);
      setEditingCar(vehicleData);

      // Populate edit form with current vehicle data
      setEditCar({
        modelName: vehicleData.modelName,
        version: vehicleData.version,
        color: vehicleData.color,
        batteryCapacityKwh: vehicleData.batteryCapacityKwh,
        rangeKm: vehicleData.rangeKm,
        maxSpeedKmh: vehicleData.maxSpeedKmh,
        chargingTimeHours: vehicleData.chargingTimeHours,
        seatingCapacity: vehicleData.seatingCapacity,
        motorPowerKw: vehicleData.motorPowerKw,
        weightKg: vehicleData.weightKg,
        lengthMm: vehicleData.lengthMm,
        widthMm: vehicleData.widthMm,
        heightMm: vehicleData.heightMm,
        priceRetail: vehicleData.priceRetail,
        status: vehicleData.status as 'AVAILABLE' | 'DISCONTINUED',
        manufactureYear: (vehicleData as any).manufactureYear || new Date().getFullYear()
      });

      setShowEditCarModal(true);
    } catch (error) {
      console.error('❌ Error fetching car details for edit:', error);
      alert('❌ Không thể tải thông tin xe để chỉnh sửa. Vui lòng thử lại.');
    }
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
            className={`${styles.navTab} ${activeTab === 'testdrives' ? styles.active : ''}`}
            onClick={() => setActiveTab('testdrives')}
          >
            <i className="fas fa-car"></i>
            Lái thử ({testDrives.length})
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
              <button className={styles.addButton} onClick={() => setShowAddCarModal(true)}>
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
                    {/* <div className={styles.carStats}>
                      <span className={styles.bookingCount}>
                        <i className="fas fa-calendar"></i>
                        {car.totalBookings} lượt đặt
                      </span>
                    </div> */}
                    <p className={styles.carPrice}>{formatCurrency(car.price)}</p>
                  </div>
                  <div className={styles.carActions}>
                    <button
                      className={styles.viewButton}
                      title="Xem chi tiết"
                      onClick={() => handleViewCar(car.id)}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button
                      className={styles.editButton}
                      title="Chỉnh sửa"
                      onClick={() => handleEditCar(car.id)}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteCar(car.id, car.name)}
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

        {activeTab === 'testdrives' && (
          <div className={styles.testDrivesManagement}>
            <div className={styles.sectionHeader}>
              <h3>Quản lý đăng ký lái thử</h3>
              <div className={styles.filterButtons}>
                <button className={`${styles.filterButton} ${styles.active}`}>
                  Tất cả ({testDrives.length})
                </button>
                <button className={styles.filterButton}>
                  Chờ xác nhận ({testDrives.filter(td => td.status === 'pending').length})
                </button>
                <button className={styles.filterButton}>
                  Đã xác nhận ({testDrives.filter(td => td.status === 'confirmed').length})
                </button>
                <button className={styles.filterButton}>
                  Hoàn thành ({testDrives.filter(td => td.status === 'completed').length})
                </button>
              </div>
            </div>

            <div className={styles.testDrivesTable}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Khách hàng</th>
                    <th>Liên hệ</th>
                    <th>Xe lái thử</th>
                    <th>Đại lý</th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                    <th>Ghi chú</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {testDrives.map(testDrive => (
                    <tr key={testDrive.id}>
                      <td>#{testDrive.id}</td>
                      <td>
                        <div>
                          <div style={{fontWeight: 'bold'}}>{testDrive.customerName}</div>
                          <div style={{fontSize: '12px', color: '#666'}}>
                            CCCD: {testDrive.idCardNo}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div style={{fontSize: '12px'}}>{testDrive.customerPhone}</div>
                          <div style={{fontSize: '12px', color: '#666'}}>{testDrive.customerEmail}</div>
                        </div>
                      </td>
                      <td>{testDrive.vehicleName}</td>
                      <td>{testDrive.dealerName}</td>
                      <td>
                        <div>
                          <div>{testDrive.date}</div>
                          <div style={{fontSize: '12px', color: '#666'}}>{testDrive.time}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[testDrive.status]}`}>
                          {testDrive.status === 'pending' && 'Chờ xác nhận'}
                          {testDrive.status === 'confirmed' && 'Đã xác nhận'}
                          {testDrive.status === 'completed' && 'Hoàn thành'}
                          {testDrive.status === 'cancelled' && 'Đã hủy'}
                          {testDrive.status === 'no-show' && 'Không đến'}
                        </span>
                      </td>
                      <td>
                        <div style={{maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                          {testDrive.note || 'Không có ghi chú'}
                        </div>
                      </td>
                      <td>
                        <div className={styles.tableActions}>
                          {testDrive.status === 'pending' && (
                            <button 
                              className={styles.approveButton} 
                              title="Xác nhận"
                              onClick={() => {
                                // Handle confirm
                                const updatedTestDrives = testDrives.map(td =>
                                  td.id === testDrive.id ? { ...td, status: 'confirmed' as const } : td
                                );
                                setTestDrives(updatedTestDrives);
                              }}
                            >
                              <i className="fas fa-check"></i>
                            </button>
                          )}
                          {testDrive.status === 'confirmed' && (
                            <button 
                              className={styles.completeButton} 
                              title="Hoàn thành"
                              onClick={() => {
                                // Handle complete
                                const updatedTestDrives = testDrives.map(td =>
                                  td.id === testDrive.id ? { ...td, status: 'completed' as const } : td
                                );
                                setTestDrives(updatedTestDrives);
                              }}
                            >
                              <i className="fas fa-flag-checkered"></i>
                            </button>
                          )}
                          <button 
                            className={styles.cancelButton} 
                            title="Hủy"
                            onClick={() => {
                              // Handle cancel
                              if (window.confirm('Bạn có chắc muốn hủy đăng ký lái thử này?')) {
                                const updatedTestDrives = testDrives.map(td =>
                                  td.id === testDrive.id ? { ...td, status: 'cancelled' as const } : td
                                );
                                setTestDrives(updatedTestDrives);
                              }
                            }}
                          >
                            <i className="fas fa-times"></i>
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

        {showAddCarModal && (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true">
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h4 className={styles.modalTitle}>
                  <i className="fas fa-car"></i>
                  Thêm xe mới
                </h4>
                <button
                  className={styles.closeButton}
                  aria-label="Đóng"
                  onClick={() => setShowAddCarModal(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formColumn}>
                    <div className={styles.settingItem}>
                      <label>Model name</label>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={newCar.modelName}
                        onChange={(e) => setNewCar({ ...newCar, modelName: e.target.value })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Color</label>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={newCar.color}
                        onChange={(e) => setNewCar({ ...newCar, color: e.target.value })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Range (km)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.rangeKm || ''}
                        onChange={(e) => setNewCar({ ...newCar, rangeKm: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Charge time (h)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.chargingTimeHours || ''}
                        onChange={(e) => setNewCar({ ...newCar, chargingTimeHours: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Motor (kW)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.motorPowerKw || ''}
                        onChange={(e) => setNewCar({ ...newCar, motorPowerKw: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                  </div>

                  <div className={styles.formColumn}>
                    <div className={styles.settingItem}>
                      <label>Version</label>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={newCar.version}
                        onChange={(e) => setNewCar({ ...newCar, version: e.target.value })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Battery kWh</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.batteryCapacityKwh || ''}
                        onChange={(e) => setNewCar({ ...newCar, batteryCapacityKwh: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Max speed (km/h)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.maxSpeedKmh || ''}
                        onChange={(e) => setNewCar({ ...newCar, maxSpeedKmh: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Seats</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.seatingCapacity || ''}
                        onChange={(e) => setNewCar({ ...newCar, seatingCapacity: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Weight (kg)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.weightKg || ''}
                        onChange={(e) => setNewCar({ ...newCar, weightKg: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                  </div>

                  <div className={styles.formColumn}>
                    <div className={styles.settingItem}>
                      <label>Length (mm)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.lengthMm || ''}
                        onChange={(e) => setNewCar({ ...newCar, lengthMm: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Width (mm)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.widthMm || ''}
                        onChange={(e) => setNewCar({ ...newCar, widthMm: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Height (mm)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.heightMm || ''}
                        onChange={(e) => setNewCar({ ...newCar, heightMm: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Year</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.manufactureYear || ''}
                        onChange={(e) => setNewCar({ ...newCar, manufactureYear: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Price (VND)</label>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={formatPriceInput(newCar.priceRetail)}
                        onChange={(e) => {
                          const numericValue = parsePriceInput(e.target.value);
                          setNewCar({ ...newCar, priceRetail: numericValue });
                        }}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Status</label>
                      <select
                        className={styles.settingInput}
                        value={newCar.status}
                        onChange={(e) => setNewCar({ ...newCar, status: e.target.value as 'AVAILABLE' | 'DISCONTINUED' })}
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="DISCONTINUED">DISCONTINUED</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => setShowAddCarModal(false)}
                >
                  Hủy
                </button>
                <button
                  className={`${styles.primaryButton} ${isCreatingVehicle ? styles.loading : ''}`}
                  onClick={async () => {
                    if (isCreatingVehicle) return; // Prevent multiple clicks

                    try {
                      setIsCreatingVehicle(true);

                      // Validation: Kiểm tra các trường bắt buộc
                      if (!newCar.modelName.trim()) {
                        alert('❌ Vui lòng nhập tên model xe');
                        return;
                      }
                      if (!newCar.version.trim()) {
                        alert('❌ Vui lòng nhập version xe');
                        return;
                      }
                      if (!newCar.color.trim()) {
                        alert('❌ Vui lòng nhập màu xe');
                        return;
                      }

                      // Validation: Kiểm tra các trường số phải lớn hơn 0
                      const numericFields = [
                        { key: 'batteryCapacityKwh', name: 'Dung lượng pin (kWh)' },
                        { key: 'rangeKm', name: 'Tầm hoạt động (km)' },
                        { key: 'maxSpeedKmh', name: 'Tốc độ tối đa (km/h)' },
                        { key: 'chargingTimeHours', name: 'Thời gian sạc (giờ)' },
                        { key: 'seatingCapacity', name: 'Số ghế' },
                        { key: 'motorPowerKw', name: 'Công suất động cơ (kW)' },
                        { key: 'weightKg', name: 'Trọng lượng (kg)' },
                        { key: 'lengthMm', name: 'Chiều dài (mm)' },
                        { key: 'widthMm', name: 'Chiều rộng (mm)' },
                        { key: 'heightMm', name: 'Chiều cao (mm)' },
                        { key: 'priceRetail', name: 'Giá bán (VND)' }
                      ];

                      for (const field of numericFields) {
                        const value = newCar[field.key as keyof typeof newCar];
                        if (typeof value === 'number' && value <= 0) {
                          alert(`❌ ${field.name} phải lớn hơn 0`);
                          return;
                        }
                      }

                      // Validation: Kiểm tra năm sản xuất hợp lệ
                      const currentYear = new Date().getFullYear();
                      if (newCar.manufactureYear < 2000 || newCar.manufactureYear > currentYear + 1) {
                        alert(`❌ Năm sản xuất phải từ 2000 đến ${currentYear + 1}`);
                        return;
                      }

                      // Chuẩn bị dữ liệu để gửi lên API
                      const vehicleData = {
                        modelName: newCar.modelName.trim(),
                        version: newCar.version.trim(),
                        color: newCar.color.trim(),
                        batteryCapacityKwh: newCar.batteryCapacityKwh,
                        rangeKm: newCar.rangeKm,
                        maxSpeedKmh: newCar.maxSpeedKmh,
                        chargingTimeHours: newCar.chargingTimeHours,
                        seatingCapacity: newCar.seatingCapacity,
                        motorPowerKw: newCar.motorPowerKw,
                        weightKg: newCar.weightKg,
                        lengthMm: newCar.lengthMm,
                        widthMm: newCar.widthMm,
                        heightMm: newCar.heightMm,
                        priceRetail: newCar.priceRetail,
                        status: newCar.status,
                        manufactureYear: newCar.manufactureYear
                      };

                      console.log('🚗 Creating vehicle with data:', vehicleData);

                      // Gửi lên API để lưu vào database
                      const createdVehicle = await createVehicle(vehicleData);

                      // Tạo xe mới từ API response
                      const created: CarWithStatus = {
                        id: createdVehicle.vehicleId,
                        name: `${createdVehicle.modelName} ${createdVehicle.version}`.trim(),
                        img: 'src/images/cars-big/carforbox.jpg',
                        mark: createdVehicle.modelName,
                        model: createdVehicle.version,
                        year: newCar.manufactureYear,
                        doors: '4/5',
                        air: 'Yes',
                        transmission: 'Automatic',
                        fuel: 'Electric',
                        price: createdVehicle.priceRetail,
                        rating: 4.5,
                        totalBookings: 0,
                        status: createdVehicle.status === 'AVAILABLE' ? 'available' : 'unavailable',
                        lastMaintenance: new Date().toISOString().slice(0, 10)
                      };

                      // Thêm xe mới vào danh sách
                      setCars([created, ...cars]);
                      setShowAddCarModal(false);

                      // Reset form
                      setNewCar({
                        modelName: '',
                        version: '',
                        color: '',
                        batteryCapacityKwh: 0,
                        rangeKm: 0,
                        maxSpeedKmh: 0,
                        chargingTimeHours: 0,
                        seatingCapacity: 0,
                        motorPowerKw: 0,
                        weightKg: 0,
                        lengthMm: 0,
                        widthMm: 0,
                        heightMm: 0,
                        priceRetail: 0,
                        status: 'AVAILABLE',
                        manufactureYear: new Date().getFullYear()
                      });

                      // Cập nhật stats
                      setStats(prevStats => ({
                        ...prevStats,
                        totalCars: prevStats.totalCars + 1
                      }));

                      alert('✅ Đã thêm xe mới thành công!');
                    } catch (error) {
                      console.error('❌ Lỗi khi thêm xe:', error);

                      // Hiển thị thông báo lỗi chi tiết hơn
                      if (error instanceof Error) {
                        // Nếu có thông báo lỗi từ API
                        if (error.message.includes('must be greater than 0')) {
                          alert('❌ Lỗi: Tất cả các trường số phải lớn hơn 0. Vui lòng kiểm tra lại thông tin nhập vào.');
                        } else if (error.message.includes('400')) {
                          alert('❌ Lỗi: Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin nhập vào.');
                        } else {
                          alert(`❌ Lỗi: ${error.message}`);
                        }
                      } else {
                        alert('❌ Có lỗi xảy ra khi thêm xe. Vui lòng thử lại.');
                      }
                    } finally {
                      setIsCreatingVehicle(false);
                    }
                  }}
                  disabled={isCreatingVehicle}
                >
                  {isCreatingVehicle ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Đang lưu...
                    </>
                  ) : (
                    'Lưu xe'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Car Modal */}
        {showEditCarModal && editingCar && (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true">
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h4 className={styles.modalTitle}>
                  <i className="fas fa-edit"></i>
                  Chỉnh sửa xe - {editingCar.modelName} {editingCar.version}
                </h4>
                <button
                  className={styles.closeButton}
                  aria-label="Đóng"
                  onClick={() => {
                    setShowEditCarModal(false);
                    setEditingCar(null);
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formColumn}>
                    <div className={styles.settingItem}>
                      <label>Model name</label>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={editCar.modelName}
                        onChange={(e) => setEditCar({ ...editCar, modelName: e.target.value })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Color</label>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={editCar.color}
                        onChange={(e) => setEditCar({ ...editCar, color: e.target.value })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Range (km)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.rangeKm || ''}
                        onChange={(e) => setEditCar({ ...editCar, rangeKm: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Charge time (h)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.chargingTimeHours || ''}
                        onChange={(e) => setEditCar({ ...editCar, chargingTimeHours: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Motor (kW)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.motorPowerKw || ''}
                        onChange={(e) => setEditCar({ ...editCar, motorPowerKw: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                  </div>

                  <div className={styles.formColumn}>
                    <div className={styles.settingItem}>
                      <label>Version</label>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={editCar.version}
                        onChange={(e) => setEditCar({ ...editCar, version: e.target.value })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Battery kWh</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.batteryCapacityKwh || ''}
                        onChange={(e) => setEditCar({ ...editCar, batteryCapacityKwh: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Max speed (km/h)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.maxSpeedKmh || ''}
                        onChange={(e) => setEditCar({ ...editCar, maxSpeedKmh: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Seats</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.seatingCapacity || ''}
                        onChange={(e) => setEditCar({ ...editCar, seatingCapacity: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Weight (kg)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.weightKg || ''}
                        onChange={(e) => setEditCar({ ...editCar, weightKg: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                  </div>

                  <div className={styles.formColumn}>
                    <div className={styles.settingItem}>
                      <label>Length (mm)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.lengthMm || ''}
                        onChange={(e) => setEditCar({ ...editCar, lengthMm: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Width (mm)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.widthMm || ''}
                        onChange={(e) => setEditCar({ ...editCar, widthMm: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Height (mm)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.heightMm || ''}
                        onChange={(e) => setEditCar({ ...editCar, heightMm: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Year</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.manufactureYear || ''}
                        onChange={(e) => setEditCar({ ...editCar, manufactureYear: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Price (VND)</label>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={formatPriceInput(editCar.priceRetail)}
                        onChange={(e) => {
                          const numericValue = parsePriceInput(e.target.value);
                          setEditCar({...editCar, priceRetail: numericValue});
                        }}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Status</label>
                      <select
                        className={styles.settingInput}
                        value={editCar.status}
                        onChange={(e) => setEditCar({ ...editCar, status: e.target.value as 'AVAILABLE' | 'DISCONTINUED' })}
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="DISCONTINUED">DISCONTINUED</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowEditCarModal(false);
                    setEditingCar(null);
                  }}
                >
                  Hủy
                </button>
                <button
                  className={`${styles.primaryButton} ${isUpdatingVehicle ? styles.loading : ''}`}
                  onClick={async () => {
                    if (isUpdatingVehicle) return; // Prevent multiple clicks

                    try {
                      setIsUpdatingVehicle(true);

                      // Validate required fields
                      if (!editCar.modelName || !editCar.version || !editCar.color) {
                        alert('❌ Vui lòng điền đầy đủ thông tin bắt buộc: Model name, Version, Color');
                        return;
                      }

                      // Validate numeric fields (must be greater than 0)
                      const numericFields = [
                        'batteryCapacityKwh', 'rangeKm', 'maxSpeedKmh', 'chargingTimeHours',
                        'seatingCapacity', 'motorPowerKw', 'weightKg', 'lengthMm', 'widthMm',
                        'heightMm', 'priceRetail'
                      ];

                      for (const field of numericFields) {
                        const value = editCar[field as keyof typeof editCar];
                        if (typeof value === 'number' && value <= 0) {
                          alert(`❌ Trường ${field} phải lớn hơn 0`);
                          return;
                        }
                      }

                      // Chuẩn bị dữ liệu để gửi lên API
                      const vehicleData = {
                        modelName: editCar.modelName,
                        version: editCar.version,
                        color: editCar.color,
                        batteryCapacityKwh: editCar.batteryCapacityKwh,
                        rangeKm: editCar.rangeKm,
                        maxSpeedKmh: editCar.maxSpeedKmh,
                        chargingTimeHours: editCar.chargingTimeHours,
                        seatingCapacity: editCar.seatingCapacity,
                        motorPowerKw: editCar.motorPowerKw,
                        weightKg: editCar.weightKg,
                        lengthMm: editCar.lengthMm,
                        widthMm: editCar.widthMm,
                        heightMm: editCar.heightMm,
                        priceRetail: editCar.priceRetail,
                        status: editCar.status,
                        manufactureYear: editCar.manufactureYear
                      };

                      // Gửi lên API để cập nhật trong database
                      const updatedVehicle = await updateVehicle(editingCar.vehicleId, vehicleData);

                      // Cập nhật xe trong danh sách
                      const updatedCars = cars.map(car => {
                        if (car.id === editingCar.vehicleId) {
                          return {
                            ...car,
                            name: `${updatedVehicle.modelName} ${updatedVehicle.version}`.trim(),
                            mark: updatedVehicle.modelName,
                            model: updatedVehicle.version,
                            year: editCar.manufactureYear,
                            price: updatedVehicle.priceRetail,
                            status: updatedVehicle.status === 'AVAILABLE' ? 'available' : 'unavailable' as 'available' | 'rented' | 'maintenance' | 'unavailable'
                          };
                        }
                        return car;
                      });

                      setCars(updatedCars);
                      setShowEditCarModal(false);
                      setEditingCar(null);

                      // Reset form
                      setEditCar({
                        modelName: '',
                        version: '',
                        color: '',
                        batteryCapacityKwh: 0,
                        rangeKm: 0,
                        maxSpeedKmh: 0,
                        chargingTimeHours: 0,
                        seatingCapacity: 0,
                        motorPowerKw: 0,
                        weightKg: 0,
                        lengthMm: 0,
                        widthMm: 0,
                        heightMm: 0,
                        priceRetail: 0,
                        status: 'AVAILABLE',
                        manufactureYear: new Date().getFullYear()
                      });

                      alert('✅ Đã cập nhật xe thành công!');
                    } catch (error) {
                      console.error('❌ Lỗi khi cập nhật xe:', error);

                      // Hiển thị thông báo lỗi chi tiết hơn
                      if (error instanceof Error) {
                        if (error.message.includes('must be greater than 0')) {
                          alert('❌ Lỗi: Tất cả các trường số phải lớn hơn 0. Vui lòng kiểm tra lại thông tin nhập vào.');
                        } else if (error.message.includes('400')) {
                          alert('❌ Lỗi: Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin nhập vào.');
                        } else {
                          alert(`❌ Lỗi: ${error.message}`);
                        }
                      } else {
                        alert('❌ Có lỗi xảy ra khi cập nhật xe. Vui lòng thử lại.');
                      }
                    } finally {
                      setIsUpdatingVehicle(false);
                    }
                  }}
                  disabled={isUpdatingVehicle}
                >
                  {isUpdatingVehicle ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Đang cập nhật...
                    </>
                  ) : (
                    'Lưu thay đổi'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Car Details Modal */}
        {showViewCarModal && selectedCar && (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true">
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h4 className={styles.modalTitle}>
                  <i className="fas fa-eye"></i>
                  Chi tiết xe - {selectedCar.modelName} {selectedCar.version}
                </h4>
                <button
                  className={styles.closeButton}
                  aria-label="Đóng"
                  onClick={() => {
                    setShowViewCarModal(false);
                    setSelectedCar(null);
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formColumn}>
                    <div className={styles.settingItem}>
                      <label>Model name</label>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={selectedCar.modelName}
                        readOnly
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Color</label>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={selectedCar.color}
                        readOnly
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Range (km)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={selectedCar.rangeKm || ''}
                        readOnly
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Charge time (h)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={selectedCar.chargingTimeHours || ''}
                        readOnly
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Motor (kW)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={selectedCar.motorPowerKw || ''}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className={styles.formColumn}>
                    <div className={styles.settingItem}>
                      <label>Version</label>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={selectedCar.version}
                        readOnly
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Battery kWh</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={selectedCar.batteryCapacityKwh || ''}
                        readOnly
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Max speed (km/h)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={selectedCar.maxSpeedKmh || ''}
                        readOnly
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Seats</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={selectedCar.seatingCapacity || ''}
                        readOnly
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Weight (kg)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={selectedCar.weightKg || ''}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className={styles.formColumn}>
                    <div className={styles.settingItem}>
                      <label>Length (mm)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={selectedCar.lengthMm || ''}
                        readOnly
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Width (mm)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={selectedCar.widthMm || ''}
                        readOnly
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Height (mm)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={selectedCar.heightMm || ''}
                        readOnly
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Year</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={selectedCar.manufactureYear || ''}
                        readOnly
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Price (VND)</label>
                      <input
                      type="text"
                      className={styles.settingInput}
                      value={formatPriceInput(selectedCar.priceRetail)}
                        readOnly
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Status</label>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={selectedCar.status}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowViewCarModal(false);
                    setSelectedCar(null);
                  }}
                >
                  Đóng
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={() => {
                    // Chuyển từ modal xem sang modal chỉnh sửa
                    setShowViewCarModal(false);
                    setEditingCar(selectedCar);

                    // Populate edit form with current vehicle data
                    setEditCar({
                      modelName: selectedCar.modelName,
                      version: selectedCar.version,
                      color: selectedCar.color,
                      batteryCapacityKwh: selectedCar.batteryCapacityKwh,
                      rangeKm: selectedCar.rangeKm,
                      maxSpeedKmh: selectedCar.maxSpeedKmh,
                      chargingTimeHours: selectedCar.chargingTimeHours,
                      seatingCapacity: selectedCar.seatingCapacity,
                      motorPowerKw: selectedCar.motorPowerKw,
                      weightKg: selectedCar.weightKg,
                      lengthMm: selectedCar.lengthMm,
                      widthMm: selectedCar.widthMm,
                      heightMm: selectedCar.heightMm,
                      priceRetail: selectedCar.priceRetail,
                      status: selectedCar.status as 'AVAILABLE' | 'DISCONTINUED',
                      manufactureYear: (selectedCar as any).manufactureYear || new Date().getFullYear()
                    });

                    setShowEditCarModal(true);
                    setSelectedCar(null);
                  }}
                >
                  <i className="fas fa-edit"></i>
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;