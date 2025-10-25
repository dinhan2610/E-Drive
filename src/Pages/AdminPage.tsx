import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CAR_DATA } from '../constants/CarDatas';
import type { CarType } from '../constants/CarDatas';
import { fetchVehiclesFromApi, createVehicle, getVehicleById, updateVehicle, deleteVehicle } from '../services/vehicleApi';
import { fetchDealers, createDealer, getDealerById, updateDealer, deleteDealer, type Dealer } from '../services/dealerApi';
import styles from '../styles/AdminStyles/AdminPage.module.scss';
import sidebarStyles from '../styles/AdminStyles/AdminSidebar.module.scss';
import AdminLayout from '../components/AdminLayout';

// Add animation styles
const animationStyles = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = animationStyles;
  document.head.appendChild(styleSheet);
}

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

// Validation helper function
const validateCarField = (fieldName: string, value: any): string => {
  // Kiểm tra các field text
  if (fieldName === 'modelName' && !value.trim()) {
    return 'Vui lòng nhập tên model xe';
  }
  if (fieldName === 'version' && !value.trim()) {
    return 'Vui lòng nhập version xe';
  }
  if (fieldName === 'color' && !value.trim()) {
    return 'Vui lòng nhập màu xe';
  }

  // Kiểm tra các field số
  const numValue = typeof value === 'string' ? parseInt(value) : value;
  if (isNaN(numValue) || numValue <= 0) {
    const fieldLabels: Record<string, string> = {
      batteryCapacityKwh: 'Dung lượng pin',
      rangeKm: 'Tầm hoạt động',
      maxSpeedKmh: 'Tốc độ tối đa',
      chargingTimeHours: 'Thời gian sạc',
      seatingCapacity: 'Số ghế',
      motorPowerKw: 'Công suất động cơ',
      weightKg: 'Trọng lượng',
      lengthMm: 'Chiều dài',
      widthMm: 'Chiều rộng',
      heightMm: 'Chiều cao',
      priceRetail: 'Giá bán'
    };
    if (fieldLabels[fieldName]) {
      return `${fieldLabels[fieldName]} phải lớn hơn 0`;
    }
  }

  // Kiểm tra giới hạn tối đa
  if (fieldName === 'chargingTimeHours' && numValue > 72) {
    return 'Thời gian sạc tối đa 72 giờ';
  }
  if (fieldName === 'seatingCapacity') {
    if (numValue !== 4 && numValue !== 7) {
      return 'Chỉ chấp nhận xe 4 chỗ hoặc 7 chỗ';
    }
  }
  if (fieldName === 'maxSpeedKmh' && numValue > 500) {
    return 'Tốc độ tối đa 500 km/h';
  }
  if (fieldName === 'batteryCapacityKwh' && numValue > 300) {
    return 'Dung lượng pin tối đa 300 kWh';
  }

  // Kiểm tra năm sản xuất
  if (fieldName === 'manufactureYear') {
    const currentYear = new Date().getFullYear();
    if (numValue < 2000 || numValue > currentYear + 1) {
      return `Năm sản xuất phải từ 2000 đến ${currentYear + 1}`;
    }
  }

  return ''; // No error
};

// Validation helper function for dealer
const validateDealerField = (fieldName: string, value: string): string => {
  if (!value || !value.trim()) {
    const fieldLabels: Record<string, string> = {
      dealerName: 'Tên đại lý',
      houseNumberAndStreet: 'Số nhà và tên đường',
      wardOrCommune: 'Phường/Xã',
      district: 'Quận/Huyện',
      provinceOrCity: 'Tỉnh/Thành phố',
      contactPerson: 'Người liên hệ',
      phone: 'Số điện thoại',
      fullAddress: 'Địa chỉ đầy đủ'
    };
    if (fieldLabels[fieldName]) {
      return `Vui lòng nhập ${fieldLabels[fieldName]}`;
    }
  }

  // Validate phone number format
  if (fieldName === 'phone') {
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(value.trim())) {
      return 'Số điện thoại phải có 10-11 chữ số';
    }
  }

  return ''; // No error
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
  const location = useLocation();
  const initialTab = (location.state as any)?.tab || 'dashboard';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cars' | 'dealers' | 'bookings' | 'analytics' | 'settings'>(initialTab);
  const [cars, setCars] = useState<CarWithStatus[]>([]);

  // Helper function để set token từ console
  // Usage: window.setAdminToken('your-token-here')
  useEffect(() => {
    (window as any).setAdminToken = (token: string) => {
      localStorage.setItem('token', token);
      console.log('✅ Token đã được set! Reload trang để áp dụng.');
    };
    
    (window as any).getToken = () => {
      const token = localStorage.getItem('token');
      console.log('Current token:', token);
      return token;
    };
    
    console.log('💡 Helper functions available:');
    console.log('  - window.setAdminToken("your-token") - Set token mới');
    console.log('  - window.getToken() - Xem token hiện tại');
    
    return () => {
      delete (window as any).setAdminToken;
      delete (window as any).getToken;
    };
  }, []);

  // TODO: Enable auth check later
  // Check authentication on mount
  // useEffect(() => {
  //   const token = localStorage.getItem('token');
  //   const role = localStorage.getItem('role');
  //   
  //   if (!token || !role) {
  //     alert('Bạn cần đăng nhập để truy cập trang Admin!');
  //     navigate('/');
  //     return;
  //   }
  //
  //   // Optional: Check if user has admin role
  //   if (role.toLowerCase() !== 'admin' && role.toLowerCase() !== 'administrator') {
  //     alert('Bạn không có quyền truy cập trang này!');
  //     navigate('/');
  //     return;
  //   }
  // }, [navigate]);

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
  const [newCarErrors, setNewCarErrors] = useState<Record<string, string>>({});
  const [editCarErrors, setEditCarErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [showAddDealerModal, setShowAddDealerModal] = useState<boolean>(false);
  const [showViewDealerModal, setShowViewDealerModal] = useState<boolean>(false);
  const [showEditDealerModal, setShowEditDealerModal] = useState<boolean>(false);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [isCreatingDealer, setIsCreatingDealer] = useState<boolean>(false);
  const [isUpdatingDealer, setIsUpdatingDealer] = useState<boolean>(false);
  const [newDealer, setNewDealer] = useState({
    dealerName: '',
    houseNumberAndStreet: '',
    wardOrCommune: '',
    district: '',
    provinceOrCity: '',
    contactPerson: '',
    phone: '',
    fullAddress: ''
  });
  const [editDealer, setEditDealer] = useState({
    dealerName: '',
    houseNumberAndStreet: '',
    wardOrCommune: '',
    district: '',
    provinceOrCity: '',
    contactPerson: '',
    phone: '',
    fullAddress: ''
  });
  const [newDealerErrors, setNewDealerErrors] = useState<Record<string, string>>({});
  const [editDealerErrors, setEditDealerErrors] = useState<Record<string, string>>({});
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

  // Auto hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    // Fetch vehicles from API for Cars management tab
    (async () => {
      try {
        const { vehicles } = await fetchVehiclesFromApi({ page: 0, size: 20 });
        const apiCars: CarWithStatus[] = vehicles.map((v) => ({
          // Map API fields to UI fields
          id: v.vehicleId,
          name: `${v.modelName} ${v.version}`,
          img: `/src/images/cars-big/car-${v.vehicleId}.jpg`,
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

    // Fetch dealers from API
    (async () => {
      try {
        const dealerList = await fetchDealers();
        setDealers(dealerList);
        console.log('✅ Loaded dealers:', dealerList);
      } catch (error) {
        console.error('❌ Failed to load dealers:', error);
        setDealers([]);
      }
    })();

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
      totalCars: cars.length || 0,
      totalUsers: dealers.length,
      totalRevenue: 125000000,
      monthlyBookings: 45,
      activeBookings: mockBookings.filter(b => b.status === 'ongoing').length,
      totalBookings: mockBookings.length,
      avgRating: 4.6,
      pendingMaintenance: 0
    });
  }, []); // Empty dependency array - only run once on mount

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

      setEditCarErrors({});
      setShowEditCarModal(true);
    } catch (error) {
      console.error('❌ Error fetching car details for edit:', error);
      alert('❌ Không thể tải thông tin xe để chỉnh sửa. Vui lòng thử lại.');
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Dealer Handlers
  const handleCreateDealer = async () => {
    try {
      setIsCreatingDealer(true);
      
      // Validate all fields
      const errors: Record<string, string> = {};
      errors.dealerName = validateDealerField('dealerName', newDealer.dealerName);
      errors.houseNumberAndStreet = validateDealerField('houseNumberAndStreet', newDealer.houseNumberAndStreet);
      errors.wardOrCommune = validateDealerField('wardOrCommune', newDealer.wardOrCommune);
      errors.district = validateDealerField('district', newDealer.district);
      errors.provinceOrCity = validateDealerField('provinceOrCity', newDealer.provinceOrCity);
      errors.contactPerson = validateDealerField('contactPerson', newDealer.contactPerson);
      errors.phone = validateDealerField('phone', newDealer.phone);
      errors.fullAddress = validateDealerField('fullAddress', newDealer.fullAddress);

      // Remove empty errors
      const finalErrors = Object.fromEntries(
        Object.entries(errors).filter(([_, v]) => v !== '')
      );

      if (Object.keys(finalErrors).length > 0) {
        setNewDealerErrors(finalErrors);
        setIsCreatingDealer(false);
        return;
      }

      // Clear errors
      setNewDealerErrors({});

      // Create dealer via API
      const createdDealer = await createDealer(newDealer);
      console.log('✅ Dealer created successfully:', createdDealer);

      // Update dealers list
      setDealers(prev => [...prev, createdDealer]);

      // Show success message
      setSuccessMessage('✅ Đã thêm đại lý thành công!');
      setTimeout(() => setSuccessMessage(''), 3000);

      // Reset form and close modal
      setNewDealer({
        dealerName: '',
        houseNumberAndStreet: '',
        wardOrCommune: '',
        district: '',
        provinceOrCity: '',
        contactPerson: '',
        phone: '',
        fullAddress: ''
      });
      setShowAddDealerModal(false);

    } catch (error) {
      console.error('❌ Error creating dealer:', error);
      
      // Parse API error and map to fields
      if (error instanceof Error) {
        const errorMessage = error.message;
        const fieldErrors: Record<string, string> = {};
        
        // Try to parse field-specific errors from API
        if (errorMessage.includes(':')) {
          const parts = errorMessage.split(',');
          parts.forEach(part => {
            const match = part.match(/(\w+):\s*(.+)/);
            if (match) {
              const [_, field, message] = match;
              fieldErrors[field] = message.trim();
            }
          });
        }
        
        if (Object.keys(fieldErrors).length > 0) {
          setNewDealerErrors(fieldErrors);
        } else {
          setNewDealerErrors({ general: errorMessage });
        }
      }
    } finally {
      setIsCreatingDealer(false);
    }
  };

  const handleViewDealer = async (dealerId: number) => {
    try {
      console.log('🔍 Viewing dealer with ID:', dealerId);
      const dealerData = await getDealerById(dealerId);
      setSelectedDealer(dealerData);
      setShowViewDealerModal(true);
    } catch (error) {
      console.error('❌ Error fetching dealer details:', error);
      alert('❌ Không thể tải thông tin đại lý. Vui lòng thử lại.');
    }
  };

  const handleEditDealer = async (dealerId: number) => {
    try {
      console.log('✏️ Editing dealer with ID:', dealerId);
      const dealerData = await getDealerById(dealerId);
      setEditingDealer(dealerData);
      
      // Populate edit form
      setEditDealer({
        dealerName: dealerData.dealerName,
        houseNumberAndStreet: dealerData.houseNumberAndStreet,
        wardOrCommune: dealerData.wardOrCommune,
        district: dealerData.district,
        provinceOrCity: dealerData.provinceOrCity,
        contactPerson: dealerData.contactPerson,
        phone: dealerData.phone,
        fullAddress: dealerData.fullAddress
      });
      
      setEditDealerErrors({});
      setShowEditDealerModal(true);
    } catch (error) {
      console.error('❌ Error fetching dealer details for edit:', error);
      alert('❌ Không thể tải thông tin đại lý để chỉnh sửa. Vui lòng thử lại.');
    }
  };

  const handleUpdateDealer = async () => {
    if (!editingDealer) return;
    
    try {
      setIsUpdatingDealer(true);
      
      // Validate all fields
      const errors: Record<string, string> = {};
      errors.dealerName = validateDealerField('dealerName', editDealer.dealerName);
      errors.houseNumberAndStreet = validateDealerField('houseNumberAndStreet', editDealer.houseNumberAndStreet);
      errors.wardOrCommune = validateDealerField('wardOrCommune', editDealer.wardOrCommune);
      errors.district = validateDealerField('district', editDealer.district);
      errors.provinceOrCity = validateDealerField('provinceOrCity', editDealer.provinceOrCity);
      errors.contactPerson = validateDealerField('contactPerson', editDealer.contactPerson);
      errors.phone = validateDealerField('phone', editDealer.phone);
      errors.fullAddress = validateDealerField('fullAddress', editDealer.fullAddress);

      // Remove empty errors
      const finalErrors = Object.fromEntries(
        Object.entries(errors).filter(([_, v]) => v !== '')
      );

      if (Object.keys(finalErrors).length > 0) {
        setEditDealerErrors(finalErrors);
        setIsUpdatingDealer(false);
        return;
      }

      // Clear errors
      setEditDealerErrors({});

      // Update dealer via API
      const updatedDealer = await updateDealer(editingDealer.dealerId, editDealer);
      console.log('✅ Dealer updated successfully:', updatedDealer);

      // Update dealers list
      setDealers(prev => prev.map(d => 
        d.dealerId === editingDealer.dealerId ? updatedDealer : d
      ));

      // Show success message
      setSuccessMessage('✅ Đã cập nhật đại lý thành công!');
      setTimeout(() => setSuccessMessage(''), 3000);

      // Close modal
      setShowEditDealerModal(false);
      setEditingDealer(null);

    } catch (error) {
      console.error('❌ Error updating dealer:', error);
      
      // Parse API error and map to fields
      if (error instanceof Error) {
        const errorMessage = error.message;
        const fieldErrors: Record<string, string> = {};
        
        // Try to parse field-specific errors from API
        if (errorMessage.includes(':')) {
          const parts = errorMessage.split(',');
          parts.forEach(part => {
            const match = part.match(/(\w+):\s*(.+)/);
            if (match) {
              const [_, field, message] = match;
              fieldErrors[field] = message.trim();
            }
          });
        }
        
        if (Object.keys(fieldErrors).length > 0) {
          setEditDealerErrors(fieldErrors);
        } else {
          setEditDealerErrors({ general: errorMessage });
        }
      }
    } finally {
      setIsUpdatingDealer(false);
    }
  };

  const handleDeleteDealer = async (dealerId: number, dealerName: string) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa đại lý "${dealerName}"?\n\nHành động này không thể hoàn tác!`
    );
    
    if (!confirmDelete) return;

    try {
      console.log('🗑️ Deleting dealer with ID:', dealerId);
      await deleteDealer(dealerId);
      
      // Remove from dealers list
      setDealers(prev => prev.filter(d => d.dealerId !== dealerId));
      
      // Show success message
      setSuccessMessage('✅ Đã xóa đại lý thành công!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      console.log('✅ Dealer deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting dealer:', error);
      alert(`❌ Không thể xóa đại lý "${dealerName}". ${error instanceof Error ? error.message : 'Vui lòng thử lại.'}`);
    }
  };

  return (
    <AdminLayout 
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as typeof activeTab)}
      counters={{
        cars: cars.length,
        dealers: dealers.length,
        bookings: bookings.length,
        testDrives: 0
      }}
    >
      {/* Success Message Notification */}
      {successMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '16px',
          fontWeight: '500',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <i className="fas fa-check-circle" style={{ fontSize: '20px' }}></i>
          {successMessage}
        </div>
      )}

      {/* Dashboard Content */}
      {activeTab === 'dashboard' && (
        <div className={sidebarStyles.statsGrid}>
          <div className={sidebarStyles.statCard}>
            <div className={sidebarStyles.statHeader}>
              <div className={sidebarStyles.statInfo}>
                <div className={sidebarStyles.statLabel}>Tổng số xe</div>
                <h2 className={sidebarStyles.statValue}>{stats.totalCars}</h2>
              </div>
              <div className={`${sidebarStyles.statIcon} ${sidebarStyles.primary}`}>
                <i className="fas fa-car"></i>
              </div>
            </div>
            <div className={sidebarStyles.statFooter}>
              <span className={`${sidebarStyles.trend} ${sidebarStyles.up}`}>
                <i className="fas fa-arrow-up"></i> 12%
              </span>
              <span className={sidebarStyles.trendText}>so với tháng trước</span>
            </div>
          </div>

          <div className={sidebarStyles.statCard}>
            <div className={sidebarStyles.statHeader}>
              <div className={sidebarStyles.statInfo}>
                <div className={sidebarStyles.statLabel}>Người dùng</div>
                <h2 className={sidebarStyles.statValue}>{stats.totalUsers}</h2>
              </div>
              <div className={`${sidebarStyles.statIcon} ${sidebarStyles.success}`}>
                <i className="fas fa-users"></i>
              </div>
            </div>
            <div className={sidebarStyles.statFooter}>
              <span className={`${sidebarStyles.trend} ${sidebarStyles.up}`}>
                <i className="fas fa-arrow-up"></i> 15%
              </span>
              <span className={sidebarStyles.trendText}>so với tháng trước</span>
            </div>
          </div>

          <div className={sidebarStyles.statCard}>
            <div className={sidebarStyles.statHeader}>
              <div className={sidebarStyles.statInfo}>
                <div className={sidebarStyles.statLabel}>Doanh thu</div>
                <h2 className={sidebarStyles.statValue}>{formatCurrency(stats.totalRevenue)}</h2>
              </div>
              <div className={`${sidebarStyles.statIcon} ${sidebarStyles.warning}`}>
                <i className="fas fa-dollar-sign"></i>
              </div>
            </div>
            <div className={sidebarStyles.statFooter}>
              <span className={`${sidebarStyles.trend} ${sidebarStyles.up}`}>
                <i className="fas fa-arrow-up"></i> 8%
              </span>
              <span className={sidebarStyles.trendText}>so với tháng trước</span>
            </div>
          </div>

          <div className={sidebarStyles.statCard}>
            <div className={sidebarStyles.statHeader}>
              <div className={sidebarStyles.statInfo}>
                <div className={sidebarStyles.statLabel}>Đặt xe</div>
                <h2 className={sidebarStyles.statValue}>{stats.monthlyBookings}</h2>
              </div>
              <div className={`${sidebarStyles.statIcon} ${sidebarStyles.info}`}>
                <i className="fas fa-calendar-alt"></i>
              </div>
            </div>
            <div className={sidebarStyles.statFooter}>
              <span className={`${sidebarStyles.trend} ${sidebarStyles.up}`}>
                <i className="fas fa-arrow-up"></i> 23%
              </span>
              <span className={sidebarStyles.trendText}>so với tháng trước</span>
            </div>
          </div>
        </div>
      )}

      {/* Other content areas */}
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
              <button className={styles.addButton} onClick={() => {
                setShowAddCarModal(true);
                setNewCarErrors({});
              }}>
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

        {activeTab === 'dealers' && (
          <div className={styles.usersManagement}>
            <div className={styles.sectionHeader}>
              <h3>Quản lý đại lý</h3>
              <button 
                className={styles.addButton}
                onClick={() => setShowAddDealerModal(true)}
              >
                <i className="fas fa-plus"></i>
                Thêm đại lý
              </button>
            </div>

            <div className={styles.usersTable}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên đại lý</th>
                    <th>Địa chỉ</th>
                    <th>Quận/Huyện</th>
                    <th>Tỉnh/Thành phố</th>
                    <th>Người liên hệ</th>
                    <th>SĐT</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {dealers.map(dealer => (
                    <tr key={dealer.dealerId}>
                      <td>#{dealer.dealerId}</td>
                      <td>
                        <div style={{fontWeight: 'bold'}}>{dealer.dealerName}</div>
                      </td>
                      <td>
                        <div style={{fontSize: '13px'}}>{dealer.houseNumberAndStreet}</div>
                        <div style={{fontSize: '11px', color: '#888'}}>{dealer.wardOrCommune}</div>
                      </td>
                      <td>{dealer.district}</td>
                      <td>{dealer.provinceOrCity}</td>
                      <td>{dealer.contactPerson}</td>
                      <td>{dealer.phone}</td>
                      <td>
                        <div className={styles.tableActions}>
                          <button 
                            className={styles.viewButton} 
                            title="Xem chi tiết"
                            onClick={() => handleViewDealer(dealer.dealerId)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className={styles.editButton} 
                            title="Chỉnh sửa"
                            onClick={() => handleEditDealer(dealer.dealerId)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className={styles.deleteButton}
                            title="Xóa"
                            onClick={() => handleDeleteDealer(dealer.dealerId, dealer.dealerName)}
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
                  onClick={() => {
                    setShowAddCarModal(false);
                    setNewCarErrors({});
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
                        value={newCar.modelName}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewCar({ ...newCar, modelName: value });
                          const error = validateCarField('modelName', value);
                          setNewCarErrors(prev => ({ ...prev, modelName: error }));
                        }}
                        style={newCarErrors.modelName ? { borderColor: 'red' } : {}}
                      />
                      {newCarErrors.modelName && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {newCarErrors.modelName}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Color</label>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={newCar.color}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewCar({ ...newCar, color: value });
                          const error = validateCarField('color', value);
                          setNewCarErrors(prev => ({ ...prev, color: error }));
                        }}
                        style={newCarErrors.color ? { borderColor: 'red' } : {}}
                      />
                      {newCarErrors.color && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {newCarErrors.color}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Range (km)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.rangeKm || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setNewCar({ ...newCar, rangeKm: value });
                          const error = validateCarField('rangeKm', value);
                          setNewCarErrors(prev => ({ ...prev, rangeKm: error }));
                        }}
                        style={newCarErrors.rangeKm ? { borderColor: 'red' } : {}}
                      />
                      {newCarErrors.rangeKm && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {newCarErrors.rangeKm}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Charge time (h) <span style={{color: '#888', fontSize: '0.85em'}}>(max 72)</span></label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.chargingTimeHours || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setNewCar({ ...newCar, chargingTimeHours: value });
                          const error = validateCarField('chargingTimeHours', value);
                          setNewCarErrors(prev => ({ ...prev, chargingTimeHours: error }));
                        }}
                        max="72"
                        placeholder="Tối đa 72 giờ"
                        style={newCarErrors.chargingTimeHours ? { borderColor: 'red' } : {}}
                      />
                      {newCarErrors.chargingTimeHours && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {newCarErrors.chargingTimeHours}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Motor (kW)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.motorPowerKw || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setNewCar({ ...newCar, motorPowerKw: value });
                          const error = validateCarField('motorPowerKw', value);
                          setNewCarErrors(prev => ({ ...prev, motorPowerKw: error }));
                        }}
                        style={newCarErrors.motorPowerKw ? { borderColor: 'red' } : {}}
                      />
                      {newCarErrors.motorPowerKw && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {newCarErrors.motorPowerKw}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.formColumn}>
                    <div className={styles.settingItem}>
                      <label>Version</label>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={newCar.version}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewCar({ ...newCar, version: value });
                          const error = validateCarField('version', value);
                          setNewCarErrors(prev => ({ ...prev, version: error }));
                        }}
                        style={newCarErrors.version ? { borderColor: 'red' } : {}}
                      />
                      {newCarErrors.version && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {newCarErrors.version}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Battery kWh <span style={{color: '#888', fontSize: '0.85em'}}>(max 300)</span></label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.batteryCapacityKwh || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setNewCar({ ...newCar, batteryCapacityKwh: value });
                          const error = validateCarField('batteryCapacityKwh', value);
                          setNewCarErrors(prev => ({ ...prev, batteryCapacityKwh: error }));
                        }}
                        max="300"
                        placeholder="Tối đa 300 kWh"
                        style={newCarErrors.batteryCapacityKwh ? { borderColor: 'red' } : {}}
                      />
                      {newCarErrors.batteryCapacityKwh && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {newCarErrors.batteryCapacityKwh}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Max speed (km/h) <span style={{color: '#888', fontSize: '0.85em'}}>(max 500)</span></label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.maxSpeedKmh || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setNewCar({ ...newCar, maxSpeedKmh: value });
                          const error = validateCarField('maxSpeedKmh', value);
                          setNewCarErrors(prev => ({ ...prev, maxSpeedKmh: error }));
                        }}
                        max="500"
                        placeholder="Tối đa 500 km/h"
                        style={newCarErrors.maxSpeedKmh ? { borderColor: 'red' } : {}}
                      />
                      {newCarErrors.maxSpeedKmh && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {newCarErrors.maxSpeedKmh}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Seats <span style={{color: '#888', fontSize: '0.85em'}}>(4 hoặc 7 chỗ)</span></label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.seatingCapacity || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setNewCar({ ...newCar, seatingCapacity: value });
                          const error = validateCarField('seatingCapacity', value);
                          setNewCarErrors(prev => ({ ...prev, seatingCapacity: error }));
                        }}
                        placeholder="Chỉ nhập 4 hoặc 7"
                        style={newCarErrors.seatingCapacity ? { borderColor: 'red' } : {}}
                      />
                      {newCarErrors.seatingCapacity && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {newCarErrors.seatingCapacity}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Weight (kg)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.weightKg || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setNewCar({ ...newCar, weightKg: value });
                          const error = validateCarField('weightKg', value);
                          setNewCarErrors(prev => ({ ...prev, weightKg: error }));
                        }}
                        style={newCarErrors.weightKg ? { borderColor: 'red' } : {}}
                      />
                      {newCarErrors.weightKg && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {newCarErrors.weightKg}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.formColumn}>
                    <div className={styles.settingItem}>
                      <label>Length (mm)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.lengthMm || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setNewCar({ ...newCar, lengthMm: value });
                          const error = validateCarField('lengthMm', value);
                          setNewCarErrors(prev => ({ ...prev, lengthMm: error }));
                        }}
                        style={newCarErrors.lengthMm ? { borderColor: 'red' } : {}}
                      />
                      {newCarErrors.lengthMm && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {newCarErrors.lengthMm}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Width (mm)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.widthMm || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setNewCar({ ...newCar, widthMm: value });
                          const error = validateCarField('widthMm', value);
                          setNewCarErrors(prev => ({ ...prev, widthMm: error }));
                        }}
                        style={newCarErrors.widthMm ? { borderColor: 'red' } : {}}
                      />
                      {newCarErrors.widthMm && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {newCarErrors.widthMm}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Height (mm)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.heightMm || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setNewCar({ ...newCar, heightMm: value });
                          const error = validateCarField('heightMm', value);
                          setNewCarErrors(prev => ({ ...prev, heightMm: error }));
                        }}
                        style={newCarErrors.heightMm ? { borderColor: 'red' } : {}}
                      />
                      {newCarErrors.heightMm && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {newCarErrors.heightMm}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Year</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={newCar.manufactureYear || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setNewCar({ ...newCar, manufactureYear: value });
                          const error = validateCarField('manufactureYear', value);
                          setNewCarErrors(prev => ({ ...prev, manufactureYear: error }));
                        }}
                        style={newCarErrors.manufactureYear ? { borderColor: 'red' } : {}}
                      />
                      {newCarErrors.manufactureYear && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {newCarErrors.manufactureYear}
                        </span>
                      )}
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
                          const error = validateCarField('priceRetail', numericValue);
                          setNewCarErrors(prev => ({ ...prev, priceRetail: error }));
                        }}
                        style={newCarErrors.priceRetail ? { borderColor: 'red' } : {}}
                      />
                      {newCarErrors.priceRetail && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {newCarErrors.priceRetail}
                        </span>
                      )}
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
                  onClick={() => {
                    setShowAddCarModal(false);
                    setNewCarErrors({});
                  }}
                >
                  Hủy
                </button>
                <button
                  className={`${styles.primaryButton} ${isCreatingVehicle ? styles.loading : ''}`}
                  onClick={async () => {
                    if (isCreatingVehicle) return; // Prevent multiple clicks

                    try {
                      setIsCreatingVehicle(true);

                      // Validate tất cả các fields và collect errors
                      const errors: Record<string, string> = {};
                      
                      // Validate text fields
                      errors.modelName = validateCarField('modelName', newCar.modelName);
                      errors.version = validateCarField('version', newCar.version);
                      errors.color = validateCarField('color', newCar.color);
                      
                      // Validate numeric fields
                      errors.batteryCapacityKwh = validateCarField('batteryCapacityKwh', newCar.batteryCapacityKwh);
                      errors.rangeKm = validateCarField('rangeKm', newCar.rangeKm);
                      errors.maxSpeedKmh = validateCarField('maxSpeedKmh', newCar.maxSpeedKmh);
                      errors.chargingTimeHours = validateCarField('chargingTimeHours', newCar.chargingTimeHours);
                      errors.seatingCapacity = validateCarField('seatingCapacity', newCar.seatingCapacity);
                      errors.motorPowerKw = validateCarField('motorPowerKw', newCar.motorPowerKw);
                      errors.weightKg = validateCarField('weightKg', newCar.weightKg);
                      errors.lengthMm = validateCarField('lengthMm', newCar.lengthMm);
                      errors.widthMm = validateCarField('widthMm', newCar.widthMm);
                      errors.heightMm = validateCarField('heightMm', newCar.heightMm);
                      errors.priceRetail = validateCarField('priceRetail', newCar.priceRetail);
                      errors.manufactureYear = validateCarField('manufactureYear', newCar.manufactureYear);

                      // Loại bỏ các field không có lỗi
                      const finalErrors = Object.fromEntries(
                        Object.entries(errors).filter(([_, value]) => value !== '')
                      );

                      // Nếu có lỗi, hiển thị và dừng lại
                      if (Object.keys(finalErrors).length > 0) {
                        setNewCarErrors(finalErrors);
                        setIsCreatingVehicle(false);
                        return;
                      }

                      // Clear errors nếu không có lỗi
                      setNewCarErrors({});

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
                        img: '/src/images/cars-big/carforbox.jpg',
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
                      setNewCarErrors({});

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

                      // Success - hiển thị success message
                      setSuccessMessage('✅ Đã thêm xe mới thành công!');
                      console.log('✅ Đã thêm xe mới thành công!');
                    } catch (error) {
                      console.error('❌ Lỗi khi thêm xe:', error);

                      if (error instanceof Error) {
                        console.error('❌ Error message:', error.message);
                        
                        // Parse lỗi từ API response và hiển thị dưới từng ô
                        const apiErrors: Record<string, string> = {};
                        
                        // Parse error message từ API (ví dụ: "widthMm: Chiều rộng tối thiểu 300 mm")
                        if (error.message.includes('widthMm')) {
                          const match = error.message.match(/widthMm:\s*([^;]+)/);
                          if (match) apiErrors.widthMm = match[1].trim();
                        }
                        if (error.message.includes('lengthMm')) {
                          const match = error.message.match(/lengthMm:\s*([^;]+)/);
                          if (match) apiErrors.lengthMm = match[1].trim();
                        }
                        if (error.message.includes('heightMm')) {
                          const match = error.message.match(/heightMm:\s*([^;]+)/);
                          if (match) apiErrors.heightMm = match[1].trim();
                        }
                        if (error.message.includes('batteryCapacityKwh')) {
                          const match = error.message.match(/batteryCapacityKwh:\s*([^;]+)/);
                          if (match) apiErrors.batteryCapacityKwh = match[1].trim();
                        }
                        if (error.message.includes('chargingTimeHours')) {
                          const match = error.message.match(/chargingTimeHours:\s*([^;]+)/);
                          if (match) apiErrors.chargingTimeHours = match[1].trim();
                        }
                        if (error.message.includes('seatingCapacity')) {
                          const match = error.message.match(/seatingCapacity:\s*([^;]+)/);
                          if (match) apiErrors.seatingCapacity = match[1].trim();
                        }
                        if (error.message.includes('maxSpeedKmh')) {
                          const match = error.message.match(/maxSpeedKmh:\s*([^;]+)/);
                          if (match) apiErrors.maxSpeedKmh = match[1].trim();
                        }
                        
                        // Hiển thị errors dưới các ô tương ứng
                        if (Object.keys(apiErrors).length > 0) {
                          setNewCarErrors(apiErrors);
                        }
                      }
                      
                      // Không hiển thị popup alert, chỉ log ra console
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
                    setEditCarErrors({});
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
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditCar({ ...editCar, modelName: value });
                          const error = validateCarField('modelName', value);
                          setEditCarErrors(prev => ({ ...prev, modelName: error }));
                        }}
                        style={editCarErrors.modelName ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.modelName && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.modelName}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Color</label>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={editCar.color}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditCar({ ...editCar, color: value });
                          const error = validateCarField('color', value);
                          setEditCarErrors(prev => ({ ...prev, color: error }));
                        }}
                        style={editCarErrors.color ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.color && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.color}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Range (km)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.rangeKm || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setEditCar({ ...editCar, rangeKm: value });
                          const error = validateCarField('rangeKm', value);
                          setEditCarErrors(prev => ({ ...prev, rangeKm: error }));
                        }}
                        style={editCarErrors.rangeKm ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.rangeKm && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.rangeKm}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Charge time (h) <span style={{color: '#888', fontSize: '0.85em'}}>(max 72)</span></label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.chargingTimeHours || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setEditCar({ ...editCar, chargingTimeHours: value });
                          const error = validateCarField('chargingTimeHours', value);
                          setEditCarErrors(prev => ({ ...prev, chargingTimeHours: error }));
                        }}
                        max="72"
                        placeholder="Tối đa 72 giờ"
                        style={editCarErrors.chargingTimeHours ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.chargingTimeHours && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.chargingTimeHours}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Motor (kW)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.motorPowerKw || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setEditCar({ ...editCar, motorPowerKw: value });
                          const error = validateCarField('motorPowerKw', value);
                          setEditCarErrors(prev => ({ ...prev, motorPowerKw: error }));
                        }}
                        style={editCarErrors.motorPowerKw ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.motorPowerKw && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.motorPowerKw}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.formColumn}>
                    <div className={styles.settingItem}>
                      <label>Version</label>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={editCar.version}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditCar({ ...editCar, version: value });
                          const error = validateCarField('version', value);
                          setEditCarErrors(prev => ({ ...prev, version: error }));
                        }}
                        style={editCarErrors.version ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.version && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.version}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Battery kWh <span style={{color: '#888', fontSize: '0.85em'}}>(max 300)</span></label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.batteryCapacityKwh || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setEditCar({ ...editCar, batteryCapacityKwh: value });
                          const error = validateCarField('batteryCapacityKwh', value);
                          setEditCarErrors(prev => ({ ...prev, batteryCapacityKwh: error }));
                        }}
                        max="300"
                        placeholder="Tối đa 300 kWh"
                        style={editCarErrors.batteryCapacityKwh ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.batteryCapacityKwh && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.batteryCapacityKwh}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Max speed (km/h) <span style={{color: '#888', fontSize: '0.85em'}}>(max 500)</span></label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.maxSpeedKmh || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setEditCar({ ...editCar, maxSpeedKmh: value });
                          const error = validateCarField('maxSpeedKmh', value);
                          setEditCarErrors(prev => ({ ...prev, maxSpeedKmh: error }));
                        }}
                        max="500"
                        placeholder="Tối đa 500 km/h"
                        style={editCarErrors.maxSpeedKmh ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.maxSpeedKmh && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.maxSpeedKmh}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Seats <span style={{color: '#888', fontSize: '0.85em'}}>(4 hoặc 7 chỗ)</span></label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.seatingCapacity || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setEditCar({ ...editCar, seatingCapacity: value });
                          const error = validateCarField('seatingCapacity', value);
                          setEditCarErrors(prev => ({ ...prev, seatingCapacity: error }));
                        }}
                        placeholder="Chỉ nhập 4 hoặc 7"
                        style={editCarErrors.seatingCapacity ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.seatingCapacity && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.seatingCapacity}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Weight (kg)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.weightKg || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setEditCar({ ...editCar, weightKg: value });
                          const error = validateCarField('weightKg', value);
                          setEditCarErrors(prev => ({ ...prev, weightKg: error }));
                        }}
                        style={editCarErrors.weightKg ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.weightKg && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.weightKg}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.formColumn}>
                    <div className={styles.settingItem}>
                      <label>Length (mm)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.lengthMm || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setEditCar({ ...editCar, lengthMm: value });
                          const error = validateCarField('lengthMm', value);
                          setEditCarErrors(prev => ({ ...prev, lengthMm: error }));
                        }}
                        style={editCarErrors.lengthMm ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.lengthMm && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.lengthMm}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Width (mm)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.widthMm || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setEditCar({ ...editCar, widthMm: value });
                          const error = validateCarField('widthMm', value);
                          setEditCarErrors(prev => ({ ...prev, widthMm: error }));
                        }}
                        style={editCarErrors.widthMm ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.widthMm && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.widthMm}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Height (mm)</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.heightMm || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setEditCar({ ...editCar, heightMm: value });
                          const error = validateCarField('heightMm', value);
                          setEditCarErrors(prev => ({ ...prev, heightMm: error }));
                        }}
                        style={editCarErrors.heightMm ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.heightMm && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.heightMm}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Year</label>
                      <input
                        type="number"
                        className={styles.settingInput}
                        value={editCar.manufactureYear || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setEditCar({ ...editCar, manufactureYear: value });
                          const error = validateCarField('manufactureYear', value);
                          setEditCarErrors(prev => ({ ...prev, manufactureYear: error }));
                        }}
                        style={editCarErrors.manufactureYear ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.manufactureYear && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.manufactureYear}
                        </span>
                      )}
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
                          const error = validateCarField('priceRetail', numericValue);
                          setEditCarErrors(prev => ({ ...prev, priceRetail: error }));
                        }}
                        style={editCarErrors.priceRetail ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.priceRetail && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.priceRetail}
                        </span>
                      )}
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
                    setEditCarErrors({});
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

                      // Validate tất cả các fields và collect errors
                      const errors: Record<string, string> = {};
                      
                      // Validate text fields
                      errors.modelName = validateCarField('modelName', editCar.modelName);
                      errors.version = validateCarField('version', editCar.version);
                      errors.color = validateCarField('color', editCar.color);
                      
                      // Validate numeric fields
                      errors.batteryCapacityKwh = validateCarField('batteryCapacityKwh', editCar.batteryCapacityKwh);
                      errors.rangeKm = validateCarField('rangeKm', editCar.rangeKm);
                      errors.maxSpeedKmh = validateCarField('maxSpeedKmh', editCar.maxSpeedKmh);
                      errors.chargingTimeHours = validateCarField('chargingTimeHours', editCar.chargingTimeHours);
                      errors.seatingCapacity = validateCarField('seatingCapacity', editCar.seatingCapacity);
                      errors.motorPowerKw = validateCarField('motorPowerKw', editCar.motorPowerKw);
                      errors.weightKg = validateCarField('weightKg', editCar.weightKg);
                      errors.lengthMm = validateCarField('lengthMm', editCar.lengthMm);
                      errors.widthMm = validateCarField('widthMm', editCar.widthMm);
                      errors.heightMm = validateCarField('heightMm', editCar.heightMm);
                      errors.priceRetail = validateCarField('priceRetail', editCar.priceRetail);
                      errors.manufactureYear = validateCarField('manufactureYear', editCar.manufactureYear);

                      // Loại bỏ các field không có lỗi
                      const finalErrors = Object.fromEntries(
                        Object.entries(errors).filter(([_, value]) => value !== '')
                      );

                      // Nếu có lỗi, hiển thị và dừng lại
                      if (Object.keys(finalErrors).length > 0) {
                        setEditCarErrors(finalErrors);
                        setIsUpdatingVehicle(false);
                          return;
                      }

                      // Clear errors nếu không có lỗi
                      setEditCarErrors({});

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
                      setEditCarErrors({});

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

                      // Success - hiển thị success message
                      setSuccessMessage('✅ Đã cập nhật xe thành công!');
                      console.log('✅ Đã cập nhật xe thành công!');
                    } catch (error) {
                      console.error('❌ Lỗi khi cập nhật xe:', error);

                      if (error instanceof Error) {
                        console.error('❌ Error message:', error.message);
                        
                        // Parse lỗi từ API response và hiển thị dưới từng ô
                        const apiErrors: Record<string, string> = {};
                        
                        // Parse error message từ API
                        if (error.message.includes('widthMm')) {
                          const match = error.message.match(/widthMm:\s*([^;]+)/);
                          if (match) apiErrors.widthMm = match[1].trim();
                        }
                        if (error.message.includes('lengthMm')) {
                          const match = error.message.match(/lengthMm:\s*([^;]+)/);
                          if (match) apiErrors.lengthMm = match[1].trim();
                        }
                        if (error.message.includes('heightMm')) {
                          const match = error.message.match(/heightMm:\s*([^;]+)/);
                          if (match) apiErrors.heightMm = match[1].trim();
                        }
                        if (error.message.includes('batteryCapacityKwh')) {
                          const match = error.message.match(/batteryCapacityKwh:\s*([^;]+)/);
                          if (match) apiErrors.batteryCapacityKwh = match[1].trim();
                        }
                        if (error.message.includes('chargingTimeHours')) {
                          const match = error.message.match(/chargingTimeHours:\s*([^;]+)/);
                          if (match) apiErrors.chargingTimeHours = match[1].trim();
                        }
                        if (error.message.includes('seatingCapacity')) {
                          const match = error.message.match(/seatingCapacity:\s*([^;]+)/);
                          if (match) apiErrors.seatingCapacity = match[1].trim();
                        }
                        if (error.message.includes('maxSpeedKmh')) {
                          const match = error.message.match(/maxSpeedKmh:\s*([^;]+)/);
                          if (match) apiErrors.maxSpeedKmh = match[1].trim();
                        }
                        
                        // Hiển thị errors dưới các ô tương ứng
                        if (Object.keys(apiErrors).length > 0) {
                          setEditCarErrors(apiErrors);
                        }
                      }
                      
                      // Không hiển thị popup alert, chỉ log ra console
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

                    setEditCarErrors({});
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

        {/* Add Dealer Modal */}
        {showAddDealerModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: '700px' }}>
              <div className={styles.modalHeader}>
                <h2>
                  <i className="fas fa-store"></i>
                  Thêm đại lý mới
                </h2>
                <button
                  className={styles.closeButton}
                  onClick={() => {
                    setShowAddDealerModal(false);
                    setNewDealer({
                      dealerName: '',
                      houseNumberAndStreet: '',
                      wardOrCommune: '',
                      district: '',
                      provinceOrCity: '',
                      contactPerson: '',
                      phone: '',
                      fullAddress: ''
                    });
                    setNewDealerErrors({});
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
                  {/* Dealer Name */}
                  <div className={styles.settingItem} style={{ gridColumn: 'span 2' }}>
                    <label>Tên đại lý <span style={{color: 'red'}}>*</span></label>
                    <input
                      type="text"
                      className={styles.settingInput}
                      value={newDealer.dealerName}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewDealer({ ...newDealer, dealerName: value });
                        const error = validateDealerField('dealerName', value);
                        setNewDealerErrors(prev => ({ ...prev, dealerName: error }));
                      }}
                      style={newDealerErrors.dealerName ? { borderColor: 'red' } : {}}
                      placeholder="Nhập tên đại lý"
                    />
                    {newDealerErrors.dealerName && (
                      <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                        ⚠️ {newDealerErrors.dealerName}
                      </span>
                    )}
                  </div>

                  {/* House Number and Street */}
                  <div className={styles.settingItem}>
                    <label>Số nhà và tên đường <span style={{color: 'red'}}>*</span></label>
                    <input
                      type="text"
                      className={styles.settingInput}
                      value={newDealer.houseNumberAndStreet}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewDealer({ ...newDealer, houseNumberAndStreet: value });
                        const error = validateDealerField('houseNumberAndStreet', value);
                        setNewDealerErrors(prev => ({ ...prev, houseNumberAndStreet: error }));
                      }}
                      style={newDealerErrors.houseNumberAndStreet ? { borderColor: 'red' } : {}}
                      placeholder="VD: 123 Nguyễn Văn Trỗi"
                    />
                    {newDealerErrors.houseNumberAndStreet && (
                      <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                        ⚠️ {newDealerErrors.houseNumberAndStreet}
                      </span>
                    )}
                  </div>

                  {/* Ward or Commune */}
                  <div className={styles.settingItem}>
                    <label>Phường/Xã <span style={{color: 'red'}}>*</span></label>
                    <input
                      type="text"
                      className={styles.settingInput}
                      value={newDealer.wardOrCommune}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewDealer({ ...newDealer, wardOrCommune: value });
                        const error = validateDealerField('wardOrCommune', value);
                        setNewDealerErrors(prev => ({ ...prev, wardOrCommune: error }));
                      }}
                      style={newDealerErrors.wardOrCommune ? { borderColor: 'red' } : {}}
                      placeholder="VD: Phường Tân Bình"
                    />
                    {newDealerErrors.wardOrCommune && (
                      <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                        ⚠️ {newDealerErrors.wardOrCommune}
                      </span>
                    )}
                  </div>

                  {/* District */}
                  <div className={styles.settingItem}>
                    <label>Quận/Huyện <span style={{color: 'red'}}>*</span></label>
                    <input
                      type="text"
                      className={styles.settingInput}
                      value={newDealer.district}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewDealer({ ...newDealer, district: value });
                        const error = validateDealerField('district', value);
                        setNewDealerErrors(prev => ({ ...prev, district: error }));
                      }}
                      style={newDealerErrors.district ? { borderColor: 'red' } : {}}
                      placeholder="VD: Quận 1"
                    />
                    {newDealerErrors.district && (
                      <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                        ⚠️ {newDealerErrors.district}
                      </span>
                    )}
                  </div>

                  {/* Province or City */}
                  <div className={styles.settingItem}>
                    <label>Tỉnh/Thành phố <span style={{color: 'red'}}>*</span></label>
                    <input
                      type="text"
                      className={styles.settingInput}
                      value={newDealer.provinceOrCity}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewDealer({ ...newDealer, provinceOrCity: value });
                        const error = validateDealerField('provinceOrCity', value);
                        setNewDealerErrors(prev => ({ ...prev, provinceOrCity: error }));
                      }}
                      style={newDealerErrors.provinceOrCity ? { borderColor: 'red' } : {}}
                      placeholder="VD: TP Hồ Chí Minh"
                    />
                    {newDealerErrors.provinceOrCity && (
                      <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                        ⚠️ {newDealerErrors.provinceOrCity}
                      </span>
                    )}
                  </div>

                  {/* Contact Person */}
                  <div className={styles.settingItem}>
                    <label>Người liên hệ <span style={{color: 'red'}}>*</span></label>
                    <input
                      type="text"
                      className={styles.settingInput}
                      value={newDealer.contactPerson}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewDealer({ ...newDealer, contactPerson: value });
                        const error = validateDealerField('contactPerson', value);
                        setNewDealerErrors(prev => ({ ...prev, contactPerson: error }));
                      }}
                      style={newDealerErrors.contactPerson ? { borderColor: 'red' } : {}}
                      placeholder="VD: Nguyễn Văn A"
                    />
                    {newDealerErrors.contactPerson && (
                      <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                        ⚠️ {newDealerErrors.contactPerson}
                      </span>
                    )}
                  </div>

                  {/* Phone */}
                  <div className={styles.settingItem}>
                    <label>Số điện thoại <span style={{color: 'red'}}>*</span></label>
                    <input
                      type="text"
                      className={styles.settingInput}
                      value={newDealer.phone}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewDealer({ ...newDealer, phone: value });
                        const error = validateDealerField('phone', value);
                        setNewDealerErrors(prev => ({ ...prev, phone: error }));
                      }}
                      style={newDealerErrors.phone ? { borderColor: 'red' } : {}}
                      placeholder="VD: 0901234567 (10-11 chữ số)"
                    />
                    {newDealerErrors.phone && (
                      <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                        ⚠️ {newDealerErrors.phone}
                      </span>
                    )}
                  </div>

                  {/* Full Address */}
                  <div className={styles.settingItem} style={{ gridColumn: 'span 2' }}>
                    <label>Địa chỉ đầy đủ <span style={{color: 'red'}}>*</span></label>
                    <textarea
                      className={styles.settingInput}
                      value={newDealer.fullAddress}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewDealer({ ...newDealer, fullAddress: value });
                        const error = validateDealerField('fullAddress', value);
                        setNewDealerErrors(prev => ({ ...prev, fullAddress: error }));
                      }}
                      style={newDealerErrors.fullAddress ? { borderColor: 'red', minHeight: '80px' } : { minHeight: '80px' }}
                      placeholder="VD: 123 Nguyễn Văn Trỗi, Phường Tân Bình, Quận 1, TP Hồ Chí Minh"
                      rows={3}
                    />
                    {newDealerErrors.fullAddress && (
                      <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                        ⚠️ {newDealerErrors.fullAddress}
                      </span>
                    )}
                  </div>

                  {/* General Error */}
                  {newDealerErrors.general && (
                    <div className={styles.settingItem} style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: 'red', fontSize: '0.9em', padding: '12px', backgroundColor: '#ffebee', borderRadius: '4px', display: 'block' }}>
                        ⚠️ {newDealerErrors.general}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowAddDealerModal(false);
                    setNewDealer({
                      dealerName: '',
                      houseNumberAndStreet: '',
                      wardOrCommune: '',
                      district: '',
                      provinceOrCity: '',
                      contactPerson: '',
                      phone: '',
                      fullAddress: ''
                    });
                    setNewDealerErrors({});
                  }}
                  disabled={isCreatingDealer}
                >
                  Hủy
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={handleCreateDealer}
                  disabled={isCreatingDealer}
                >
                  {isCreatingDealer ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Lưu đại lý
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Dealer Modal */}
        {showViewDealerModal && selectedDealer && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: '700px' }}>
              <div className={styles.modalHeader}>
                <h2>
                  <i className="fas fa-store"></i>
                  Chi tiết đại lý
                </h2>
                <button
                  className={styles.closeButton}
                  onClick={() => {
                    setShowViewDealerModal(false);
                    setSelectedDealer(null);
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.carDetails}>
                  {/* Dealer ID */}
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>
                      <i className="fas fa-hashtag"></i>
                      Mã đại lý
                    </div>
                    <div className={styles.detailValue}>#{selectedDealer.dealerId}</div>
                  </div>

                  {/* Dealer Name */}
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>
                      <i className="fas fa-building"></i>
                      Tên đại lý
                    </div>
                    <div className={styles.detailValue} style={{fontWeight: 'bold', fontSize: '16px'}}>
                      {selectedDealer.dealerName}
                    </div>
                  </div>

                  <div className={styles.divider}></div>

                  {/* Address Section */}
                  <div className={styles.sectionTitle}>
                    <i className="fas fa-map-marker-alt"></i>
                    Địa chỉ
                  </div>

                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Số nhà và tên đường</div>
                    <div className={styles.detailValue}>{selectedDealer.houseNumberAndStreet}</div>
                  </div>

                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Phường/Xã</div>
                    <div className={styles.detailValue}>{selectedDealer.wardOrCommune}</div>
                  </div>

                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Quận/Huyện</div>
                    <div className={styles.detailValue}>{selectedDealer.district}</div>
                  </div>

                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Tỉnh/Thành phố</div>
                    <div className={styles.detailValue}>{selectedDealer.provinceOrCity}</div>
                  </div>

                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>
                      <i className="fas fa-location-arrow"></i>
                      Địa chỉ đầy đủ
                    </div>
                    <div className={styles.detailValue} style={{
                      padding: '12px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '6px',
                      lineHeight: '1.6'
                    }}>
                      {selectedDealer.fullAddress}
                    </div>
                  </div>

                  <div className={styles.divider}></div>

                  {/* Contact Section */}
                  <div className={styles.sectionTitle}>
                    <i className="fas fa-address-card"></i>
                    Thông tin liên hệ
                  </div>

                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>
                      <i className="fas fa-user"></i>
                      Người liên hệ
                    </div>
                    <div className={styles.detailValue}>{selectedDealer.contactPerson}</div>
                  </div>

                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>
                      <i className="fas fa-phone"></i>
                      Số điện thoại
                    </div>
                    <div className={styles.detailValue}>
                      <a href={`tel:${selectedDealer.phone}`} style={{
                        color: '#4CAF50',
                        textDecoration: 'none',
                        fontWeight: '500'
                      }}>
                        {selectedDealer.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowViewDealerModal(false);
                    setSelectedDealer(null);
                  }}
                >
                  <i className="fas fa-times"></i>
                  Đóng
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={() => {
                    if (selectedDealer) {
                      setShowViewDealerModal(false);
                      handleEditDealer(selectedDealer.dealerId);
                    }
                  }}
                >
                  <i className="fas fa-edit"></i>
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Dealer Modal */}
        {showEditDealerModal && editingDealer && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: '700px' }}>
              <div className={styles.modalHeader}>
                <h2>
                  <i className="fas fa-edit"></i>
                  Chỉnh sửa đại lý
                </h2>
                <button
                  className={styles.closeButton}
                  onClick={() => {
                    setShowEditDealerModal(false);
                    setEditingDealer(null);
                    setEditDealerErrors({});
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
                  {/* Dealer Name */}
                  <div className={styles.settingItem} style={{ gridColumn: 'span 2' }}>
                    <label>Tên đại lý <span style={{color: 'red'}}>*</span></label>
                    <input
                      type="text"
                      className={styles.settingInput}
                      value={editDealer.dealerName}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditDealer({ ...editDealer, dealerName: value });
                        const error = validateDealerField('dealerName', value);
                        setEditDealerErrors(prev => ({ ...prev, dealerName: error }));
                      }}
                      style={editDealerErrors.dealerName ? { borderColor: 'red' } : {}}
                      placeholder="Nhập tên đại lý"
                    />
                    {editDealerErrors.dealerName && (
                      <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                        ⚠️ {editDealerErrors.dealerName}
                      </span>
                    )}
                  </div>

                  {/* House Number and Street */}
                  <div className={styles.settingItem}>
                    <label>Số nhà và tên đường <span style={{color: 'red'}}>*</span></label>
                    <input
                      type="text"
                      className={styles.settingInput}
                      value={editDealer.houseNumberAndStreet}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditDealer({ ...editDealer, houseNumberAndStreet: value });
                        const error = validateDealerField('houseNumberAndStreet', value);
                        setEditDealerErrors(prev => ({ ...prev, houseNumberAndStreet: error }));
                      }}
                      style={editDealerErrors.houseNumberAndStreet ? { borderColor: 'red' } : {}}
                      placeholder="VD: 123 Nguyễn Văn Trỗi"
                    />
                    {editDealerErrors.houseNumberAndStreet && (
                      <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                        ⚠️ {editDealerErrors.houseNumberAndStreet}
                      </span>
                    )}
                  </div>

                  {/* Ward or Commune */}
                  <div className={styles.settingItem}>
                    <label>Phường/Xã <span style={{color: 'red'}}>*</span></label>
                    <input
                      type="text"
                      className={styles.settingInput}
                      value={editDealer.wardOrCommune}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditDealer({ ...editDealer, wardOrCommune: value });
                        const error = validateDealerField('wardOrCommune', value);
                        setEditDealerErrors(prev => ({ ...prev, wardOrCommune: error }));
                      }}
                      style={editDealerErrors.wardOrCommune ? { borderColor: 'red' } : {}}
                      placeholder="VD: Phường Tân Bình"
                    />
                    {editDealerErrors.wardOrCommune && (
                      <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                        ⚠️ {editDealerErrors.wardOrCommune}
                      </span>
                    )}
                  </div>

                  {/* District */}
                  <div className={styles.settingItem}>
                    <label>Quận/Huyện <span style={{color: 'red'}}>*</span></label>
                    <input
                      type="text"
                      className={styles.settingInput}
                      value={editDealer.district}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditDealer({ ...editDealer, district: value });
                        const error = validateDealerField('district', value);
                        setEditDealerErrors(prev => ({ ...prev, district: error }));
                      }}
                      style={editDealerErrors.district ? { borderColor: 'red' } : {}}
                      placeholder="VD: Quận 1"
                    />
                    {editDealerErrors.district && (
                      <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                        ⚠️ {editDealerErrors.district}
                      </span>
                    )}
                  </div>

                  {/* Province or City */}
                  <div className={styles.settingItem}>
                    <label>Tỉnh/Thành phố <span style={{color: 'red'}}>*</span></label>
                    <input
                      type="text"
                      className={styles.settingInput}
                      value={editDealer.provinceOrCity}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditDealer({ ...editDealer, provinceOrCity: value });
                        const error = validateDealerField('provinceOrCity', value);
                        setEditDealerErrors(prev => ({ ...prev, provinceOrCity: error }));
                      }}
                      style={editDealerErrors.provinceOrCity ? { borderColor: 'red' } : {}}
                      placeholder="VD: TP Hồ Chí Minh"
                    />
                    {editDealerErrors.provinceOrCity && (
                      <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                        ⚠️ {editDealerErrors.provinceOrCity}
                      </span>
                    )}
                  </div>

                  {/* Contact Person */}
                  <div className={styles.settingItem}>
                    <label>Người liên hệ <span style={{color: 'red'}}>*</span></label>
                    <input
                      type="text"
                      className={styles.settingInput}
                      value={editDealer.contactPerson}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditDealer({ ...editDealer, contactPerson: value });
                        const error = validateDealerField('contactPerson', value);
                        setEditDealerErrors(prev => ({ ...prev, contactPerson: error }));
                      }}
                      style={editDealerErrors.contactPerson ? { borderColor: 'red' } : {}}
                      placeholder="VD: Nguyễn Văn A"
                    />
                    {editDealerErrors.contactPerson && (
                      <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                        ⚠️ {editDealerErrors.contactPerson}
                      </span>
                    )}
                  </div>

                  {/* Phone */}
                  <div className={styles.settingItem}>
                    <label>Số điện thoại <span style={{color: 'red'}}>*</span></label>
                    <input
                      type="text"
                      className={styles.settingInput}
                      value={editDealer.phone}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditDealer({ ...editDealer, phone: value });
                        const error = validateDealerField('phone', value);
                        setEditDealerErrors(prev => ({ ...prev, phone: error }));
                      }}
                      style={editDealerErrors.phone ? { borderColor: 'red' } : {}}
                      placeholder="VD: 0901234567 (10-11 chữ số)"
                    />
                    {editDealerErrors.phone && (
                      <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                        ⚠️ {editDealerErrors.phone}
                      </span>
                    )}
                  </div>

                  {/* Full Address */}
                  <div className={styles.settingItem} style={{ gridColumn: 'span 2' }}>
                    <label>Địa chỉ đầy đủ <span style={{color: 'red'}}>*</span></label>
                    <textarea
                      className={styles.settingInput}
                      value={editDealer.fullAddress}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditDealer({ ...editDealer, fullAddress: value });
                        const error = validateDealerField('fullAddress', value);
                        setEditDealerErrors(prev => ({ ...prev, fullAddress: error }));
                      }}
                      style={editDealerErrors.fullAddress ? { borderColor: 'red', minHeight: '80px' } : { minHeight: '80px' }}
                      placeholder="VD: 123 Nguyễn Văn Trỗi, Phường Tân Bình, Quận 1, TP Hồ Chí Minh"
                      rows={3}
                    />
                    {editDealerErrors.fullAddress && (
                      <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                        ⚠️ {editDealerErrors.fullAddress}
                      </span>
                    )}
                  </div>

                  {/* General Error */}
                  {editDealerErrors.general && (
                    <div className={styles.settingItem} style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: 'red', fontSize: '0.9em', padding: '12px', backgroundColor: '#ffebee', borderRadius: '4px', display: 'block' }}>
                        ⚠️ {editDealerErrors.general}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowEditDealerModal(false);
                    setEditingDealer(null);
                    setEditDealerErrors({});
                  }}
                  disabled={isUpdatingDealer}
                >
                  Hủy
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={handleUpdateDealer}
                  disabled={isUpdatingDealer}
                >
                  {isUpdatingDealer ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Cập nhật đại lý
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPage;