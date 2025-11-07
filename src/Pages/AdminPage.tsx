import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { CAR_DATA } from '../constants/CarDatas';
import type { CarType } from '../constants/CarDatas';
import { fetchVehiclesFromApi, createVehicle, getVehicleById, updateVehicle, deleteVehicle, type UpdateVehicleRequest } from '../services/vehicleApi';
import { fetchManufacturerInventorySummary, createInventoryRecord, updateInventoryRecord, deleteInventoryRecord, type CreateInventoryRequest, type UpdateInventoryRequest } from '../services/manufacturerInventoryApi';
import type { ManufacturerInventorySummary, VehicleInventoryItem } from '../types/inventory';
import { fetchDealers, createDealer, getDealerById, updateDealer, deleteDealer, fetchUnverifiedAccounts, verifyAccount, type Dealer, type UnverifiedAccount } from '../services/dealerApi';
import { getOrders, getOrderById, cancelOrder, getBillPreview, updatePaymentStatus, updateOrderStatus, type Order } from '../services/orderApi';
import { confirmDelivery } from '../services/deliveryApi';
import { createColor, updateColor, deleteColor, fetchColors } from '../services/colorApi';
import type { VehicleColor, CreateColorRequest, UpdateColorRequest } from '../types/color';
import { fetchDiscountPolicies, createDiscountPolicy, updateDiscountPolicy, deleteDiscountPolicy } from '../services/discountApi';
import type { DiscountPolicy, CreateDiscountRequest, UpdateDiscountRequest } from '../types/discount';
import { downloadContractPdf } from '../services/contractsApi';
import { useContractCheck } from '../hooks/useContractCheck';
import styles from '../styles/AdminStyles/AdminPage.module.scss';
import sidebarStyles from '../styles/AdminStyles/AdminSidebar.module.scss';
import modalStyles from '../styles/AdminStyles/OrderDetailModal.module.scss';
import AdminLayout from '../components/AdminLayout';
import ConfirmDialog from '../components/ConfirmDialog';
import SuccessNotification from '../components/SuccessNotification';

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

// Helper function to compress and validate image
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        // Calculate new dimensions (max 800px width/height while maintaining aspect ratio)
        const maxSize = 800;
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with reduced quality (0.7 = 70% quality)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        
        // Validate size (max 900KB base64 ≈ 675KB actual image)
        if (compressedBase64.length > 900000) {
          reject(new Error('Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn hoặc giảm chất lượng.'));
          return;
        }
        
        console.log(`✅ Image compressed: ${(compressedBase64.length / 1024).toFixed(2)} KB`);
        resolve(compressedBase64);
      };
      
      img.onerror = () => reject(new Error('Không thể tải ảnh'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Không thể đọc file'));
    reader.readAsDataURL(file);
  });
};

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

// Helper function to format vehicle display name
const formatVehicleDisplayName = (vehicle: { vehicleName: string; version?: string; color?: string }): string => {
  let displayName = vehicle.vehicleName;
  if (vehicle.version) {
    displayName += ` ${vehicle.version}`;
  }
  if (vehicle.color) {
    displayName += ` - ${vehicle.color}`;
  }
  return displayName;
};

// Validation helper function
const validateCarField = (fieldName: string, value: any, allValues?: any): string => {
  // Kiểm tra các field text
  if (fieldName === 'modelName') {
    if (!value || !value.trim()) {
      return 'Model không được để trống';
    }
    if (value.length > 100) {
      return 'Model tối đa 100 ký tự';
    }
  }

  if (fieldName === 'version') {
    if (!value || !value.trim()) {
      return 'Phiên bản không được để trống';
    }
    if (value.length > 100) {
      return 'Phiên bản tối đa 100 ký tự';
    }
  }

  if (fieldName === 'color' && (!value || !value.trim())) {
    return 'Vui lòng chọn màu xe';
  }

  // Kiểm tra các field số
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  // Battery Capacity (5-300 kWh)
  if (fieldName === 'batteryCapacityKwh') {
    if (isNaN(numValue) || numValue === null || numValue === undefined) {
      return 'Dung lượng pin bắt buộc';
    }
    if (numValue < 5) {
      return 'Dung lượng pin tối thiểu 5 kWh';
    }
    if (numValue > 300) {
      return 'Dung lượng pin tối đa 300 kWh';
    }
  }

  // Range (10-2000 km)
  if (fieldName === 'rangeKm') {
    if (isNaN(numValue) || numValue === null || numValue === undefined) {
      return 'Quãng đường bắt buộc';
    }
    if (numValue < 10) {
      return 'Quãng đường tối thiểu 10 km';
    }
    if (numValue > 2000) {
      return 'Quãng đường tối đa 2000 km';
    }
  }

  // Max Speed (10-500 km/h)
  if (fieldName === 'maxSpeedKmh') {
    if (isNaN(numValue) || numValue === null || numValue === undefined) {
      return 'Tốc độ tối đa bắt buộc';
    }
    if (numValue < 10) {
      return 'Tốc độ tối thiểu 10 km/h';
    }
    if (numValue > 500) {
      return 'Tốc độ tối đa 500 km/h';
    }
  }

  // Charging Time (0.1-72 hours)
  if (fieldName === 'chargingTimeHours') {
    if (isNaN(numValue) || numValue === null || numValue === undefined) {
      return 'Thời gian sạc bắt buộc';
    }
    if (numValue < 0.1) {
      return 'Thời gian sạc tối thiểu 0.1 giờ';
    }
    if (numValue > 72) {
      return 'Thời gian sạc tối đa 72 giờ';
    }
  }

  // Kiểm tra finalPrice (có thể là 0)
  if (fieldName === 'finalPrice') {
    if (isNaN(numValue) || numValue < 0) {
      return 'Giá cuối cùng không được là số âm';
    }
    // Nếu finalPrice > 0, phải nhỏ hơn hoặc bằng priceRetail
    if (allValues && numValue > 0 && numValue > allValues.priceRetail) {
      return 'Giá khuyến mãi không được cao hơn giá gốc';
    }
  }

  // Seating Capacity (1-12 seats) - Backend dùng Pattern regex ^(?:[1-9]|1[0-2])$
  if (fieldName === 'seatingCapacity') {
    if (isNaN(numValue) || numValue === null || numValue === undefined) {
      return 'Số chỗ ngồi bắt buộc';
    }
    if (numValue < 1 || numValue > 12) {
      return 'Chỉ chấp nhận xe dưới 12 chỗ';
    }
  }

  // Motor Power (1-1500 kW)
  if (fieldName === 'motorPowerKw') {
    if (isNaN(numValue) || numValue === null || numValue === undefined) {
      return 'Công suất mô tơ bắt buộc';
    }
    if (numValue < 1) {
      return 'Công suất mô tơ tối thiểu 1 kW';
    }
    if (numValue > 1500) {
      return 'Công suất mô tơ tối đa 1500 kW';
    }
  }

  // Weight (100-10000 kg)
  if (fieldName === 'weightKg') {
    if (isNaN(numValue) || numValue === null || numValue === undefined) {
      return 'Khối lượng bắt buộc';
    }
    if (numValue < 100) {
      return 'Khối lượng tối thiểu 100 kg';
    }
    if (numValue > 10000) {
      return 'Khối lượng tối đa 10000 kg';
    }
  }

  // Length (500-10000 mm)
  if (fieldName === 'lengthMm') {
    if (isNaN(numValue) || numValue === null || numValue === undefined) {
      return 'Chiều dài bắt buộc';
    }
    if (numValue < 500) {
      return 'Chiều dài tối thiểu 500 mm';
    }
    if (numValue > 10000) {
      return 'Chiều dài tối đa 10000 mm';
    }
  }

  // Width (300-5000 mm)
  if (fieldName === 'widthMm') {
    if (isNaN(numValue) || numValue === null || numValue === undefined) {
      return 'Chiều rộng bắt buộc';
    }
    if (numValue < 300) {
      return 'Chiều rộng tối thiểu 300 mm';
    }
    if (numValue > 5000) {
      return 'Chiều rộng tối đa 5000 mm';
    }
  }

  // Height - Backend không có validation cụ thể, giữ logic cũ hoặc thêm reasonable limits
  if (fieldName === 'heightMm') {
    if (isNaN(numValue) || numValue === null || numValue === undefined) {
      return 'Chiều cao bắt buộc';
    }
    if (numValue <= 0) {
      return 'Chiều cao phải lớn hơn 0';
    }
    // Reasonable limit for vehicle height (100mm - 5000mm)
    if (numValue < 100 || numValue > 5000) {
      return 'Chiều cao phải từ 100mm đến 5000mm';
    }
  }

  // Price Retail - Backend không có validation cụ thể
  if (fieldName === 'priceRetail') {
    if (isNaN(numValue) || numValue === null || numValue === undefined) {
      return 'Giá bán bắt buộc';
    }
    if (numValue <= 0) {
      return 'Giá bán phải lớn hơn 0';
    }
  }

  // Kiểm tra năm sản xuất
  if (fieldName === 'manufactureYear') {
    if (isNaN(numValue) || numValue === null || numValue === undefined) {
      return 'Năm sản xuất bắt buộc';
    }
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
  id: number | string;
  userId: number;
  userName: string;
  dealerName: string;
  carId: number;
  carName: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  deliveryAddress: string;
  orderItems: Array<{
    vehicleName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

interface CarWithStatus extends CarType {
  id: number;
  status: 'available' | 'rented' | 'maintenance' | 'unavailable';
  totalBookings: number;
  rating: number;
  lastMaintenance: string;
  color?: string; // Color name from vehicle
}



const AdminPage: React.FC = () => {
  const location = useLocation();
  const initialTab = (location.state as any)?.tab || 'dashboard';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cars' | 'colors' | 'inventory' | 'dealers' | 'discounts' | 'bookings' | 'analytics' | 'settings'>(initialTab);
  const [cars, setCars] = useState<CarWithStatus[]>([]);
  const [colors, setColors] = useState<VehicleColor[]>([]);
  const [discounts, setDiscounts] = useState<DiscountPolicy[]>([]);

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
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(0);
  const [editingCar, setEditingCar] = useState<any>(null);
  // Track selected color for each car group on main cards
  const [carGroupColorIndex, setCarGroupColorIndex] = useState<Record<string, number>>({});
  const [newCar, setNewCar] = useState({
    modelName: '',
    version: '',
    colorIds: [] as number[], // Changed from color to colorIds array
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
    finalPrice: 0,
    status: 'AVAILABLE' as 'AVAILABLE' | 'DISCONTINUED',
    manufactureYear: new Date().getFullYear()
  });

  // Image data for each selected color
  const [colorImages, setColorImages] = useState<Record<number, {
    imageUrl: string;
    imagePreview: string;
  }>>({});
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
    finalPrice: 0,
    status: 'AVAILABLE' as 'AVAILABLE' | 'DISCONTINUED',
    manufactureYear: new Date().getFullYear()
  });
  const [isCreatingVehicle, setIsCreatingVehicle] = useState<boolean>(false);
  const [isUpdatingVehicle, setIsUpdatingVehicle] = useState<boolean>(false);
  const [newCarErrors, setNewCarErrors] = useState<Record<string, string>>({});
  const [editCarErrors, setEditCarErrors] = useState<Record<string, string>>({});
  // Image upload / preview states for edit modal (add modal uses colorImages)
  const [editCarImagePreview, setEditCarImagePreview] = useState<string>('');
  const [editCarImageUrl, setEditCarImageUrl] = useState<string>('');
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isVisible: false,
    message: '',
    type: 'success'
  });
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [unverifiedAccounts, setUnverifiedAccounts] = useState<UnverifiedAccount[]>([]);
  const [inventorySummary, setInventorySummary] = useState<ManufacturerInventorySummary | null>(null);
  const [dealerViewMode, setDealerViewMode] = useState<'verified' | 'unverified'>('verified');
  const [showAddDealerModal, setShowAddDealerModal] = useState<boolean>(false);
  const [showViewDealerModal, setShowViewDealerModal] = useState<boolean>(false);
  const [showEditDealerModal, setShowEditDealerModal] = useState<boolean>(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {}
  });
  const [verifyingUserId, setVerifyingUserId] = useState<number | null>(null);
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

  // Color Management States
  const [showAddColorModal, setShowAddColorModal] = useState<boolean>(false);
  const [showEditColorModal, setShowEditColorModal] = useState<boolean>(false);
  const [showViewColorModal, setShowViewColorModal] = useState<boolean>(false);
  const [editingColor, setEditingColor] = useState<VehicleColor | null>(null);
  const [selectedColor, setSelectedColor] = useState<VehicleColor | null>(null);
  const [isCreatingColor, setIsCreatingColor] = useState<boolean>(false);
  const [isUpdatingColor, setIsUpdatingColor] = useState<boolean>(false);
  const [newColor, setNewColor] = useState<CreateColorRequest>({
    colorName: '',
    hexCode: '#000000'
  });
  const [editColor, setEditColor] = useState<UpdateColorRequest>({
    colorName: '',
    hexCode: '#000000',
    isActive: true
  });
  const [newColorErrors, setNewColorErrors] = useState<Record<string, string>>({});
  const [editColorErrors, setEditColorErrors] = useState<Record<string, string>>({});

  // Inventory Management States
  const [showAddInventoryModal, setShowAddInventoryModal] = useState<boolean>(false);
  const [showEditInventoryModal, setShowEditInventoryModal] = useState<boolean>(false);
  const [showViewInventoryModal, setShowViewInventoryModal] = useState<boolean>(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<VehicleInventoryItem | null>(null);
  const [editingInventoryItem, setEditingInventoryItem] = useState<VehicleInventoryItem | null>(null);
  const [isCreatingInventory, setIsCreatingInventory] = useState<boolean>(false);
  const [isUpdatingInventory, setIsUpdatingInventory] = useState<boolean>(false);
  const [newInventory, setNewInventory] = useState<CreateInventoryRequest>({
    vehicleId: 0,
    quantity: 0
  });
  const [editInventory, setEditInventory] = useState<UpdateInventoryRequest>({
    quantity: 0
  });
  const [newInventoryErrors, setNewInventoryErrors] = useState<Record<string, string>>({});
  const [editInventoryErrors, setEditInventoryErrors] = useState<Record<string, string>>({});

  // Discount Management States
  const [showAddDiscountModal, setShowAddDiscountModal] = useState<boolean>(false);
  const [showEditDiscountModal, setShowEditDiscountModal] = useState<boolean>(false);
  const [showViewDiscountModal, setShowViewDiscountModal] = useState<boolean>(false);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountPolicy | null>(null);
  const [editingDiscount, setEditingDiscount] = useState<DiscountPolicy | null>(null);
  const [isCreatingDiscount, setIsCreatingDiscount] = useState<boolean>(false);
  const [isUpdatingDiscount, setIsUpdatingDiscount] = useState<boolean>(false);
  const [newDiscount, setNewDiscount] = useState<CreateDiscountRequest>({
    minQuantity: 0,
    maxQuantity: 0,
    discountRate: 0,
    description: '',
    isActive: true
  });
  const [editDiscount, setEditDiscount] = useState<UpdateDiscountRequest>({
    minQuantity: 0,
    maxQuantity: 0,
    discountRate: 0,
    description: '',
    isActive: true
  });
  const [newDiscountErrors, setNewDiscountErrors] = useState<Record<string, string>>({});
  const [editDiscountErrors, setEditDiscountErrors] = useState<Record<string, string>>({});

  const [bookings, setBookings] = useState<Booking[]>([]);

  // Use contract check hook for optimized one-contract-per-order lookup
  const { hasContract, getContractId, reload: reloadContractMap } = useContractCheck();

  // Reload contract map when navigating back from contract creation
  // Use ref to track if we've already reloaded for this timestamp
  const lastRefreshTimestamp = useRef<number | null>(null);

  useEffect(() => {
    const refreshTimestamp = (location.state as any)?.refresh;

    // Only reload if:
    // 1. There's a refresh signal
    // 2. It's a NEW timestamp (not the same as last time)
    if (refreshTimestamp && refreshTimestamp !== lastRefreshTimestamp.current) {
      console.log('🔄 Refresh signal detected from ContractCreatePage, reloading contract map...');
      lastRefreshTimestamp.current = refreshTimestamp;
      reloadContractMap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]); // Only depend on location.state, NOT reloadContractMap

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

  // Order detail modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);

  // Notification is auto-hidden by SuccessNotification component

  // Function to reload vehicles from API
  const reloadVehicles = async () => {
    try {
      console.log('🔄 Reloading vehicles from API...');
      const { vehicles } = await fetchVehiclesFromApi({ page: 0, size: 20 });
      const apiCars: CarWithStatus[] = vehicles.map((v) => ({
        // Map API fields to UI fields
        id: v.vehicleId,
        name: `${v.modelName} ${v.version}`,
        img: (v as any).imageUrl || `/src/images/cars-big/car-${v.vehicleId}.jpg`,
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
        lastMaintenance: '2024-09-15',
        color: v.color // Add color field
      }));
      setCars(apiCars);
      console.log('✅ Vehicles reloaded successfully');
    } catch (err) {
      console.error('❌ Failed to reload vehicles:', err);
    }
  };

  // Function to reload inventory from API
  const reloadInventory = async () => {
    try {
      console.log('🔄 Reloading inventory from API...');
      const summary = await fetchManufacturerInventorySummary();
      setInventorySummary(summary);
      console.log('✅ Inventory reloaded successfully:', summary);
    } catch (err) {
      console.error('❌ Failed to reload inventory:', err);
    }
  };

  // Function to reload discounts from API
  const reloadDiscounts = async () => {
    try {
      console.log('🔄 Reloading discounts from API...');
      const response = await fetchDiscountPolicies();

      // Handle response - might be array or object with data property
      let discountList: DiscountPolicy[] = [];
      if (Array.isArray(response)) {
        discountList = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        discountList = Array.isArray((response as any).data) ? (response as any).data : [];
      }

      setDiscounts(discountList);
      console.log('✅ Discounts reloaded successfully:', discountList);
    } catch (err) {
      console.error('❌ Failed to reload discounts:', err);
      setDiscounts([]);
    }
  };

  useEffect(() => {
    // Fetch vehicles from API for Cars management tab
    (async () => {
      try {
        const { vehicles } = await fetchVehiclesFromApi({ page: 0, size: 20 });
        const apiCars: CarWithStatus[] = vehicles.map((v) => ({
          // Map API fields to UI fields
          id: v.vehicleId,
          name: `${v.modelName} ${v.version}`,
          img: (v as any).imageUrl || `/src/images/cars-big/car-${v.vehicleId}.jpg`,
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
          lastMaintenance: '2024-09-15',
          color: v.color // Add color field
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

    // Fetch unverified accounts from API
    (async () => {
      try {
        const accounts = await fetchUnverifiedAccounts();
        setUnverifiedAccounts(accounts);
        console.log('✅ Loaded unverified accounts:', accounts);
      } catch (error) {
        console.error('❌ Failed to load unverified accounts:', error);
        setUnverifiedAccounts([]);
      }
    })();

    // Fetch discount policies from API
    (async () => {
      try {
        console.log('💰 Fetching discount policies from API...');
        const response = await fetchDiscountPolicies();
        console.log('📦 Raw discount response:', response);

        // Handle response - might be array or object with data property
        let discountList: DiscountPolicy[] = [];
        if (Array.isArray(response)) {
          discountList = response;
        } else if (response && typeof response === 'object' && 'data' in response) {
          discountList = Array.isArray((response as any).data) ? (response as any).data : [];
        }

        setDiscounts(discountList);
        console.log('✅ Loaded discount policies:', discountList);
      } catch (error) {
        console.error('❌ Failed to load discount policies:', error);
        setDiscounts([]);
      }
    })();

    // Fetch inventory summary from API
    (async () => {
      try {
        console.log('📦 Fetching inventory summary from API...');
        const summary = await fetchManufacturerInventorySummary();
        setInventorySummary(summary);
        console.log('✅ Loaded inventory summary:', summary);
      } catch (error) {
        console.error('❌ Failed to load inventory summary:', error);
        setInventorySummary(null);
      }
    })();

    // Fetch colors from API
    (async () => {
      try {
        console.log('🎨 Fetching colors from API...');
        const colorList = await fetchColors();
        setColors(colorList);
        console.log('✅ Loaded colors:', colorList);
      } catch (error) {
        console.error('❌ Failed to load colors:', error);
        setColors([]);
      }
    })();

    // Fetch orders from API
    const fetchOrdersData = async () => {
      try {
        console.log('🔄 Fetching orders from API...');
        const ordersData = await getOrders();
        console.log('📦 Orders fetched:', ordersData);
        
        // Map Order data to Booking interface
        const mappedBookings: Booking[] = ordersData.map((order: Order) => {
          // Get first order item for car name
          const firstItem = order.orderItems && order.orderItems.length > 0 
            ? order.orderItems[0] 
            : null;
          
          // Map order status to booking status
          let bookingStatus: Booking['status'] = 'pending';
          if (order.orderStatus === 'PENDING') bookingStatus = 'pending';
          else if (order.orderStatus === 'CONFIRMED') bookingStatus = 'confirmed';
          else if (order.orderStatus === 'PROCESSING') bookingStatus = 'processing';
          else if (order.orderStatus === 'SHIPPED') bookingStatus = 'shipped';
          else if (order.orderStatus === 'DELIVERED') bookingStatus = 'delivered';
          else if (order.orderStatus === 'CANCELLED') bookingStatus = 'cancelled';
          
          // Map payment status
          let paymentSt: Booking['paymentStatus'] = 'pending';
          if (order.paymentStatus === 'PENDING') paymentSt = 'pending';
          else if (order.paymentStatus === 'PAID') paymentSt = 'paid';
          
          return {
            id: order.orderId,
            userId: order.dealerId || 0,
            userName: order.dealerName || 'N/A',
            dealerName: order.dealerName || 'N/A',
            carId: firstItem?.vehicleId || 0,
            carName: firstItem?.vehicleName || 'N/A',
            startDate: order.orderDate || order.desiredDeliveryDate || 'N/A',
            endDate: order.actualDeliveryDate || order.desiredDeliveryDate || 'N/A',
            status: bookingStatus,
            totalAmount: order.grandTotal || 0,
            paymentStatus: paymentSt,
            deliveryAddress: order.deliveryAddress || '',
            orderItems: order.orderItems || []
          };
        });
        
        setBookings(mappedBookings);
        console.log('✅ Bookings mapped:', mappedBookings);

    // Calculate enhanced stats
    setStats({
      totalCars: cars.length || 0,
      totalUsers: dealers.length,
          totalRevenue: mappedBookings.reduce((sum, b) => sum + b.totalAmount, 0),
          monthlyBookings: mappedBookings.filter(b => {
            const orderDate = new Date(b.startDate);
            const now = new Date();
            return orderDate.getMonth() === now.getMonth() && 
                   orderDate.getFullYear() === now.getFullYear();
          }).length,
          activeBookings: mappedBookings.filter(b => 
            b.status === 'processing' || b.status === 'shipped'
          ).length,
          totalBookings: mappedBookings.length,
      avgRating: 4.6,
      pendingMaintenance: 0
    });
      } catch (error) {
        console.error('❌ Error fetching orders:', error);
        
        // Fallback to empty bookings
        setBookings([]);
        setStats({
          totalCars: cars.length || 0,
          totalUsers: dealers.length,
          totalRevenue: 0,
          monthlyBookings: 0,
          activeBookings: 0,
          totalBookings: 0,
          avgRating: 0,
          pendingMaintenance: 0
        });
      }
    };
    
    fetchOrdersData();
  }, []); // Empty dependency array - only run once on mount

  // Handle view order detail
  const handleViewOrderDetail = async (orderId: number | string) => {
    setLoadingOrderDetail(true);
    setShowOrderDetail(true);
    
    try {
      console.log('🔍 Fetching order detail for ID:', orderId);
      const orderDetail = await getOrderById(orderId);
      setSelectedOrder(orderDetail);
      console.log('✅ Order detail loaded:', orderDetail);
    } catch (error) {
      console.error('❌ Error loading order detail:', error);
      alert('Không thể tải chi tiết đơn hàng. Vui lòng thử lại.');
      setShowOrderDetail(false);
    } finally {
      setLoadingOrderDetail(false);
    }
  };

  // Handle contract action - smart: download if exists, create if not
  const handleContractAction = async (orderId: number | string) => {
    try {
      console.log('📄 Order:', orderId, '→ Checking contract...');

      // Use optimized O(1) lookup to get contractId directly
      const contractId = getContractId(String(orderId));

      console.log('🎯 Contract mapping:', orderId, '→', contractId || 'NOT FOUND');

      if (contractId) {
        // Contract exists -> Download PDF directly using contractId
        console.log('✅ Contract ID found:', contractId, '- Downloading PDF...');

        setNotification({
          isVisible: true,
          message: '⏳ Đang tải hợp đồng...',
          type: 'info'
        });

        // Download PDF directly with contractId (optimized!)
        const pdfBlob = await downloadContractPdf(contractId);

        // Auto-download file
        const blobUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `Hop-dong-${contractId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);

        setNotification({
          isVisible: true,
          message: `✅ Đã tải hợp đồng #${contractId} thành công!`,
          type: 'success'
        });

        console.log('💾 PDF downloaded for contract:', contractId);
      } else {
        // Contract doesn't exist -> Navigate to create page
        console.log('⚠️ No contract found for order:', orderId, '- Navigating to create page...');
        window.location.href = `/admin/contracts/new?orderId=${orderId}`;
      }
    } catch (error: any) {
      console.error('❌ Error handling contract:', error);
      setNotification({
        isVisible: true,
        message: `❌ ${error.message || 'Không thể xử lý hợp đồng'}`,
        type: 'error'
      });
    }
  };

  // Handle view bill preview
  const handleViewBill = async (orderId: number | string) => {
    try {
      console.log('📄 Viewing bill for order:', orderId);

      setNotification({
        isVisible: true,
        message: '⏳ Đang tải hóa đơn...',
        type: 'info'
      });

      // Fetch bill preview
      const billBlob = await getBillPreview(orderId);

      // Open bill in new tab
      const blobUrl = URL.createObjectURL(billBlob);
      window.open(blobUrl, '_blank');

      // Cleanup after 1 minute
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);

      setNotification({
        isVisible: true,
        message: '✅ Đã mở hóa đơn!',
        type: 'success'
      });

      console.log('✅ Bill opened successfully');
    } catch (error: any) {
      console.error('❌ Error viewing bill:', error);

      let errorMessage = 'Không thể tải hóa đơn';

      if (error.code === 'BILL_NOT_FOUND') {
        errorMessage = 'Đơn hàng này chưa có hóa đơn';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setNotification({
        isVisible: true,
        message: `❌ ${errorMessage}`,
        type: 'error'
      });
    }
  };

  // Handle update order status
  const handleUpdateOrderStatus = async (
    orderId: number | string,
    newStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  ) => {
    try {
      console.log('📦 Updating order status:', orderId, '→', newStatus);

      setNotification({
        isVisible: true,
        message: '⏳ Đang cập nhật trạng thái đơn hàng...',
        type: 'info'
      });

      await updateOrderStatus(orderId, newStatus);

      // Update local state
      setBookings(prev => prev.map(booking =>
        booking.id === orderId
          ? { ...booking, status: newStatus.toLowerCase() as any }
          : booking
      ));

      setNotification({
        isVisible: true,
        message: '✅ Đã cập nhật trạng thái đơn hàng!',
        type: 'success'
      });

      console.log('✅ Order status updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating order status:', error);

      let errorMessage = 'Không thể cập nhật trạng thái đơn hàng';

      if (error.code === 'FORBIDDEN') {
        errorMessage = 'Bạn không có quyền cập nhật đơn hàng này';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setNotification({
        isVisible: true,
        message: `❌ ${errorMessage}`,
        type: 'error'
      });
    }
  };

  // Handle update payment status
  const handleUpdatePaymentStatus = async (
    orderId: number | string,
    newStatus: 'PENDING' | 'PAID' | 'CANCELLED'
  ) => {
    try {
      console.log('💳 Updating payment status:', orderId, '→', newStatus);

      setNotification({
        isVisible: true,
        message: '⏳ Đang cập nhật trạng thái thanh toán...',
        type: 'info'
      });

      await updatePaymentStatus(orderId, newStatus);

      // Update local state
      setBookings(prev => prev.map(booking =>
        booking.id === orderId
          ? { ...booking, paymentStatus: newStatus.toLowerCase() as any }
          : booking
      ));

      setNotification({
        isVisible: true,
        message: '✅ Đã cập nhật trạng thái thanh toán!',
        type: 'success'
      });

      console.log('✅ Payment status updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating payment status:', error);

      let errorMessage = 'Không thể cập nhật trạng thái thanh toán';

      if (error.code === 'FORBIDDEN') {
        errorMessage = 'Bạn không có quyền cập nhật đơn hàng này';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setNotification({
        isVisible: true,
        message: `❌ ${errorMessage}`,
        type: 'error'
      });
    }
  };

  // Handle cancel order
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCancelOrder = async (orderId: number | string, orderInfo: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hủy đơn hàng',
      message: `Bạn có chắc chắn muốn hủy đơn hàng "${orderInfo}"?\n\nHành động này không thể hoàn tác!`,
      type: 'danger',
      onConfirm: async () => {
        try {
          console.log('🚫 Cancelling order:', orderId);

          // Show loading notification
          setNotification({
            isVisible: true,
            message: '⏳ Đang hủy đơn hàng...',
            type: 'info'
          });

          await cancelOrder(orderId);

          // Remove from bookings list
          setBookings(prev => prev.filter(b => b.id !== orderId));

          // Show success notification
          setNotification({
            isVisible: true,
            message: '✅ Đơn hàng đã được hủy thành công',
            type: 'success'
          });

          console.log('✅ Order cancelled successfully');
        } catch (error) {
          console.error('❌ Error cancelling order:', error);
          setNotification({
            isVisible: true,
            message: `❌ Không thể hủy đơn hàng. ${error instanceof Error ? error.message : 'Vui lòng thử lại.'}`,
            type: 'error'
          });
        } finally {
          // Close confirm dialog
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Handle confirm delivery
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleConfirmDelivery = async (orderId: number | string, orderInfo: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận giao hàng',
      message: `Xác nhận đơn hàng "${orderInfo}" đã được giao thành công?\n\nTrạng thái đơn hàng sẽ chuyển sang "Đã giao".`,
      type: 'success',
      onConfirm: async () => {
        try {
          console.log('🚚 Confirming delivery for order:', orderId);

          // Show loading notification
          setNotification({
            isVisible: true,
            message: '⏳ Đang xác nhận giao hàng...',
            type: 'info'
          });

          await confirmDelivery(orderId);

          // Update booking status in the list
          setBookings(prev => prev.map(b => 
            b.id === orderId 
              ? { ...b, status: 'delivered' as const, orderStatus: 'DELIVERED' }
              : b
          ));

          // Show success notification
          setNotification({
            isVisible: true,
            message: '✅ Đã xác nhận giao hàng thành công',
            type: 'success'
          });

          console.log('✅ Delivery confirmed successfully');
        } catch (error) {
          console.error('❌ Error confirming delivery:', error);
          setNotification({
            isVisible: true,
            message: `❌ Không thể xác nhận giao hàng. ${error instanceof Error ? error.message : 'Vui lòng thử lại.'}`,
            type: 'error'
          });
        } finally {
          // Close confirm dialog
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Preserve unused handlers for future use
  const _unusedHandlers = { handleCancelOrder, handleConfirmDelivery };
  console.debug('Reserved handlers:', _unusedHandlers); // Prevent tree-shaking

  const handleDeleteCar = async (carId: number, carName: string) => {
    try {
      // Check if vehicle has inventory
      const vehicleInventory = inventorySummary?.vehicles.find(v => v.vehicleId === carId);
      
      if (vehicleInventory && vehicleInventory.quantity > 0) {
        // Show warning about inventory
        const confirmMessage = `⚠️ CẢNH BÁO: Xe "${carName}" còn ${vehicleInventory.quantity} chiếc trong kho!\n\n` +
          `Bạn cần xóa tồn kho trước khi xóa xe này.\n\n` +
          `Vui lòng vào tab "Kho Hàng" để xóa tồn kho trước.`;
        
        alert(confirmMessage);
        return;
      }

      // Hiển thị dialog xác nhận trước khi xóa
      const confirmMessage = `Bạn có chắc chắn muốn xóa xe "${carName}"?\n\nHành động này không thể hoàn tác.`;

      if (!window.confirm(confirmMessage)) {
        return; // Người dùng hủy xóa
      }

      console.log('🗑️ Deleting car with ID:', carId);

      // Gọi API để xóa xe từ database
      await deleteVehicle(carId);

      // Cập nhật state để loại bỏ xe đã xóa khỏi danh sách
      setCars(cars.filter(car => car.id !== carId));

      // Hiển thị thông báo thành công
      setNotification({
        isVisible: true,
        message: `Đã xóa xe "${carName}" thành công!`,
        type: 'success'
      });

      // Cập nhật stats
      setStats(prevStats => ({
        ...prevStats,
        totalCars: prevStats.totalCars - 1
      }));

    } catch (error) {
      console.error('❌ Error deleting car:', error);
      
      // Show error notification
      setNotification({
        isVisible: true,
        message: error instanceof Error ? error.message : 'Không thể xóa xe. Vui lòng thử lại.',
        type: 'error'
      });
    }
  };

  const handleViewCar = async (carId: number) => {
    try {
      console.log('🔍 Viewing car color variants for ID:', carId);

      // Show loading notification
      setNotification({
        isVisible: true,
        message: '⏳ Đang tải thông tin xe...',
        type: 'info'
      });

      // Find the clicked car to get its model + version
      const clickedCar = cars.find(c => c.id === carId);
      if (!clickedCar) {
        alert('❌ Không tìm thấy thông tin xe.');
        setNotification({ isVisible: false, message: '', type: 'info' });
        return;
      }

      // Get the variant (mark = modelName, model = version)
      const variantName = `${clickedCar.mark} ${clickedCar.model}`;
      console.log('📦 Variant:', variantName);

      // Filter all cars with same mark (modelName) AND model (version) - different colors
      const colorVariants = cars.filter(c =>
        c.mark === clickedCar.mark &&
        c.model === clickedCar.model
      );
      console.log('🎨 Found color variants (local):', colorVariants);

      // Fetch detailed info for each variant from API
      console.log('📡 Fetching detailed info from API for all variants...');
      const detailedVariants = await Promise.all(
        colorVariants.map(async (variant) => {
          try {
            const vehicleDetail = await getVehicleById(variant.id);
            console.log(`✅ Fetched detail for vehicle ${variant.id}:`, vehicleDetail);

            // Merge API data with existing car data
            return {
              ...variant,
              // Update with API data
              modelName: vehicleDetail.modelName,
              version: vehicleDetail.version,
              color: vehicleDetail.color,
              batteryCapacityKwh: vehicleDetail.batteryCapacityKwh,
              rangeKm: vehicleDetail.rangeKm,
              maxSpeedKmh: vehicleDetail.maxSpeedKmh,
              chargingTimeHours: vehicleDetail.chargingTimeHours,
              seatingCapacity: vehicleDetail.seatingCapacity,
              motorPowerKw: vehicleDetail.motorPowerKw,
              weightKg: vehicleDetail.weightKg,
              lengthMm: vehicleDetail.lengthMm,
              widthMm: vehicleDetail.widthMm,
              heightMm: vehicleDetail.heightMm,
              priceRetail: vehicleDetail.priceRetail,
              status: vehicleDetail.status,
              manufactureYear: (vehicleDetail as any).manufactureYear || new Date().getFullYear(),
              imageUrl: (vehicleDetail as any).imageUrl,
              // Keep existing display fields
              mark: vehicleDetail.modelName,
              model: vehicleDetail.version,
              price: vehicleDetail.priceRetail,
              img: (vehicleDetail as any).imageUrl || variant.img
            };
          } catch (error) {
            console.error(`❌ Error fetching detail for vehicle ${variant.id}:`, error);
            // Return original variant if API call fails
            return variant;
          }
        })
      );

      console.log('✅ All variants with detailed info:', detailedVariants);

      // Hide loading notification
      setNotification({ isVisible: false, message: '', type: 'info' });

      // Set selected car info with detailed data
      setSelectedCar({
        baseModel: clickedCar.mark,
        variantName: variantName,
        modelName: clickedCar.mark,
        version: clickedCar.model,
        variants: detailedVariants,
        totalVariants: detailedVariants.length
      });
      setSelectedColorIndex(0); // Reset to first color
      setShowViewCarModal(true);
    } catch (error) {
      console.error('❌ Error fetching car variants:', error);
      setNotification({
        isVisible: true,
        message: '❌ Không thể tải thông tin xe. Vui lòng thử lại.',
        type: 'error'
      });
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
        finalPrice: vehicleData.finalPrice || 0,
        status: vehicleData.status as 'AVAILABLE' | 'DISCONTINUED',
        manufactureYear: (vehicleData as any).manufactureYear || new Date().getFullYear()
      });

      setEditCarErrors({});
      // Set image preview/url for edit modal
  setEditCarImagePreview((vehicleData as any).imageUrl || '');
  setEditCarImageUrl((vehicleData as any).imageUrl || '');
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

      // Show success notification
      setNotification({
        isVisible: true,
        message: '✅ Đã thêm đại lý thành công!',
        type: 'success'
      });

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

      // Show success notification
      setNotification({
        isVisible: true,
        message: '✅ Đã cập nhật đại lý thành công!',
        type: 'success'
      });

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

  const handleDeleteDealer = (dealerId: number, dealerName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa đại lý',
      message: `Bạn có chắc chắn muốn xóa đại lý "${dealerName}"?\n\nHành động này không thể hoàn tác!`,
      type: 'danger',
      onConfirm: async () => {
    try {
      console.log('🗑️ Deleting dealer with ID:', dealerId);
          
          // Show loading notification
          setNotification({
            isVisible: true,
            message: '⏳ Đang xóa đại lý...',
            type: 'info'
          });

          const result = await deleteDealer(dealerId);
          
          if (result.success) {
      // Remove from dealers list
      setDealers(prev => prev.filter(d => d.dealerId !== dealerId));
      
            // Show success notification
            setNotification({
              isVisible: true,
              message: `✅ ${result.message}`,
              type: 'success'
            });
      
      console.log('✅ Dealer deleted successfully');
          } else {
            // Show error notification
            setNotification({
              isVisible: true,
              message: `❌ ${result.message}`,
              type: 'error'
            });
          }
    } catch (error) {
      console.error('❌ Error deleting dealer:', error);
          setNotification({
            isVisible: true,
            message: `❌ Không thể xóa đại lý "${dealerName}". ${error instanceof Error ? error.message : 'Vui lòng thử lại.'}`,
            type: 'error'
          });
        } finally {
          // Close confirm dialog
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleVerifyAccount = (userId: number, dealerName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác minh tài khoản đại lý',
      message: `Bạn có chắc chắn muốn xác minh tài khoản đại lý "${dealerName}"?\n\nSau khi xác minh, tài khoản sẽ được kích hoạt và có thể đăng nhập vào hệ thống.`,
      type: 'success',
      onConfirm: async () => {
        try {
          console.log('✅ Verifying account with user ID:', userId);
          
          // Set loading state
          setVerifyingUserId(userId);
          
          // Show loading notification
          setNotification({
            isVisible: true,
            message: '⏳ Đang xử lý xác minh...',
            type: 'info'
          });
          
          const result = await verifyAccount(userId);

          if (result.success) {
            console.log('✅ Account verified successfully, reloading data...');
            
            // Reload both lists from server to ensure sync
            try {
              // Reload unverified accounts (critical)
              const unverifiedList = await fetchUnverifiedAccounts();
              setUnverifiedAccounts(unverifiedList);
              
              // Reload dealers (optional, may fail with 401 if not admin)
              try {
                const dealerList = await fetchDealers();
                setDealers(dealerList);
                console.log('✅ Dealers reloaded:', dealerList.length);
              } catch (dealerError) {
                console.warn('⚠️ Could not reload dealers list (may not have permission):', dealerError);
                // This is OK - the important thing is removing from unverified list
              }
              
              console.log('✅ Unverified accounts reloaded:', unverifiedList.length);
              
              // Show success notification
              const message = result.alreadyVerified 
                ? `ℹ️ Tài khoản "${dealerName}" đã được xác minh trước đó. Danh sách đã được cập nhật.`
                : `✅ Đã xác minh tài khoản "${dealerName}" thành công! Email xác nhận đã được gửi.`;
              
              setNotification({
                isVisible: true,
                message,
                type: result.alreadyVerified ? 'info' : 'success'
              });
            } catch (reloadError) {
              console.error('❌ Error reloading unverified accounts:', reloadError);
              // Fallback: just remove from local state
              setUnverifiedAccounts(prev => prev.filter(account => account.userId !== userId));
              
              setNotification({
                isVisible: true,
                message: `✅ Đã xác minh tài khoản "${dealerName}". Danh sách đã được cập nhật cục bộ.`,
                type: 'success'
              });
            }
          } else {
            setNotification({
              isVisible: true,
              message: `❌ Xác minh thất bại: ${result.message}`,
              type: 'error'
            });
          }
        } catch (error) {
          console.error('❌ Error verifying account:', error);
          setNotification({
            isVisible: true,
            message: `❌ Không thể xác minh tài khoản "${dealerName}". ${error instanceof Error ? error.message : 'Vui lòng thử lại.'}`,
            type: 'error'
          });
        } finally {
          // Clear loading state
          setVerifyingUserId(null);
        }
      }
    });
  };

  return (
    <AdminLayout 
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as typeof activeTab)}
      counters={{
        cars: cars.length,
        colors: colors.length,
        dealers: dealers.length,
        unverifiedDealers: unverifiedAccounts.length,
        inventory: inventorySummary?.totalQuantity || 0,
        bookings: bookings.length,
        testDrives: 0
      }}
    >
      {/* Success Notification */}
      <SuccessNotification
        isVisible={notification.isVisible}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
        duration={notification.type === 'error' ? 8000 : 5000}
      />

      {/* Dashboard Content */}
      {activeTab === 'dashboard' && (
        <div className={sidebarStyles.statsGrid}>
          <div className={sidebarStyles.statCard}>
            <div className={sidebarStyles.statHeader}>
              <div className={sidebarStyles.statInfo}>
                <div className={sidebarStyles.statLabel}>Tổng số xe</div>
                <h2 className={sidebarStyles.statValue}>{cars.length}</h2>
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
                <div className={sidebarStyles.statLabel}>Đại lý</div>
                <h2 className={sidebarStyles.statValue}>{dealers.length}</h2>
              </div>
              <div className={`${sidebarStyles.statIcon} ${sidebarStyles.success}`}>
                <i className="fas fa-store"></i>
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
              {(() => {
                // Group cars by base model (modelName + version)
                const groupedCars = cars.reduce((acc, car) => {
                  const baseModel = `${car.mark} ${car.model}`;
                  if (!acc[baseModel]) {
                    acc[baseModel] = [];
                  }
                  acc[baseModel].push(car);
                  return acc;
                }, {} as Record<string, typeof cars>);

                // Render each group as a single card
                return Object.entries(groupedCars).map(([baseModel, variants], groupIndex) => {
                  // Get current selected color index for this group (default to 0)
                  const currentColorIdx = carGroupColorIndex[baseModel] || 0;
                  const currentCar = variants[currentColorIdx] || variants[0];

                  const allColors = variants.map(v => {
                    // Find matching color from colors array by color name
                    const colorName = v.color || 'Unknown';
                    const colorObj = colors.find(c =>
                      c.colorName.toLowerCase() === colorName.toLowerCase()
                    );

                    return {
                      name: colorName,
                      hex: colorObj?.hexCode || '#' + Math.floor(Math.random()*16777215).toString(16) // Fallback to random if not found
                    };
                  });

                  return (
                    <div key={groupIndex} className={`${styles.carCard} ${styles[currentCar.status]}`}>
                      <div className={styles.carStatus}>
                        <span className={`${styles.statusBadge} ${styles[currentCar.status]}`}>
                          {currentCar.status === 'available' && 'Có sẵn'}
                          {currentCar.status === 'rented' && 'Đang thuê'}
                          {currentCar.status === 'maintenance' && 'Bảo trì'}
                          {currentCar.status === 'unavailable' && 'Không khả dụng'}
                        </span>
                      </div>
                      <div className={styles.carImage}>
                        <img
                          src={currentCar.img}
                          alt={`${currentCar.name} - ${currentCar.color}`}
                          style={{
                            transition: 'opacity 0.3s ease'
                          }}
                        />
                      </div>
                      <div className={styles.carInfo}>
                        <h4>{baseModel}</h4>

                        {/* Color Variants Display */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '8px',
                          padding: '8px 0'
                        }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {variants.length} màu:
                          </span>
                          <div style={{
                            display: 'flex',
                            gap: '6px',
                            flexWrap: 'wrap'
                          }}>
                            {allColors.map((color, colorIdx) => (
                              <div
                                key={colorIdx}
                                title={color.name}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCarGroupColorIndex(prev => ({
                                    ...prev,
                                    [baseModel]: colorIdx
                                  }));
                                }}
                                style={{
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '50%',
                                  backgroundColor: color.hex,
                                  border: colorIdx === currentColorIdx
                                    ? '3px solid #ff4d30'
                                    : color.hex.toLowerCase() === '#f3f4f6' || color.hex.toLowerCase() === '#ffffff'
                                      ? '2px solid #e5e7eb'
                                      : '2px solid white',
                                  boxShadow: colorIdx === currentColorIdx
                                    ? '0 0 0 3px rgba(255, 77, 48, 0.2)'
                                    : '0 2px 6px rgba(0,0,0,0.15)',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  transform: colorIdx === currentColorIdx ? 'scale(1.15)' : 'scale(1)'
                                }}
                                onMouseEnter={(e) => {
                                  if (colorIdx !== currentColorIdx) {
                                    e.currentTarget.style.transform = 'scale(1.2)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = colorIdx === currentColorIdx ? 'scale(1.15)' : 'scale(1)';
                                  e.currentTarget.style.boxShadow = colorIdx === currentColorIdx
                                    ? '0 0 0 3px rgba(255, 77, 48, 0.2)'
                                    : '0 2px 6px rgba(0,0,0,0.15)';
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        <p className={styles.carDetails}>
                          {currentCar.mark} • {currentCar.year} • {currentCar.fuel}
                        </p>
                        <p className={styles.carPrice}>{formatCurrency(currentCar.price)}</p>
                      </div>
                      <div className={styles.carActions}>
                        <button
                          className={styles.viewButton}
                          title="Xem chi tiết"
                          onClick={() => handleViewCar(currentCar.id)}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          className={styles.editButton}
                          title="Chỉnh sửa"
                          onClick={() => handleEditCar(currentCar.id)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleDeleteCar(currentCar.id, currentCar.name)}
                          title="Xóa xe"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className={styles.usersManagement}>
            <div className={styles.sectionHeader}>
              <h3>Kho Hàng - {inventorySummary?.manufacturerName || 'EDrive'}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className={styles.inventorySummary}>
                  <div className={styles.summaryBadge}>
                    <i className="fas fa-warehouse"></i>
                    <span>Tổng số lượng: <strong>{inventorySummary?.totalQuantity || 0}</strong> xe</span>
                  </div>
                  <div className={styles.summaryBadge}>
                    <i className="fas fa-car"></i>
                    <span>Số loại xe: <strong>{inventorySummary?.vehicles.length || 0}</strong></span>
                  </div>
                </div>
                <button
                  className={styles.addButton}
                  onClick={() => {
                    setNewInventory({ vehicleId: 0, quantity: 0 });
                    setNewInventoryErrors({});
                    setShowAddInventoryModal(true);
                  }}
                >
                  <i className="fas fa-plus"></i>
                  Thêm tồn kho
                </button>
              </div>
            </div>

            <div className={styles.usersTable}>
              <table>
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Vehicle ID</th>
                    <th>Tên xe</th>
                    <th>Số lượng tồn kho</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {!inventorySummary || inventorySummary.vehicles.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                        <i className="fas fa-inbox" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}></i>
                        <p>Không có dữ liệu trong kho</p>
                      </td>
                    </tr>
                  ) : (
                    inventorySummary.vehicles.map((vehicle, index) => (
                      <tr key={vehicle.vehicleId}>
                        <td>{index + 1}</td>
                        <td>
                          <div style={{fontWeight: '600', color: '#ff4d30'}}>#{vehicle.vehicleId}</div>
                        </td>
                        <td>
                          <div style={{fontSize: '15px', fontWeight: 700}}>{formatVehicleDisplayName(vehicle)}</div>
                        </td>
                        <td>
                          <div style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: vehicle.quantity > 50 ? '#d1fae5' : vehicle.quantity > 20 ? '#fef3c7' : '#fee2e2',
                            color: vehicle.quantity > 50 ? '#065f46' : vehicle.quantity > 20 ? '#92400e' : '#991b1b',
                            fontWeight: 700,
                            fontSize: '14px'
                          }}>
                            {vehicle.quantity} xe
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${vehicle.quantity > 20 ? styles.active : vehicle.quantity > 0 ? styles.warning : styles.inactive}`}>
                            {vehicle.quantity > 20 ? 'Còn hàng' : vehicle.quantity > 0 ? 'Sắp hết' : 'Hết hàng'}
                          </span>
                        </td>
                        <td>
                          <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                            <button
                              className={styles.viewButton}
                              title="Xem chi tiết"
                              onClick={() => {
                                setSelectedInventoryItem(vehicle);
                                setShowViewInventoryModal(true);
                              }}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className={styles.editButton}
                              title="Chỉnh sửa"
                              onClick={() => {
                                setEditingInventoryItem(vehicle);
                                setEditInventory({ quantity: vehicle.quantity });
                                setEditInventoryErrors({});
                                setShowEditInventoryModal(true);
                              }}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className={styles.deleteButton}
                              title="Xóa"
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Xác nhận xóa',
                                  message: `Bạn có chắc chắn muốn xóa tồn kho của xe "${formatVehicleDisplayName(vehicle)}"?`,
                                  type: 'danger',
                                  onConfirm: async () => {
                                    try {
                                      await deleteInventoryRecord(vehicle.vehicleId);
                                      setNotification({
                                        isVisible: true,
                                        message: 'Xóa tồn kho thành công!',
                                        type: 'success'
                                      });
                                      await reloadInventory();
                                    } catch (error) {
                                      console.error('Delete error:', error);
                                      setNotification({
                                        isVisible: true,
                                        message: 'Xóa tồn kho thất bại!',
                                        type: 'error'
                                      });
                                    }
                                  }
                                });
                              }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'discounts' && (
          <div className={styles.usersManagement}>
            <div className={styles.sectionHeader}>
              <h3>Chính sách chiết khấu</h3>
              <button
                className={styles.addButton}
                onClick={() => {
                  setNewDiscount({
                    minQuantity: 0,
                    maxQuantity: 0,
                    discountRate: 0,
                    description: '',
                    isActive: true
                  });
                  setNewDiscountErrors({});
                  setShowAddDiscountModal(true);
                }}
              >
                <i className="fas fa-plus"></i>
                Thêm chiết khấu mới
              </button>
            </div>

            <div className={styles.usersTable}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Mô tả</th>
                    <th>Số lượng</th>
                    <th>Tỷ lệ giảm giá</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {(!discounts || !Array.isArray(discounts) || discounts.length === 0) ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                        <i className="fas fa-percentage" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}></i>
                        <p>Chưa có chính sách chiết khấu nào</p>
                      </td>
                    </tr>
                  ) : (
                    discounts.map((discount) => (
                      <tr key={discount.id}>
                        <td>
                          <div style={{fontWeight: '600', color: '#ff4d30'}}>#{discount.id}</div>
                        </td>
                        <td>
                          <div style={{fontSize: '15px', fontWeight: 700}}>{discount.description}</div>
                        </td>
                        <td>
                          <div style={{fontSize: '14px', color: '#555'}}>
                            {discount.minQuantity === discount.maxQuantity
                              ? `${discount.minQuantity} xe`
                              : discount.maxQuantity >= 2147483647
                                ? `${discount.minQuantity}+ xe`
                                : `${discount.minQuantity} - ${discount.maxQuantity} xe`
                            }
                          </div>
                        </td>
                        <td>
                          <div style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: '#d1fae5',
                            color: '#065f46',
                            fontWeight: 700,
                            fontSize: '14px'
                          }}>
                            {(discount.discountRate * 100).toFixed(2)}%
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${discount.isActive ? styles.active : styles.inactive}`}>
                            {discount.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                          </span>
                        </td>
                        <td>
                          <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                            <button
                              className={styles.viewButton}
                              title="Xem chi tiết"
                              onClick={() => {
                                setSelectedDiscount(discount);
                                setShowViewDiscountModal(true);
                              }}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className={styles.editButton}
                              title="Chỉnh sửa"
                              onClick={() => {
                                setEditingDiscount(discount);
                                setEditDiscount({
                                  minQuantity: discount.minQuantity,
                                  maxQuantity: discount.maxQuantity,
                                  discountRate: discount.discountRate,
                                  description: discount.description,
                                  isActive: discount.isActive
                                });
                                setEditDiscountErrors({});
                                setShowEditDiscountModal(true);
                              }}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className={styles.deleteButton}
                              title="Xóa"
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Xác nhận xóa',
                                  message: `Bạn có chắc chắn muốn xóa chính sách "${discount.description}"?`,
                                  type: 'danger',
                                  onConfirm: async () => {
                                    try {
                                      await deleteDiscountPolicy(discount.id);
                                      setNotification({
                                        isVisible: true,
                                        message: 'Xóa chính sách chiết khấu thành công!',
                                        type: 'success'
                                      });
                                      await reloadDiscounts();
                                    } catch (error) {
                                      console.error('Delete error:', error);
                                      setNotification({
                                        isVisible: true,
                                        message: 'Xóa chính sách chiết khấu thất bại!',
                                        type: 'error'
                                      });
                                    }
                                  }
                                });
                              }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'colors' && (
          <div className={styles.usersManagement}>
            <div className={styles.sectionHeader}>
              <h3>Quản lý màu xe</h3>
              <button
                className={styles.addButton}
                onClick={() => {
                  setNewColor({ colorName: '', hexCode: '#000000' });
                  setNewColorErrors({});
                  setShowAddColorModal(true);
                }}
              >
                <i className="fas fa-plus"></i>
                Thêm màu mới
              </button>
            </div>

            <div className={styles.usersTable}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Màu</th>
                    <th>Tên màu</th>
                    <th>Mã màu</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {colors.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                        <i className="fas fa-palette" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}></i>
                        <p>Chưa có màu xe nào</p>
                      </td>
                    </tr>
                  ) : (
                    colors.map((color) => (
                      <tr key={color.colorId}>
                        <td>
                          <div style={{fontWeight: '600', color: '#ff4d30'}}>#{color.colorId}</div>
                        </td>
                        <td>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            backgroundColor: color.hexCode,
                            border: '2px solid #ddd',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}></div>
                        </td>
                        <td>
                          <div style={{fontSize: '15px', fontWeight: 700}}>{color.colorName}</div>
                        </td>
                        <td>
                          <code style={{
                            background: '#f3f4f6',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontFamily: 'monospace'
                          }}>{color.hexCode}</code>
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${(color.inUse ?? color.isActive) ? styles.active : styles.inactive}`}>
                            {(color.inUse ?? color.isActive) ? 'Đang dùng' : 'Ngừng dùng'}
                          </span>
                        </td>
                        <td>
                          <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                            <button
                              className={styles.viewButton}
                              title="Xem chi tiết"
                              onClick={() => {
                                setSelectedColor(color);
                                setShowViewColorModal(true);
                              }}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className={styles.editButton}
                              title="Chỉnh sửa"
                              onClick={() => {
                                setEditingColor(color);
                                setEditColor({
                                  colorName: color.colorName,
                                  hexCode: color.hexCode,
                                  isActive: color.inUse ?? color.isActive
                                });
                                setEditColorErrors({});
                                setShowEditColorModal(true);
                              }}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className={styles.deleteButton}
                              title="Xóa"
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Xác nhận xóa',
                                  message: `Bạn có chắc muốn xóa màu "${color.colorName}"?`,
                                  type: 'danger',
                                  onConfirm: async () => {
                                    try {
                                      await deleteColor(color.colorId);
                                      setColors(colors.filter(c => c.colorId !== color.colorId));
                                      setNotification({
                                        isVisible: true,
                                        message: 'Đã xóa màu xe thành công!',
                                        type: 'success'
                                      });
                                    } catch (error) {
                                      setNotification({
                                        isVisible: true,
                                        message: 'Lỗi khi xóa màu xe!',
                                        type: 'error'
                                      });
                                    }
                                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                  }
                                });
                              }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'dealers' && (
          <div className={styles.usersManagement}>
            <div className={styles.sectionHeader}>
              <h3>Quản lý đại lý</h3>
              <div className={styles.filterButtons}>
              <button 
                  className={`${styles.filterButton} ${dealerViewMode === 'verified' ? styles.active : ''}`}
                  onClick={() => setDealerViewMode('verified')}
                >
                  Đã xác minh ({dealers.length})
                </button>
                <button 
                  className={`${styles.filterButton} ${dealerViewMode === 'unverified' ? styles.active : ''}`}
                  onClick={() => setDealerViewMode('unverified')}
                >
                  Chờ xác minh ({unverifiedAccounts.length})
              </button>
              </div>
            </div>

            {dealerViewMode === 'verified' ? (
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
            ) : (
              <div className={styles.usersTable}>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tên đại lý</th>
                      <th colSpan={3}>Địa chỉ đầy đủ</th>
                      <th>Người liên hệ</th>
                      <th>SĐT</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unverifiedAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                          <i className="fas fa-inbox" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}></i>
                          <p>Không có tài khoản nào đang chờ xác minh</p>
                        </td>
                      </tr>
                    ) : (
                      unverifiedAccounts.map(account => (
                        <tr key={account.userId}>
                          <td>#{account.userId}</td>
                          <td>
                            <div style={{fontWeight: 'bold'}}>{account.dealerName}</div>
                            <div style={{fontSize: '11px', color: '#888'}}>@{account.username}</div>
                          </td>
                          <td colSpan={3}>
                            <div style={{fontSize: '13px'}}>{account.dealerAddress}</div>
                            {account.registrationDate && (
                              <div style={{fontSize: '11px', color: '#888', marginTop: '4px'}}>
                                Đăng ký: {new Date(account.registrationDate).toLocaleDateString('vi-VN')}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{fontSize: '13px'}}>{account.fullName}</div>
                            <div style={{fontSize: '11px', color: '#888'}}>{account.email}</div>
                          </td>
                          <td>{account.phone}</td>
                          <td>
                            <div className={styles.tableActions}>
                              <button 
                                className={styles.viewButton} 
                                title="Xem chi tiết"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button 
                                className={styles.approveButton} 
                                title="Xác minh"
                                onClick={() => handleVerifyAccount(account.userId, account.dealerName)}
                                disabled={verifyingUserId === account.userId}
                              >
                                {verifyingUserId === account.userId ? (
                                  <i className="fas fa-spinner fa-spin"></i>
                                ) : (
                                  <i className="fas fa-check"></i>
                                )}
                              </button>
                              <button
                                className={styles.deleteButton}
                                title="Từ chối"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
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
                  Đang xử lý ({bookings.filter(b => b.status === 'processing' || b.status === 'shipped').length})
                </button>
                <button className={styles.filterButton}>
                  Đã giao ({bookings.filter(b => b.status === 'delivered').length})
                </button>
              </div>
            </div>

            <div className={styles.bookingsTable}>
              <table>
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Đại lý</th>
                    <th>Xe</th>
                    <th>Ngày đặt</th>
                    <th>Ngày giao dự kiến</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Thanh toán</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(booking => (
                    <tr key={booking.id}>
                      <td title={String(booking.id)}>
                        #{typeof booking.id === 'string' ? booking.id.substring(0, 8) + '...' : booking.id}
                      </td>
                      <td>{booking.dealerName}</td>
                      <td>{booking.carName}</td>
                      <td>{booking.startDate}</td>
                      <td>{booking.endDate}</td>
                      <td>{formatCurrency(booking.totalAmount)}</td>
                      <td>
                        <select
                          className={`${styles.orderStatusDropdown} ${styles[booking.status || 'pending']}`}
                          value={booking.status?.toUpperCase() || 'PENDING'}
                          onChange={(e) => handleUpdateOrderStatus(booking.id, e.target.value as any)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="PENDING">Chờ duyệt</option>
                          <option value="CONFIRMED">Đã xác nhận</option>
                          <option value="CANCELLED">Hủy đơn hàng</option>
                        </select>
                      </td>
                      <td>
                        <select
                          className={`${styles.paymentStatusDropdown} ${styles[booking.paymentStatus || 'pending']}`}
                          value={booking.paymentStatus?.toUpperCase() || 'PENDING'}
                          onChange={(e) => handleUpdatePaymentStatus(booking.id, e.target.value as any)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="PENDING">Chờ thanh toán</option>
                          <option value="PAID">Đã thanh toán</option>
                          <option value="CANCELLED">Đã hủy</option>
                        </select>
                      </td>
                      <td>
                        <div className={styles.tableActions}>
                          <button 
                            className={styles.viewButton} 
                            title="Xem chi tiết"
                            onClick={() => handleViewOrderDetail(booking.id)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className={styles.contractButton}
                            title={hasContract(String(booking.id)) ? "📄 Tải PDF hợp đồng" : "📝 Tạo hợp đồng mới"}
                            onClick={() => handleContractAction(booking.id)}
                            style={{
                              backgroundColor: hasContract(String(booking.id)) ? '#10b981' : '#6366f1'
                            }}
                          >
                            <i className={hasContract(String(booking.id)) ? "fas fa-file-pdf" : "fas fa-file-contract"}></i>
                          </button>
                          <button 
                            className={styles.billButton}
                            title="Xem hóa đơn"
                            onClick={() => handleViewBill(booking.id)}
                          >
                            <i className="fas fa-file-invoice"></i>
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

        {/* Order Detail Modal */}
        {showOrderDetail && (
          <div className={modalStyles.modalOverlay} onClick={() => setShowOrderDetail(false)}>
            <div className={modalStyles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={modalStyles.modalHeader}>
                <h2>
                  <i className="fas fa-file-invoice"></i>
                  Chi tiết đơn hàng
                </h2>
                <button 
                  onClick={() => setShowOrderDetail(false)} 
                  className={modalStyles.closeBtn}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className={modalStyles.modalBody}>
                {loadingOrderDetail ? (
                  <div className={modalStyles.loading}>
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Đang tải thông tin đơn hàng...</p>
                  </div>
                ) : selectedOrder ? (
                  <>
                    {/* Order Info Section */}
                    <div className={modalStyles.detailSection}>
                      <h3><i className="fas fa-info-circle"></i> Thông tin đơn hàng</h3>
                      <div className={modalStyles.infoGrid}>
                        <div className={modalStyles.infoRow}>
                          <span className={modalStyles.label}>Mã đơn hàng:</span>
                          <span className={modalStyles.value} title={String(selectedOrder.orderId)}>
                            #{typeof selectedOrder.orderId === 'string' 
                              ? selectedOrder.orderId.substring(0, 12) + '...' 
                              : selectedOrder.orderId}
                          </span>
                        </div>
                        <div className={modalStyles.infoRow}>
                          <span className={modalStyles.label}>Đại lý:</span>
                          <span className={modalStyles.value}>{selectedOrder.dealerName || 'N/A'}</span>
                        </div>
                        <div className={modalStyles.infoRow}>
                          <span className={modalStyles.label}>Ngày đặt:</span>
                          <span className={modalStyles.value}>{selectedOrder.orderDate || 'N/A'}</span>
                        </div>
                        <div className={modalStyles.infoRow}>
                          <span className={modalStyles.label}>Ngày giao dự kiến:</span>
                          <span className={modalStyles.value}>{selectedOrder.desiredDeliveryDate}</span>
                        </div>
                        <div className={modalStyles.infoRow}>
                          <span className={modalStyles.label}>Trạng thái đơn hàng:</span>
                          <span className={`${modalStyles.badge} ${modalStyles[selectedOrder.orderStatus.toLowerCase()]}`}>
                            {selectedOrder.orderStatus}
                          </span>
                        </div>
                        <div className={modalStyles.infoRow}>
                          <span className={modalStyles.label}>Trạng thái thanh toán:</span>
                          <span className={`${modalStyles.badge} ${modalStyles[selectedOrder.paymentStatus.toLowerCase()]}`}>
                            {selectedOrder.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items Section */}
                    {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 && (
                      <div className={modalStyles.detailSection}>
                        <h3><i className="fas fa-car"></i> Danh sách xe</h3>
                        <table className={modalStyles.itemsTable}>
                          <thead>
                            <tr>
                              <th>Tên xe</th>
                              <th>Số lượng</th>
                              <th>Đơn giá</th>
                              <th>Tạm tính</th>
                              <th>Chiết khấu</th>
                              <th>Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrder.orderItems.map((item, index) => (
                              <tr key={index}>
                                <td>{item.vehicleName}</td>
                                <td>{item.quantity}</td>
                                <td>{formatCurrency(item.unitPrice)}</td>
                                <td>{formatCurrency(item.itemSubtotal)}</td>
                                <td className={modalStyles.discount}>-{formatCurrency(item.itemDiscount)}</td>
                                <td><strong>{formatCurrency(item.itemTotal)}</strong></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pricing Summary Section */}
                    <div className={modalStyles.detailSection}>
                      <h3><i className="fas fa-calculator"></i> Tổng quan thanh toán</h3>
                      <div className={modalStyles.pricingSummary}>
                        <div className={modalStyles.priceRow}>
                          <span>Tạm tính:</span>
                          <span>{formatCurrency(selectedOrder.subtotal)}</span>
                        </div>
                        {selectedOrder.dealerDiscount > 0 && (
                          <div className={modalStyles.priceRow}>
                            <span>Chiết khấu đại lý:</span>
                            <span className={modalStyles.discount}>-{formatCurrency(selectedOrder.dealerDiscount)}</span>
                          </div>
                        )}
                        <div className={modalStyles.priceRow}>
                          <span>VAT (10%):</span>
                          <span>{formatCurrency(selectedOrder.vatAmount)}</span>
                        </div>
                        <div className={`${modalStyles.priceRow} ${modalStyles.total}`}>
                          <strong>Tổng cộng:</strong>
                          <strong className={modalStyles.totalPrice}>{formatCurrency(selectedOrder.grandTotal)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Info Section */}
                    <div className={modalStyles.detailSection}>
                      <h3><i className="fas fa-truck"></i> Thông tin giao hàng</h3>
                      <div className={modalStyles.deliveryInfo}>
                        <div className={modalStyles.infoRow}>
                          <span className={modalStyles.label}>Địa chỉ:</span>
                          <span className={modalStyles.value}>{selectedOrder.deliveryAddress}</span>
                        </div>
                        {selectedOrder.deliveryNote && (
                          <div className={modalStyles.infoRow}>
                            <span className={modalStyles.label}>Ghi chú:</span>
                            <span className={modalStyles.value}>{selectedOrder.deliveryNote}</span>
                          </div>
                        )}
                        {selectedOrder.actualDeliveryDate && (
                          <div className={modalStyles.infoRow}>
                            <span className={modalStyles.label}>Ngày giao thực tế:</span>
                            <span className={modalStyles.value}>{selectedOrder.actualDeliveryDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={modalStyles.error}>
                    <i className="fas fa-exclamation-triangle"></i>
                    <p>Không thể tải thông tin đơn hàng</p>
                  </div>
                )}
              </div>

              <div className={modalStyles.modalFooter}>
                <button 
                  onClick={() => setShowOrderDetail(false)} 
                  className={modalStyles.closeButton}
                >
                  Đóng
                </button>
              </div>
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
                      setColorImages({});
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formColumn}>
                    <div className={styles.settingItem}>
                      <label>Tên dòng xe</label>
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
                      <label>
                        <i className="fas fa-palette" style={{ marginRight: '8px', color: '#ff4d30' }}></i>
                        Chọn màu xe ({newCar.colorIds.length}/{colors.length} màu)
                      </label>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        padding: '12px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: newCarErrors.colorIds ? '2px solid red' : '2px solid #e2e8f0',
                        maxHeight: '300px',
                        overflowY: 'auto'
                      }}>
                        {colors.length === 0 ? (
                          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', padding: '20px' }}>
                            <i className="fas fa-exclamation-circle" style={{ marginRight: '6px' }}></i>
                            Chưa có màu nào. Vui lòng thêm màu trong tab "Quản lý màu" trước.
                          </div>
                        ) : (
                          colors.map((color) => {
                            const isSelected = newCar.colorIds.includes(color.colorId);
                            return (
                              <label
                                key={color.colorId}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '10px 12px',
                                  background: isSelected ? 'rgba(255, 77, 48, 0.05)' : '#ffffff',
                                  border: isSelected ? '2px solid #ff4d30' : '2px solid #e2e8f0',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  userSelect: 'none'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.background = '#f1f5f9';
                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.background = '#ffffff';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                  }
                                }}
                              >
                                {/* Checkbox */}
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    // Toggle color selection
                                    const newColorIds = e.target.checked
                                      ? [...newCar.colorIds, color.colorId]
                                      : newCar.colorIds.filter(id => id !== color.colorId);
                                    setNewCar({ ...newCar, colorIds: newColorIds });
                                    // Validate
                                    const error = newColorIds.length === 0 ? 'Vui lòng chọn ít nhất 1 màu' : '';
                                    setNewCarErrors(prev => ({ ...prev, colorIds: error }));
                                  }}
                                  style={{
                                    width: '18px',
                                    height: '18px',
                                    cursor: 'pointer',
                                    accentColor: '#ff4d30'
                                  }}
                                />

                                {/* Color Dot */}
                                <div
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    backgroundColor: color.hexCode,
                                    border: color.hexCode === '#F3F4F6' || color.hexCode === '#FFFFFF'
                                      ? '2px solid #E5E7EB'
                                      : '2px solid #e2e8f0',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    flexShrink: 0
                                  }}
                                />

                                {/* Color Name & Hex Code */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{
                                    fontSize: '14px',
                                    fontWeight: isSelected ? '600' : '500',
                                    color: isSelected ? '#ff4d30' : '#1e293b'
                                  }}>
                                    {color.colorName}
                                  </span>
                                  <span style={{
                                    fontSize: '12px',
                                    color: '#64748b'
                                  }}>
                                    {color.hexCode}
                                  </span>
                                </div>

                                {/* Selected Badge */}
                                {isSelected && (
                                  <div style={{
                                    padding: '4px 10px',
                                    background: '#ff4d30',
                                    color: 'white',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <i className="fas fa-check" style={{ fontSize: '10px' }}></i>
                                    Đã chọn
                                  </div>
                                )}
                              </label>
                            );
                          })
                        )}
                      </div>
                      {newCarErrors.colorIds && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '8px', display: 'block' }}>
                          ⚠️ {newCarErrors.colorIds}
                        </span>
                      )}
                      {newCar.colorIds.length > 0 && (
                        <div style={{
                          marginTop: '12px',
                          padding: '12px',
                          background: 'linear-gradient(135deg, #fff5f5 0%, #fff1f1 100%)',
                          borderRadius: '8px',
                          border: '1px solid #fecaca'
                        }}>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#991b1b',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <i className="fas fa-check-circle"></i>
                            Đã chọn {newCar.colorIds.length} màu:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {newCar.colorIds.map(id => {
                              const selectedColor = colors.find(c => c.colorId === id);
                              if (!selectedColor) return null;
                              return (
                                <div
                                  key={id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 10px',
                                    background: 'white',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e7eb',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    color: '#374151'
                                  }}
                                >
                                  <div
                                    style={{
                                      width: '16px',
                                      height: '16px',
                                      borderRadius: '50%',
                                      backgroundColor: selectedColor.hexCode,
                                      border: '1px solid #d1d5db',
                                      flexShrink: 0
                                    }}
                                  />
                                  {selectedColor.colorName}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Quãng đường (km)</label>
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
                  </div>

                  <div className={styles.formColumn}>
                    <div className={styles.settingItem}>
                      <label>Phiên bản</label>
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
                      <label>Dung lượng pin (kWh) <span style={{color: '#888', fontSize: '0.85em'}}>(5-300 kWh)</span></label>
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
                        min="5"
                        max="300"
                        placeholder="5-300 kWh"
                        style={newCarErrors.batteryCapacityKwh ? { borderColor: 'red' } : {}}
                      />
                      {newCarErrors.batteryCapacityKwh && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {newCarErrors.batteryCapacityKwh}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Tốc độ tối đa (km/h) <span style={{color: '#888', fontSize: '0.85em'}}>(10-500 km/h)</span></label>
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
                        min="10"
                        max="500"
                        placeholder="10-500 km/h"
                        style={newCarErrors.maxSpeedKmh ? { borderColor: 'red' } : {}}
                      />
                      {newCarErrors.maxSpeedKmh && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {newCarErrors.maxSpeedKmh}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Số chỗ ngồi <span style={{color: '#888', fontSize: '0.85em'}}>(1-12 chỗ)</span></label>
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
                        min="1"
                        max="12"
                        placeholder="Từ 1-12 chỗ"
                        style={newCarErrors.seatingCapacity ? { borderColor: 'red' } : {}}
                      />
                      {newCarErrors.seatingCapacity && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {newCarErrors.seatingCapacity}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Thời gian sạc (giờ) <span style={{color: '#888', fontSize: '0.85em'}}>(0.1-72 giờ)</span></label>
                      <input
                        type="number"
                        step="0.1"
                        className={styles.settingInput}
                        value={newCar.chargingTimeHours || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value || '0');
                          setNewCar({ ...newCar, chargingTimeHours: value });
                          const error = validateCarField('chargingTimeHours', value);
                          setNewCarErrors(prev => ({ ...prev, chargingTimeHours: error }));
                        }}
                        min="0.1"
                        max="72"
                        placeholder="0.1-72 giờ"
                        style={newCarErrors.chargingTimeHours ? { borderColor: 'red' } : {}}
                      />
                      {newCarErrors.chargingTimeHours && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {newCarErrors.chargingTimeHours}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Công suất động cơ (kW)</label>
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
                      <label>Chiều dài (mm)</label>
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
                      <label>Chiều rộng (mm)</label>
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
                      <label>Chiều cao (mm)</label>
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
                      <label>Trọng lượng (kg)</label>
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
                    <div className={styles.settingItem}>
                      <label>Năm sản xuất</label>
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
                      <label>Giá bán (VND)</label>
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
                      <label>Trạng thái</label>
                      <select
                        className={styles.settingInput}
                        value={newCar.status}
                        onChange={(e) => setNewCar({ ...newCar, status: e.target.value as 'AVAILABLE' | 'DISCONTINUED' })}
                      >
                        <option value="AVAILABLE">Có sẵn</option>
                        <option value="DISCONTINUED">Ngừng kinh doanh</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Image Upload Section for Each Selected Color */}
                {newCar.colorIds.length > 0 && (
                  <div style={{
                    marginTop: '32px',
                    padding: '24px',
                    background: 'linear-gradient(135deg, #fff9f5 0%, #fff5f0 100%)',
                    borderRadius: '16px',
                    border: '2px solid #ffcbb5'
                  }}>
                    <h4 style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#ff4d30',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <i className="fas fa-images"></i>
                      Upload hình ảnh cho từng màu ({newCar.colorIds.length} màu)
                    </h4>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: '20px'
                    }}>
                      {newCar.colorIds.map((colorId) => {
                        const color = colors.find(c => c.colorId === colorId);
                        if (!color) return null;

                        const imageData = colorImages[colorId] || { imageUrl: '', imagePreview: '' };

                        return (
                          <div
                            key={colorId}
                            style={{
                              padding: '16px',
                              background: 'white',
                              borderRadius: '12px',
                              border: '2px solid #e2e8f0',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                            }}
                          >
                            {/* Color Header */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              marginBottom: '12px',
                              paddingBottom: '12px',
                              borderBottom: '2px solid #f1f5f9'
                            }}>
                              <div
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  backgroundColor: color.hexCode,
                                  border: '2px solid #e2e8f0',
                                  flexShrink: 0
                                }}
                              />
                              <span style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#1e293b'
                              }}>
                                {color.colorName}
                              </span>
                            </div>

                            {/* Image URL Input */}
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#64748b',
                                display: 'block',
                                marginBottom: '6px'
                              }}>
                                <i className="fas fa-link" style={{ marginRight: '6px' }}></i>
                                Link hình ảnh
                              </label>
                              <input
                                type="text"
                                className={styles.settingInput}
                                value={imageData.imageUrl}
                                placeholder="https://..."
                                onChange={(e) => {
                                  const url = e.target.value;
                                  setColorImages(prev => ({
                                    ...prev,
                                    [colorId]: {
                                      imageUrl: url,
                                      imagePreview: url.trim() || prev[colorId]?.imagePreview || ''
                                    }
                                  }));
                                }}
                                style={{ fontSize: '13px', padding: '8px 12px' }}
                              />
                            </div>

                            {/* OR Divider */}
                            <div style={{
                              position: 'relative',
                              textAlign: 'center',
                              margin: '12px 0'
                            }}>
                              <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: 0,
                                right: 0,
                                height: '1px',
                                background: '#e2e8f0',
                                zIndex: 0
                              }}></div>
                              <span style={{
                                position: 'relative',
                                background: 'white',
                                padding: '0 12px',
                                color: '#94a3b8',
                                fontSize: '11px',
                                fontWeight: '600',
                                zIndex: 1
                              }}>HOẶC</span>
                            </div>

                            {/* File Upload */}
                            <div>
                              <label style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#64748b',
                                display: 'block',
                                marginBottom: '6px'
                              }}>
                                <i className="fas fa-upload" style={{ marginRight: '6px' }}></i>
                                Upload từ máy
                              </label>
                              <div style={{
                                position: 'relative',
                                border: '2px dashed #cbd5e1',
                                borderRadius: '8px',
                                padding: '20px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: imageData.imagePreview ? 'transparent' : '#f8fafc'
                              }}>
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    opacity: 0,
                                    cursor: 'pointer'
                                  }}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      // Validate file type
                                      if (!file.type.startsWith('image/')) {
                                        alert('❌ Vui lòng chọn file ảnh (JPG, PNG, etc.)');
                                        return;
                                      }
                                      
                                      // Validate file size (max 5MB before compression)
                                      if (file.size > 5 * 1024 * 1024) {
                                        alert('❌ File ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.');
                                        return;
                                      }
                                      
                                      // Show loading
                                      console.log('🔄 Compressing image...');
                                      
                                      // Compress image
                                      compressImage(file)
                                        .then((compressedBase64) => {
                                          setColorImages(prev => ({
                                            ...prev,
                                            [colorId]: {
                                              imageUrl: '',
                                              imagePreview: compressedBase64
                                            }
                                          }));
                                          console.log('✅ Image uploaded and compressed successfully');
                                        })
                                        .catch((error) => {
                                          console.error('❌ Image compression error:', error);
                                          alert(`❌ ${error.message}`);
                                        });
                                    }
                                  }}
                                />
                                {imageData.imagePreview ? (
                                  <div style={{ position: 'relative' }}>
                                    <img
                                      src={imageData.imagePreview}
                                      alt={color.colorName}
                                      style={{
                                        width: '100%',
                                        height: '150px',
                                        objectFit: 'cover',
                                        borderRadius: '8px'
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setColorImages(prev => {
                                          const newImages = { ...prev };
                                          delete newImages[colorId];
                                          return newImages;
                                        });
                                      }}
                                      style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: 'rgba(239, 68, 68, 0.9)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px'
                                      }}
                                    >
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <i className="fas fa-image" style={{
                                      fontSize: '24px',
                                      color: '#cbd5e1',
                                      marginBottom: '8px'
                                    }}></i>
                                    <p style={{
                                      fontSize: '12px',
                                      color: '#64748b',
                                      margin: 0
                                    }}>Click để chọn ảnh</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                      setShowAddCarModal(false);
                      setNewCarErrors({});
                      setColorImages({});
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
                      // Validate color selection
                      if (newCar.colorIds.length === 0) {
                        errors.colorIds = 'Vui lòng chọn ít nhất 1 màu';
                      }
                      
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

                      // Chuẩn bị dữ liệu để gửi lên API theo format mới
                      // Build colors array với colorId và imageUrl cho từng màu
                      try {
                        const colorsArray = newCar.colorIds.map(colorId => {
                          const imageData = colorImages[colorId];
                          // Priority: URL nhập tay > base64 upload > empty string
                          let imageUrl = imageData?.imageUrl?.trim() || imageData?.imagePreview || '';
                          
                          // Validate image URL length (max 1024 chars for database)
                          if (imageUrl.length > 1024) {
                            console.warn(`⚠️ Image URL too long for color ${colorId}: ${imageUrl.length} chars`);
                            // Truncate or show error
                            throw new Error(`Hình ảnh cho màu ID ${colorId} quá lớn (${(imageUrl.length / 1024).toFixed(2)} KB). Vui lòng chọn ảnh nhỏ hơn.`);
                          }

                          return {
                            colorId: colorId,
                            imageUrl: imageUrl
                          };
                        });

                      const vehicleData = {
                        modelName: newCar.modelName.trim(),
                        version: newCar.version.trim(),
                        colors: colorsArray, // New format: array of {colorId, imageUrl}
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
                        finalPrice: newCar.finalPrice,
                        status: newCar.status,
                        manufactureYear: newCar.manufactureYear
                      };

                      console.log('🚗 Creating vehicle with NEW API format:', vehicleData);
                      console.log('🎨 Colors with images:', colorsArray);

                      // Gửi lên API để lưu vào database
                      const apiResponse = await createVehicle(vehicleData);

                      // API trả về: { statusCode: 201, message: "Vehicles created", data: [...] }
                      console.log('📦 API Response:', apiResponse);

                      // Xử lý response dựa trên type
                      let createdVehicles: any[] = [];

                      if ('data' in apiResponse && Array.isArray(apiResponse.data)) {
                        // Format: CreateVehiclesResponse { statusCode, message, data: [...] }
                        createdVehicles = apiResponse.data;
                        console.log(`✅ Response format: CreateVehiclesResponse với ${createdVehicles.length} xe`);
                      } else if (Array.isArray(apiResponse)) {
                        // Format: Array of VehicleApiResponse
                        createdVehicles = apiResponse;
                        console.log(`✅ Response format: VehicleApiResponse[] với ${createdVehicles.length} xe`);
                      } else if ('vehicleId' in apiResponse) {
                        // Format: Single VehicleApiResponse
                        createdVehicles = [apiResponse];
                        console.log('✅ Response format: Single VehicleApiResponse');
                      }

                      if (createdVehicles.length === 0) {
                        throw new Error('API không trả về danh sách xe');
                      }

                      // Tạo danh sách xe mới từ API response
                      const newCars: CarWithStatus[] = createdVehicles.map((createdVehicle: any) => {
                        // Tìm màu tương ứng để lấy thông tin màu
                        const colorName = createdVehicle.color || 'Unknown';
                        const matchingColor = colors.find(c => c.colorName === colorName);

                        // Lấy ảnh từ colorImages dựa trên colorId nếu có
                        let vehicleImage = createdVehicle.imageUrl;
                        if (matchingColor && colorImages[matchingColor.colorId]) {
                          vehicleImage = colorImages[matchingColor.colorId].imagePreview ||
                                       colorImages[matchingColor.colorId].imageUrl ||
                                       createdVehicle.imageUrl;
                        }

                        // Fallback to default image
                        if (!vehicleImage) {
                          vehicleImage = `/src/images/cars-big/car-${createdVehicle.vehicleId}.jpg`;
                        }

                        return {
                          id: createdVehicle.vehicleId,
                          name: `${createdVehicle.modelName} ${createdVehicle.version}`.trim(),
                          img: vehicleImage,
                          mark: createdVehicle.modelName,
                          model: createdVehicle.version,
                          year: createdVehicle.manufactureYear,
                          doors: '4/5',
                          air: 'Yes',
                          transmission: 'Automatic',
                          fuel: 'Electric',
                          price: createdVehicle.priceRetail,
                          rating: 4.5,
                          totalBookings: 0,
                          status: createdVehicle.status === 'AVAILABLE' ? 'available' : 'unavailable',
                          lastMaintenance: new Date().toISOString().slice(0, 10),
                          color: createdVehicle.color // Lưu màu để hiển thị
                        };
                      });

                      // Thêm tất cả xe mới vào danh sách
                      setCars([...newCars, ...cars]);
                      setShowAddCarModal(false);
                      setNewCarErrors({});

                      // Reset form
                      setNewCar({
                        modelName: '',
                        version: '',
                        colorIds: [],
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
                        finalPrice: 0,
                        status: 'AVAILABLE',
                        manufactureYear: new Date().getFullYear()
                      });
                      // Reset color images
                      setColorImages({});

                      // Cập nhật stats
                      setStats(prevStats => ({
                        ...prevStats,
                        totalCars: prevStats.totalCars + 1
                      }));

                      // Success - hiển thị success notification
                      setNotification({
                        isVisible: true,
                        message: `✅ Đã thêm ${newCars.length} xe mới thành công (${newCar.colorIds.length} màu)!`,
                        type: 'success'
                      });
                      console.log(`✅ Đã thêm ${newCars.length} xe mới thành công!`);
                      
                    } catch (imageError) {
                      // Catch validation errors từ image processing
                      console.error('❌ Image validation error:', imageError);
                      if (imageError instanceof Error && imageError.message.includes('quá lớn')) {
                        setNewCarErrors({ 
                          general: imageError.message
                        });
                      } else {
                        // Re-throw to outer catch if not image error
                        throw imageError;
                      }
                      setIsCreatingVehicle(false);
                      return;
                    }
                    
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
                      setEditCarImagePreview('');
                      setEditCarImageUrl('');
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.modalBody}>
                {/* Image Upload Section - Spanning full width */}
                <div className={styles.imageUploadSection}>
                  <div className={styles.imageUploadContainer}>
                    <div className={styles.imageUrlInput}>
                      <label className={styles.imageLabel}>
                        <i className="fas fa-link"></i>
                        Link hình ảnh xe (cho màu đang chỉnh sửa)
                      </label>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={editCarImageUrl}
                        placeholder="Nhập URL hình ảnh (https://...)"
                        onChange={(e) => {
                          setEditCarImageUrl(e.target.value);
                          if (e.target.value.trim()) {
                            setEditCarImagePreview(e.target.value.trim());
                          }
                        }}
                      />
                    </div>
                    <div className={styles.uploadDivider}>
                      <span>HOẶC</span>
                    </div>
                    <div className={styles.fileUploadWrapper}>
                      <label className={styles.imageLabel}>
                        <i className="fas fa-image"></i>
                        Upload hình ảnh từ máy
                      </label>
                      <div className={styles.fileUploadBox}>
                        <input
                          type="file"
                          id="editCarImageFile"
                          accept="image/jpeg,image/png,image/jpg,image/webp"
                          className={styles.fileInput}
                          onChange={(e) => {
                            const file = e.target.files && e.target.files[0];
                            if (file) {
                              // Validate file type
                              if (!file.type.startsWith('image/')) {
                                alert('❌ Vui lòng chọn file ảnh (JPG, PNG, etc.)');
                                return;
                              }
                              
                              // Validate file size (max 5MB before compression)
                              if (file.size > 5 * 1024 * 1024) {
                                alert('❌ File ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.');
                                return;
                              }
                              
                              console.log('🔄 Compressing image for edit...');
                              
                              // Compress image
                              compressImage(file)
                                .then((compressedBase64) => {
                                  setEditCarImagePreview(compressedBase64);
                                  setEditCarImageUrl(''); // Clear URL when file is selected
                                  console.log('✅ Edit image compressed successfully');
                                })
                                .catch((error) => {
                                  console.error('❌ Image compression error:', error);
                                  alert(`❌ ${error.message}`);
                                });
                            } else {
                              setEditCarImagePreview('');
                            }
                          }}
                        />
                        <label htmlFor="editCarImageFile" className={styles.fileUploadLabel}>
                          <div className={styles.uploadIcon}>
                            <i className="fas fa-cloud-upload-alt"></i>
                          </div>
                          <div className={styles.uploadText}>
                            <span className={styles.uploadMainText}>Kéo thả hoặc click để chọn file</span>
                            <span className={styles.uploadSubText}>JPG, PNG, WEBP (Max 5MB)</span>
                          </div>
                        </label>
                      </div>
                    </div>
                    {editCarImagePreview && (
                      <div className={styles.imagePreviewContainer}>
                        <label className={styles.imageLabel}>
                          <i className="fas fa-eye"></i>
                          Preview hình ảnh
                        </label>
                        <div className={styles.imagePreviewBox}>
                          <img src={editCarImagePreview} alt="Preview" className={styles.previewImage} />
                          <button
                            type="button"
                            className={styles.removeImageBtn}
                            onClick={() => {
                              setEditCarImagePreview('');
                              setEditCarImageUrl('');
                              const fileInput = document.getElementById('editCarImageFile') as HTMLInputElement;
                              if (fileInput) fileInput.value = '';
                            }}
                            title="Xóa hình ảnh"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formColumn}>
                    <div className={styles.settingItem}>
                      <label>Tên dòng xe</label>
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
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <i className="fas fa-palette" style={{ color: '#ff4d30' }}></i>
                        <span>Màu xe</span>
                        <span style={{
                          fontSize: '12px',
                          color: '#64748b',
                          fontWeight: 400,
                          marginLeft: '4px'
                        }}>
                          (Thay đổi màu sẽ cập nhật biến thể này)
                        </span>
                      </label>
                      <select
                        className={styles.settingInput}
                        value={editCar.color}
                        onChange={(e) => {
                          const colorId = parseInt(e.target.value);
                          const selectedColor = colors.find(c => c.colorId === colorId);
                          if (selectedColor) {
                            setEditCar({ ...editCar, color: selectedColor.colorName });
                          }
                          setEditCarErrors(prev => ({ ...prev, color: '' }));
                        }}
                        style={{
                          ...(editCarErrors.color ? { borderColor: 'red' } : {}),
                          paddingRight: '40px'
                        }}
                      >
                        <option value="">-- Chọn màu xe --</option>
                        {colors.map((color) => (
                          <option
                            key={color.colorId}
                            value={color.colorId}
                            selected={editCar.color === color.colorName}
                          >
                            {color.colorName}
                          </option>
                        ))}
                      </select>
                      {/* Color preview */}
                      {editCar.color && (() => {
                        const selectedColor = colors.find(c => c.colorName === editCar.color);
                        return selectedColor ? (
                          <div style={{
                            marginTop: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 14px',
                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1'
                          }}>
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: selectedColor.hexCode,
                              border: '3px solid white',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)'
                            }}></div>
                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                              {selectedColor.colorName} - {selectedColor.hexCode}
                            </span>
                          </div>
                        ) : null;
                      })()}
                      {editCarErrors.color && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.color}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Quãng đường (km) <span style={{color: '#888', fontSize: '0.85em'}}>(10-2000 km)</span></label>
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
                        min="10"
                        max="2000"
                        placeholder="10-2000 km"
                        style={editCarErrors.rangeKm ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.rangeKm && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.rangeKm}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Thời gian sạc (giờ) <span style={{color: '#888', fontSize: '0.85em'}}>(0.1-72 giờ)</span></label>
                      <input
                        type="number"
                        step="0.1"
                        className={styles.settingInput}
                        value={editCar.chargingTimeHours || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value || '0');
                          setEditCar({ ...editCar, chargingTimeHours: value });
                          const error = validateCarField('chargingTimeHours', value);
                          setEditCarErrors(prev => ({ ...prev, chargingTimeHours: error }));
                        }}
                        min="0.1"
                        max="72"
                        placeholder="0.1-72 giờ"
                        style={editCarErrors.chargingTimeHours ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.chargingTimeHours && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.chargingTimeHours}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Công suất động cơ (kW) <span style={{color: '#888', fontSize: '0.85em'}}>(1-1500 kW)</span></label>
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
                        min="1"
                        max="1500"
                        placeholder="1-1500 kW"
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
                      <label>Phiên bản</label>
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
                      <label>Dung lượng pin (kWh) <span style={{color: '#888', fontSize: '0.85em'}}>(5-300 kWh)</span></label>
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
                        min="5"
                        max="300"
                        placeholder="5-300 kWh"
                        style={editCarErrors.batteryCapacityKwh ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.batteryCapacityKwh && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.batteryCapacityKwh}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Tốc độ tối đa (km/h) <span style={{color: '#888', fontSize: '0.85em'}}>(10-500 km/h)</span></label>
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
                        min="10"
                        max="500"
                        placeholder="10-500 km/h"
                        style={editCarErrors.maxSpeedKmh ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.maxSpeedKmh && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.maxSpeedKmh}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Số chỗ ngồi <span style={{color: '#888', fontSize: '0.85em'}}>(1-12 chỗ)</span></label>
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
                        min="1"
                        max="12"
                        placeholder="Từ 1-12 chỗ"
                        style={editCarErrors.seatingCapacity ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.seatingCapacity && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.seatingCapacity}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Trọng lượng (kg) <span style={{color: '#888', fontSize: '0.85em'}}>(100-10000 kg)</span></label>
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
                        min="100"
                        max="10000"
                        placeholder="100-10000 kg"
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
                      <label>Chiều dài (mm) <span style={{color: '#888', fontSize: '0.85em'}}>(500-10000 mm)</span></label>
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
                        min="500"
                        max="10000"
                        placeholder="500-10000 mm"
                        style={editCarErrors.lengthMm ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.lengthMm && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.lengthMm}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Chiều rộng (mm) <span style={{color: '#888', fontSize: '0.85em'}}>(300-5000 mm)</span></label>
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
                        min="300"
                        max="5000"
                        placeholder="300-5000 mm"
                        style={editCarErrors.widthMm ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.widthMm && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.widthMm}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Chiều cao (mm) <span style={{color: '#888', fontSize: '0.85em'}}>(100-5000 mm)</span></label>
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
                        min="100"
                        max="5000"
                        placeholder="100-5000 mm"
                        style={editCarErrors.heightMm ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.heightMm && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.heightMm}
                        </span>
                      )}
                    </div>
                    <div className={styles.settingItem}>
                      <label>Năm sản xuất <span style={{color: '#888', fontSize: '0.85em'}}>(2000-{new Date().getFullYear() + 1})</span></label>
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
                        min="2000"
                        max={new Date().getFullYear() + 1}
                        placeholder={`2000-${new Date().getFullYear() + 1}`}
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
                      <label>Final Price (VND) - Giá sau khuyến mãi</label>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={formatPriceInput(editCar.finalPrice)}
                        onChange={(e) => {
                          const numericValue = parsePriceInput(e.target.value);
                          setEditCar({...editCar, finalPrice: numericValue});
                          const error = validateCarField('finalPrice', numericValue, editCar);
                          setEditCarErrors(prev => ({ ...prev, finalPrice: error }));
                        }}
                        placeholder="Để 0 nếu không có khuyến mãi"
                        style={editCarErrors.finalPrice ? { borderColor: 'red' } : {}}
                      />
                      {editCarErrors.finalPrice && (
                        <span style={{ color: 'red', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                          ⚠️ {editCarErrors.finalPrice}
                        </span>
                      )}
                      <small style={{ color: '#666', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                        💡 Nếu để 0, giá hiển thị sẽ là Price. Nếu có giá trị, sẽ hiển thị giá khuyến mãi.
                      </small>
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
              <div className={styles.modalActions} style={{
                borderTop: '2px solid #e2e8f0',
                paddingTop: '20px',
                marginTop: '24px'
              }}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                      setShowEditCarModal(false);
                      setEditingCar(null);
                      setEditCarErrors({});
                      setEditCarImagePreview('');
                      setEditCarImageUrl('');
                  }}
                  disabled={isUpdatingVehicle}
                  style={isUpdatingVehicle ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                >
                  <i className="fas fa-times" style={{ marginRight: '8px' }}></i>
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

                      // Find colorId from color name
                      const selectedColor = colors.find(c => c.colorName === editCar.color);
                      if (!selectedColor) {
                        alert('❌ Màu xe không hợp lệ. Vui lòng chọn lại màu.');
                        setIsUpdatingVehicle(false);
                        return;
                      }

                      // Get image URL (priority: URL input > base64 > empty string)
                      let imageUrl = '';
                      if (editCarImageUrl && editCarImageUrl.trim()) {
                        imageUrl = editCarImageUrl.trim();
                      } else if (editCarImagePreview && editCarImagePreview.startsWith('data:')) {
                        imageUrl = editCarImagePreview;
                      }

                      // Chuẩn bị dữ liệu theo API format - UPDATE cũng cần colors array
                      const vehicleData: UpdateVehicleRequest = {
                        modelName: editCar.modelName.trim(),
                        version: editCar.version.trim(),
                        colors: [{
                          colorId: selectedColor.colorId,
                          imageUrl: imageUrl // API requires imageUrl, can be empty string
                        }],
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

                      console.log('✏️ Updating vehicle with API format (colors array):', vehicleData);

                      // Gửi lên API để cập nhật trong database
                      await updateVehicle(editingCar.vehicleId, vehicleData);

                      // Reload vehicles from API to get fresh data with updated images and colors
                      await reloadVehicles();

                      setShowEditCarModal(false);
                      setEditingCar(null);
                      setEditCarErrors({});
                      setEditCarImagePreview('');
                      setEditCarImageUrl('');

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
                        finalPrice: 0,
                        status: 'AVAILABLE',
                        manufactureYear: new Date().getFullYear()
                      });

                      // Success - hiển thị success notification
                      setNotification({
                        isVisible: true,
                        message: '✅ Đã cập nhật xe thành công!',
                        type: 'success'
                      });
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
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                      Đang cập nhật biến thể xe...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save" style={{ marginRight: '8px' }}></i>
                      Cập nhật biến thể này
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Car Details Modal */}
        {showViewCarModal && selectedCar && (
          <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            onClick={() => {
              setShowViewCarModal(false);
              setSelectedCar(null);
            }}
          >
            <div
              className={styles.modal}
              style={{ maxWidth: '1400px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h4 className={styles.modalTitle}>
                  <i className="fas fa-palette"></i>
                  Các màu của {selectedCar.variantName || selectedCar.baseModel}
                  <span style={{
                    marginLeft: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: 'rgba(255, 77, 48, 0.1)',
                    color: '#ff4d30'
                  }}>
                    {selectedCar.totalVariants} màu
                  </span>
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
              <div className={styles.modalBody} style={{ padding: '24px' }}>
                {(() => {
                  // All variants should already be filtered by mark+model from handleViewCar
                  const colorVariants = selectedCar.variants;
                  const currentVariant = colorVariants[selectedColorIndex] || colorVariants[0];

                  return (
                    <>
                      {/* Color Selector Section */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '24px',
                        padding: '16px',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#475569'
                        }}>
                          <i className="fas fa-palette" style={{ marginRight: '8px', color: '#ff4d30' }}></i>
                          Chọn màu ({colorVariants.length} màu):
                        </span>
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap'
                        }}>
                          {colorVariants.map((variant: any, idx: number) => {
                            // Find color from colors array (same as card display)
                            const colorName = variant.color || 'Unknown';
                            const colorObj = colors.find(c =>
                              c.colorName.toLowerCase().trim() === colorName.toLowerCase().trim()
                            );

                            const colorHex = colorObj?.hexCode || '#808080'; // Gray fallback

                            return (
                              <button
                                key={variant.id}
                                onClick={() => setSelectedColorIndex(idx)}
                                title={variant.color}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  backgroundColor: colorHex,
                                  border: idx === selectedColorIndex
                                    ? '4px solid #ff4d30'
                                    : colorHex.toLowerCase() === '#f3f4f6' || colorHex.toLowerCase() === '#ffffff'
                                      ? '2px solid #E5E7EB'
                                      : '2px solid #e2e8f0',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  boxShadow: idx === selectedColorIndex
                                    ? '0 0 0 4px rgba(255, 77, 48, 0.2)'
                                    : '0 2px 4px rgba(0,0,0,0.1)',
                                  transform: idx === selectedColorIndex ? 'scale(1.1)' : 'scale(1)',
                                  position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                  if (idx !== selectedColorIndex) {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = idx === selectedColorIndex ? 'scale(1.1)' : 'scale(1)';
                                }}
                              >
                                {idx === selectedColorIndex && (
                                  <i className="fas fa-check" style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    color: colorHex.toLowerCase() === '#f3f4f6' || colorHex.toLowerCase() === '#d1d5db' || colorHex.toLowerCase() === '#ffffff' ? '#1F2937' : 'white',
                                    fontSize: '16px'
                                  }}></i>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <span style={{
                          marginLeft: 'auto',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#64748b'
                        }}>
                          Đang xem: <strong style={{ color: '#ff4d30' }}>{currentVariant.color}</strong>
                        </span>
                      </div>

                      {/* Detail Information Grid */}
                      <div className={styles.formGrid}>
                        <div className={styles.formColumn}>
                          {/* Image */}
                          <div className={styles.settingItem}>
                            <img
                              src={currentVariant.img || currentVariant.imageUrl}
                              alt={`${currentVariant.modelName || currentVariant.mark} ${currentVariant.version || currentVariant.model} - ${currentVariant.color}`}
                              style={{
                                width: '100%',
                                maxWidth: '100%',
                                height: '240px',
                                objectFit: 'cover',
                                borderRadius: '12px',
                                transition: 'opacity 0.3s ease'
                              }}
                            />
                          </div>
                          <div className={styles.settingItem}>
                            <label>Tên xe</label>
                            <input
                              type="text"
                              className={styles.settingInput}
                              value={currentVariant.modelName || currentVariant.mark}
                              readOnly
                            />
                          </div>
                          <div className={styles.settingItem}>
                            <label>Phiên bản</label>
                            <input
                              type="text"
                              className={styles.settingInput}
                              value={currentVariant.version || currentVariant.model}
                              readOnly
                            />
                          </div>
                          <div className={styles.settingItem}>
                            <label>Màu sắc</label>
                            <input
                              type="text"
                              className={styles.settingInput}
                              value={currentVariant.color}
                              readOnly
                            />
                          </div>
                          <div className={styles.settingItem}>
                            <label>Dung lượng pin (kWh)</label>
                            <input
                              type="number"
                              className={styles.settingInput}
                              value={currentVariant.batteryCapacityKwh || 0}
                              readOnly
                            />
                          </div>
                          <div className={styles.settingItem}>
                            <label>Tầm hoạt động (km)</label>
                            <input
                              type="number"
                              className={styles.settingInput}
                              value={currentVariant.rangeKm || 0}
                              readOnly
                            />
                          </div>
                        </div>

                        <div className={styles.formColumn}>
                          <div className={styles.settingItem}>
                            <label>Tốc độ tối đa (km/h)</label>
                            <input
                              type="number"
                              className={styles.settingInput}
                              value={currentVariant.maxSpeedKmh || 0}
                              readOnly
                            />
                          </div>
                          <div className={styles.settingItem}>
                            <label>Thời gian sạc (h)</label>
                            <input
                              type="number"
                              className={styles.settingInput}
                              value={currentVariant.chargingTimeHours || 0}
                              readOnly
                            />
                          </div>
                          <div className={styles.settingItem}>
                            <label>Số chỗ ngồi</label>
                            <input
                              type="number"
                              className={styles.settingInput}
                              value={currentVariant.seatingCapacity || 0}
                              readOnly
                            />
                          </div>
                          <div className={styles.settingItem}>
                            <label>Công suất động cơ (kW)</label>
                            <input
                              type="number"
                              className={styles.settingInput}
                              value={currentVariant.motorPowerKw || 0}
                              readOnly
                            />
                          </div>
                          <div className={styles.settingItem}>
                            <label>Trọng lượng (kg)</label>
                            <input
                              type="number"
                              className={styles.settingInput}
                              value={currentVariant.weightKg || 0}
                              readOnly
                            />
                          </div>
                          <div className={styles.settingItem}>
                            <label>Năm sản xuất</label>
                            <input
                              type="number"
                              className={styles.settingInput}
                              value={currentVariant.manufactureYear || currentVariant.year || new Date().getFullYear()}
                              readOnly
                            />
                          </div>
                        </div>

                        <div className={styles.formColumn}>
                          <div className={styles.settingItem}>
                            <label>Chiều dài (mm)</label>
                            <input
                              type="number"
                              className={styles.settingInput}
                              value={currentVariant.lengthMm || 0}
                              readOnly
                            />
                          </div>
                          <div className={styles.settingItem}>
                            <label>Chiều rộng (mm)</label>
                            <input
                              type="number"
                              className={styles.settingInput}
                              value={currentVariant.widthMm || 0}
                              readOnly
                            />
                          </div>
                          <div className={styles.settingItem}>
                            <label>Chiều cao (mm)</label>
                            <input
                              type="number"
                              className={styles.settingInput}
                              value={currentVariant.heightMm || 0}
                              readOnly
                            />
                          </div>
                          <div className={styles.settingItem}>
                            <label>Trạng thái</label>
                            <input
                              type="text"
                              className={styles.settingInput}
                              value={
                                currentVariant.status === 'AVAILABLE' || currentVariant.status === 'available' ? 'Có sẵn' :
                                currentVariant.status === 'DISCONTINUED' || currentVariant.status === 'unavailable' ? 'Ngừng bán' :
                                currentVariant.status === 'rented' ? 'Đang thuê' :
                                currentVariant.status === 'maintenance' ? 'Bảo trì' : 'Không khả dụng'
                              }
                              readOnly
                              style={{
                                color: currentVariant.status === 'AVAILABLE' || currentVariant.status === 'available' ? '#10b981' :
                                       currentVariant.status === 'rented' ? '#f59e0b' :
                                       currentVariant.status === 'maintenance' ? '#3b82f6' : '#ef4444',
                                fontWeight: '600'
                              }}
                            />
                          </div>
                          <div className={styles.settingItem}>
                            <label>Giá bán (VNĐ)</label>
                            <input
                              type="text"
                              className={styles.settingInput}
                              value={formatPriceInput(currentVariant.priceRetail || currentVariant.price)}
                              readOnly
                              style={{
                                color: '#ff4d30',
                                fontWeight: '700',
                                fontSize: '16px'
                              }}
                            />
                          </div>
                          <div className={styles.settingItem}>
                            <label>Mã xe</label>
                            <input
                              type="text"
                              className={styles.settingInput}
                              value={`#${currentVariant.id}`}
                              readOnly
                              style={{
                                fontWeight: '600',
                                color: '#64748b'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.primaryButton}
                  onClick={() => {
                    // Get the current selected variant to edit
                    const colorVariants = selectedCar.variants;
                    const currentVariant = colorVariants[selectedColorIndex] || colorVariants[0];

                    // Close view modal and open edit modal with current variant
                    setShowViewCarModal(false);
                    handleEditCar(currentVariant.id);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)'
                  }}
                >
                  <i className="fas fa-edit"></i>
                  Chỉnh sửa
                </button>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowViewCarModal(false);
                    setSelectedCar(null);
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Color Modal */}
        {showAddColorModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: '600px' }}>
              <div className={styles.modalHeader}>
                <h2>
                  <i className="fas fa-palette"></i>
                  Thêm màu xe mới
                </h2>
                <button
                  className={styles.closeButton}
                  onClick={() => {
                    setShowAddColorModal(false);
                    setNewColor({ colorName: '', hexCode: '#000000' });
                    setNewColorErrors({});
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.modalBody} style={{ maxHeight: '500px', overflowY: 'auto', padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Preview Section - Top */}
                  <div style={{
                    padding: '24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
                  }}>
                    <div style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '16px',
                      backgroundColor: newColor.hexCode,
                      border: '4px solid white',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                      transition: 'all 0.3s ease'
                    }}></div>
                    <div style={{ textAlign: 'center', color: 'white' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                        {newColor.colorName || 'Nhập tên màu'}
                      </div>
                      <code style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        backdropFilter: 'blur(10px)',
                        letterSpacing: '1px'
                      }}>
                        {newColor.hexCode}
                      </code>
                    </div>
                  </div>

                  {/* Form Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className={styles.formGroup}>
                      <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block', color: '#374151' }}>
                        Tên màu <span style={{color: '#ef4444'}}>*</span>
                      </label>
                      <input
                        type="text"
                        value={newColor.colorName}
                        onChange={(e) => {
                          setNewColor({ ...newColor, colorName: e.target.value });
                          if (newColorErrors.colorName) {
                            setNewColorErrors({ ...newColorErrors, colorName: '' });
                          }
                        }}
                        placeholder="VD: Đỏ Ruby, Xanh Sapphire, Trắng Ngọc Trai..."
                        className={newColorErrors.colorName ? styles.inputError : ''}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: newColorErrors.colorName ? '2px solid #ef4444' : '2px solid #e5e7eb',
                          borderRadius: '10px',
                          fontSize: '14px',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => !newColorErrors.colorName && (e.target.style.borderColor = '#e5e7eb')}
                      />
                      {newColorErrors.colorName && (
                        <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                          <i className="fas fa-exclamation-circle"></i> {newColorErrors.colorName}
                        </span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block', color: '#374151' }}>
                        Mã màu (Hex) <span style={{color: '#ef4444'}}>*</span>
                      </label>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="color"
                            value={newColor.hexCode}
                            onChange={(e) => {
                              setNewColor({ ...newColor, hexCode: e.target.value.toUpperCase() });
                              if (newColorErrors.hexCode) {
                                setNewColorErrors({ ...newColorErrors, hexCode: '' });
                              }
                            }}
                            style={{
                              width: '60px',
                              height: '48px',
                              borderRadius: '10px',
                              border: '2px solid #e5e7eb',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            title="Chọn màu"
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <input
                            type="text"
                            value={newColor.hexCode}
                            onChange={(e) => {
                              let value = e.target.value.toUpperCase();
                              // Auto-add # if missing
                              if (value && !value.startsWith('#')) {
                                value = '#' + value;
                              }
                              setNewColor({ ...newColor, hexCode: value });
                              if (newColorErrors.hexCode) {
                                setNewColorErrors({ ...newColorErrors, hexCode: '' });
                              }
                            }}
                            placeholder="#000000"
                            className={newColorErrors.hexCode ? styles.inputError : ''}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: newColorErrors.hexCode ? '2px solid #ef4444' : '2px solid #e5e7eb',
                              borderRadius: '10px',
                              fontSize: '14px',
                              fontFamily: 'monospace',
                              letterSpacing: '1px',
                              transition: 'all 0.2s',
                              outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => !newColorErrors.hexCode && (e.target.style.borderColor = '#e5e7eb')}
                          />
                          {newColorErrors.hexCode && (
                            <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                              <i className="fas fa-exclamation-circle"></i> {newColorErrors.hexCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowAddColorModal(false);
                    setNewColor({ colorName: '', hexCode: '#000000' });
                    setNewColorErrors({});
                  }}
                  disabled={isCreatingColor}
                >
                  Hủy
                </button>
                <button
                  className={`${styles.primaryButton} ${isCreatingColor ? styles.loading : ''}`}
                  onClick={async () => {
                    const errors: Record<string, string> = {};
                    if (!newColor.colorName.trim()) errors.colorName = 'Vui lòng nhập tên màu';
                    if (!newColor.hexCode.match(/^#[0-9A-Fa-f]{6}$/)) errors.hexCode = 'Mã màu không hợp lệ';

                    if (Object.keys(errors).length > 0) {
                      setNewColorErrors(errors);
                      return;
                    }

                    setIsCreatingColor(true);
                    try {
                      console.log('🎨 Submitting color data:', newColor);
                      const createdColor = await createColor(newColor);
                      console.log('✅ Color created successfully:', createdColor);
                      setColors([...colors, createdColor]);
                      setShowAddColorModal(false);
                      setNewColor({ colorName: '', hexCode: '#000000' });
                      setNotification({
                        isVisible: true,
                        message: 'Thêm màu xe thành công!',
                        type: 'success'
                      });
                    } catch (error: any) {
                      console.error('❌ Failed to create color:', error);
                      setNotification({
                        isVisible: true,
                        message: error.message || 'Lỗi khi thêm màu xe!',
                        type: 'error'
                      });
                    } finally {
                      setIsCreatingColor(false);
                    }
                  }}
                  disabled={isCreatingColor}
                >
                  {isCreatingColor ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Đang thêm...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus"></i>
                      Thêm màu
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Color Modal */}
        {showEditColorModal && editingColor && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: '600px' }}>
              <div className={styles.modalHeader}>
                <h2>
                  <i className="fas fa-edit"></i>
                  Chỉnh sửa màu xe
                </h2>
                <button
                  className={styles.closeButton}
                  onClick={() => {
                    setShowEditColorModal(false);
                    setEditingColor(null);
                    setEditColorErrors({});
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.modalBody} style={{ maxHeight: '500px', overflowY: 'auto', padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Preview Section - Top */}
                  <div style={{
                    padding: '24px',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    boxShadow: '0 8px 24px rgba(240, 147, 251, 0.3)'
                  }}>
                    <div style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '16px',
                      backgroundColor: editColor.hexCode || '#000000',
                      border: '4px solid white',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                      transition: 'all 0.3s ease'
                    }}></div>
                    <div style={{ textAlign: 'center', color: 'white' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                        {editColor.colorName || 'Tên màu'}
                      </div>
                      <code style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        backdropFilter: 'blur(10px)',
                        letterSpacing: '1px'
                      }}>
                        {editColor.hexCode || '#000000'}
                      </code>
                    </div>
                  </div>

                  {/* Form Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className={styles.formGroup}>
                      <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block', color: '#374151' }}>
                        Tên màu <span style={{color: '#ef4444'}}>*</span>
                      </label>
                      <input
                        type="text"
                        value={editColor.colorName}
                        onChange={(e) => {
                          setEditColor({ ...editColor, colorName: e.target.value });
                          if (editColorErrors.colorName) {
                            setEditColorErrors({ ...editColorErrors, colorName: '' });
                          }
                        }}
                        placeholder="VD: Đỏ Ruby, Xanh Sapphire, Trắng Ngọc Trai..."
                        className={editColorErrors.colorName ? styles.inputError : ''}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: editColorErrors.colorName ? '2px solid #ef4444' : '2px solid #e5e7eb',
                          borderRadius: '10px',
                          fontSize: '14px',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#f093fb'}
                        onBlur={(e) => !editColorErrors.colorName && (e.target.style.borderColor = '#e5e7eb')}
                      />
                      {editColorErrors.colorName && (
                        <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                          <i className="fas fa-exclamation-circle"></i> {editColorErrors.colorName}
                        </span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block', color: '#374151' }}>
                        Mã màu (Hex) <span style={{color: '#ef4444'}}>*</span>
                      </label>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="color"
                            value={editColor.hexCode || '#000000'}
                            onChange={(e) => {
                              setEditColor({ ...editColor, hexCode: e.target.value.toUpperCase() });
                              if (editColorErrors.hexCode) {
                                setEditColorErrors({ ...editColorErrors, hexCode: '' });
                              }
                            }}
                            style={{
                              width: '60px',
                              height: '48px',
                              borderRadius: '10px',
                              border: '2px solid #e5e7eb',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            title="Chọn màu"
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <input
                            type="text"
                            value={editColor.hexCode || '#000000'}
                            onChange={(e) => {
                              let value = e.target.value.toUpperCase();
                              if (value && !value.startsWith('#')) {
                                value = '#' + value;
                              }
                              setEditColor({ ...editColor, hexCode: value });
                              if (editColorErrors.hexCode) {
                                setEditColorErrors({ ...editColorErrors, hexCode: '' });
                              }
                            }}
                            placeholder="#000000"
                            className={editColorErrors.hexCode ? styles.inputError : ''}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: editColorErrors.hexCode ? '2px solid #ef4444' : '2px solid #e5e7eb',
                              borderRadius: '10px',
                              fontSize: '14px',
                              fontFamily: 'monospace',
                              letterSpacing: '1px',
                              transition: 'all 0.2s',
                              outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#f093fb'}
                            onBlur={(e) => !editColorErrors.hexCode && (e.target.style.borderColor = '#e5e7eb')}
                          />
                          {editColorErrors.hexCode && (
                            <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                              <i className="fas fa-exclamation-circle"></i> {editColorErrors.hexCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.formGroup} style={{ marginTop: '8px' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        padding: '14px 16px',
                        background: '#f9fafb',
                        borderRadius: '10px',
                        border: '2px solid #e5e7eb',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f093fb'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                      >
                        <input
                          type="checkbox"
                          checked={editColor.isActive}
                          onChange={(e) => setEditColor({ ...editColor, isActive: e.target.checked })}
                          style={{
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            accentColor: '#f093fb'
                          }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className={`fas ${editColor.isActive ? 'fa-check-circle' : 'fa-times-circle'}`}
                             style={{ color: editColor.isActive ? '#10b981' : '#9ca3af', fontSize: '18px' }}></i>
                          <span style={{ fontWeight: 600, color: '#374151', fontSize: '14px' }}>
                            {editColor.isActive ? 'Đang sử dụng' : 'Ngừng sử dụng'}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowEditColorModal(false);
                    setEditingColor(null);
                    setEditColorErrors({});
                  }}
                  disabled={isUpdatingColor}
                >
                  Hủy
                </button>
                <button
                  className={`${styles.primaryButton} ${isUpdatingColor ? styles.loading : ''}`}
                  onClick={async () => {
                    const errors: Record<string, string> = {};
                    if (!editColor.colorName?.trim()) errors.colorName = 'Vui lòng nhập tên màu';
                    if (!editColor.hexCode?.match(/^#[0-9A-Fa-f]{6}$/)) errors.hexCode = 'Mã màu không hợp lệ';

                    if (Object.keys(errors).length > 0) {
                      setEditColorErrors(errors);
                      return;
                    }

                    setIsUpdatingColor(true);
                    try {
                      // Convert isActive to inUse for API
                      const updateData = {
                        ...editColor,
                        inUse: editColor.isActive
                      };
                      const updatedColor = await updateColor(editingColor.colorId, updateData);
                      setColors(colors.map(c => c.colorId === updatedColor.colorId ? updatedColor : c));
                      setShowEditColorModal(false);
                      setEditingColor(null);
                      setNotification({
                        isVisible: true,
                        message: 'Cập nhật màu xe thành công!',
                        type: 'success'
                      });
                    } catch (error) {
                      setNotification({
                        isVisible: true,
                        message: 'Lỗi khi cập nhật màu xe!',
                        type: 'error'
                      });
                    } finally {
                      setIsUpdatingColor(false);
                    }
                  }}
                  disabled={isUpdatingColor}
                >
                  {isUpdatingColor ? (
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
            </div>
          </div>
        )}

        {/* View Color Modal */}
        {showViewColorModal && selectedColor && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: '550px' }}>
              <div className={styles.modalHeader}>
                <h2>
                  <i className="fas fa-info-circle"></i>
                  Chi tiết màu xe
                </h2>
                <button
                  className={styles.closeButton}
                  onClick={() => {
                    setShowViewColorModal(false);
                    setSelectedColor(null);
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.modalBody} style={{ padding: '24px' }}>
                {/* Hero Section */}
                <div style={{
                  padding: '32px',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px',
                  marginBottom: '28px',
                  boxShadow: '0 12px 32px rgba(79, 172, 254, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Decorative circles */}
                  <div style={{
                    position: 'absolute',
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    top: '-50px',
                    right: '-50px'
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    bottom: '-30px',
                    left: '-30px'
                  }}></div>

                  {/* Color Preview */}
                  <div style={{
                    width: '140px',
                    height: '140px',
                    borderRadius: '20px',
                    backgroundColor: selectedColor.hexCode,
                    border: '5px solid white',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                    position: 'relative',
                    zIndex: 1
                  }}></div>

                  {/* Color Info */}
                  <div style={{ textAlign: 'center', color: 'white', position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                      {selectedColor.colorName}
                    </div>
                    <code style={{
                      background: 'rgba(255,255,255,0.25)',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '16px',
                      fontFamily: 'monospace',
                      backdropFilter: 'blur(10px)',
                      fontWeight: 700,
                      letterSpacing: '1.5px'
                    }}>
                      {selectedColor.hexCode}
                    </code>
                  </div>
                </div>

                {/* Details Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    padding: '16px 20px',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <i className="fas fa-hashtag" style={{ color: '#6b7280', fontSize: '16px' }}></i>
                      <span style={{ fontWeight: 600, color: '#374151' }}>ID:</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#ff4d30', fontSize: '16px' }}>#{selectedColor.colorId}</span>
                  </div>

                  <div style={{
                    padding: '16px 20px',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <i className="fas fa-toggle-on" style={{ color: '#6b7280', fontSize: '16px' }}></i>
                      <span style={{ fontWeight: 600, color: '#374151' }}>Trạng thái:</span>
                    </div>
                    <span className={`${styles.statusBadge} ${(selectedColor.inUse ?? selectedColor.isActive) ? styles.active : styles.inactive}`}
                      style={{ padding: '6px 16px', fontSize: '13px', fontWeight: 700 }}>
                      <i className={`fas ${(selectedColor.inUse ?? selectedColor.isActive) ? 'fa-check-circle' : 'fa-times-circle'}`}
                         style={{ marginRight: '6px' }}></i>
                      {(selectedColor.inUse ?? selectedColor.isActive) ? 'Đang dùng' : 'Ngừng dùng'}
                    </span>
                  </div>

                  {selectedColor.createdAt && (
                    <div style={{
                      padding: '16px 20px',
                      background: '#f9fafb',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <i className="fas fa-calendar-plus" style={{ color: '#6b7280', fontSize: '16px' }}></i>
                        <span style={{ fontWeight: 600, color: '#374151' }}>Ngày tạo:</span>
                      </div>
                      <span style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500 }}>
                        {new Date(selectedColor.createdAt).toLocaleDateString('vi-VN', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}

                  {selectedColor.updatedAt && (
                    <div style={{
                      padding: '16px 20px',
                      background: '#f9fafb',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <i className="fas fa-clock" style={{ color: '#6b7280', fontSize: '16px' }}></i>
                        <span style={{ fontWeight: 600, color: '#374151' }}>Cập nhật gần nhất:</span>
                      </div>
                      <span style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500 }}>
                        {new Date(selectedColor.updatedAt).toLocaleDateString('vi-VN', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowViewColorModal(false);
                    setSelectedColor(null);
                  }}
                >
                  <i className="fas fa-times"></i>
                  Đóng
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={() => {
                    setShowViewColorModal(false);
                    setEditingColor(selectedColor);
                    setEditColor({
                      colorName: selectedColor.colorName,
                      hexCode: selectedColor.hexCode,
                      isActive: selectedColor.inUse ?? selectedColor.isActive
                    });
                    setEditColorErrors({});
                    setSelectedColor(null);
                    setShowEditColorModal(true);
                  }}
                >
                  <i className="fas fa-edit"></i>
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Inventory Modal */}
        {showAddInventoryModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: '600px' }}>
              <div className={styles.modalHeader}>
                <h2>
                  <i className="fas fa-warehouse"></i>
                  Thêm tồn kho mới
                </h2>
                <button
                  className={styles.closeButton}
                  onClick={() => {
                    setShowAddInventoryModal(false);
                    setNewInventory({ vehicleId: 0, quantity: 0 });
                    setNewInventoryErrors({});
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.modalBody} style={{ maxHeight: '500px', overflowY: 'auto', padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block', color: '#374151' }}>
                      Chọn xe <span style={{color: '#ef4444'}}>*</span>
                    </label>
                    <select
                      value={newInventory.vehicleId || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setNewInventory({ ...newInventory, vehicleId: value });
                        if (newInventoryErrors.vehicleId) {
                          setNewInventoryErrors({ ...newInventoryErrors, vehicleId: '' });
                        }
                      }}
                      className={newInventoryErrors.vehicleId ? styles.inputError : ''}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: newInventoryErrors.vehicleId ? '2px solid #ef4444' : '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '14px',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">-- Chọn xe --</option>
                      {(() => {
                        // Get list of vehicle IDs already in inventory
                        const existingVehicleIds = inventorySummary?.vehicles.map(v => v.vehicleId) || [];

                        // Filter cars that are NOT in inventory yet
                        const availableCars = cars.filter(car => !existingVehicleIds.includes(car.id));

                        if (availableCars.length === 0) {
                          return <option value="" disabled>Tất cả xe đã có trong kho</option>;
                        }

                        return availableCars.map(car => (
                          <option key={car.id} value={car.id}>
                            #{car.id} - {car.name} {car.color ? `- ${car.color}` : ''}
                          </option>
                        ));
                      })()}
                    </select>
                    {newInventoryErrors.vehicleId && (
                      <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                        <i className="fas fa-exclamation-circle"></i> {newInventoryErrors.vehicleId}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block', color: '#374151' }}>
                      Số lượng <span style={{color: '#ef4444'}}>*</span>
                    </label>
                    <input
                      type="number"
                      value={newInventory.quantity || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setNewInventory({ ...newInventory, quantity: value });
                        if (newInventoryErrors.quantity) {
                          setNewInventoryErrors({ ...newInventoryErrors, quantity: '' });
                        }
                      }}
                      placeholder="Nhập số lượng xe"
                      min="0"
                      className={newInventoryErrors.quantity ? styles.inputError : ''}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: newInventoryErrors.quantity ? '2px solid #ef4444' : '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '14px'
                      }}
                    />
                    {newInventoryErrors.quantity && (
                      <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                        <i className="fas fa-exclamation-circle"></i> {newInventoryErrors.quantity}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowAddInventoryModal(false);
                    setNewInventory({ vehicleId: 0, quantity: 0 });
                    setNewInventoryErrors({});
                  }}
                  disabled={isCreatingInventory}
                >
                  Hủy
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={async () => {
                    // Validation
                    const errors: Record<string, string> = {};
                    if (!newInventory.vehicleId || newInventory.vehicleId <= 0) {
                      errors.vehicleId = 'Vui lòng chọn xe';
                    }
                    if (!newInventory.quantity || newInventory.quantity < 0) {
                      errors.quantity = 'Số lượng không được để trống và phải >= 0';
                    }

                    if (Object.keys(errors).length > 0) {
                      setNewInventoryErrors(errors);
                      return;
                    }

                    setIsCreatingInventory(true);
                    try {
                      await createInventoryRecord(newInventory);
                      setShowAddInventoryModal(false);
                      setNewInventory({ vehicleId: 0, quantity: 0 });
                      setNewInventoryErrors({});
                      setNotification({
                        isVisible: true,
                        message: 'Thêm tồn kho thành công!',
                        type: 'success'
                      });
                      await reloadInventory();
                    } catch (error) {
                      console.error('Create inventory error:', error);
                      setNotification({
                        isVisible: true,
                        message: 'Thêm tồn kho thất bại!',
                        type: 'error'
                      });
                    } finally {
                      setIsCreatingInventory(false);
                    }
                  }}
                  disabled={isCreatingInventory}
                >
                  {isCreatingInventory ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Đang thêm...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus"></i>
                      Thêm tồn kho
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Inventory Modal */}
        {showEditInventoryModal && editingInventoryItem && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: '600px' }}>
              <div className={styles.modalHeader}>
                <h2>
                  <i className="fas fa-edit"></i>
                  Chỉnh sửa tồn kho
                </h2>
                <button
                  className={styles.closeButton}
                  onClick={() => {
                    setShowEditInventoryModal(false);
                    setEditingInventoryItem(null);
                    setEditInventory({ quantity: 0 });
                    setEditInventoryErrors({});
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.modalBody} style={{ maxHeight: '500px', overflowY: 'auto', padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Display Vehicle Info (Read-only) */}
                  <div style={{
                    padding: '16px',
                    background: '#f3f4f6',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#6b7280', fontSize: '13px', fontWeight: 600 }}>Vehicle ID:</span>
                      <span style={{ marginLeft: '8px', fontWeight: 700, color: '#ff4d30' }}>
                        #{editingInventoryItem.vehicleId}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '13px', fontWeight: 600 }}>Tên xe:</span>
                      <span style={{ marginLeft: '8px', fontWeight: 600, color: '#111827' }}>
                        {formatVehicleDisplayName(editingInventoryItem)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block', color: '#374151' }}>
                      Số lượng <span style={{color: '#ef4444'}}>*</span>
                    </label>
                    <input
                      type="number"
                      value={editInventory.quantity || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setEditInventory({ quantity: value });
                        if (editInventoryErrors.quantity) {
                          setEditInventoryErrors({ ...editInventoryErrors, quantity: '' });
                        }
                      }}
                      placeholder="Nhập số lượng xe"
                      min="0"
                      className={editInventoryErrors.quantity ? styles.inputError : ''}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: editInventoryErrors.quantity ? '2px solid #ef4444' : '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '14px'
                      }}
                    />
                    {editInventoryErrors.quantity && (
                      <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                        <i className="fas fa-exclamation-circle"></i> {editInventoryErrors.quantity}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowEditInventoryModal(false);
                    setEditingInventoryItem(null);
                    setEditInventory({ quantity: 0 });
                    setEditInventoryErrors({});
                  }}
                  disabled={isUpdatingInventory}
                >
                  Hủy
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={async () => {
                    // Validation
                    const errors: Record<string, string> = {};
                    if (!editInventory.quantity || editInventory.quantity < 0) {
                      errors.quantity = 'Số lượng không được để trống và phải >= 0';
                    }

                    if (Object.keys(errors).length > 0) {
                      setEditInventoryErrors(errors);
                      return;
                    }

                    setIsUpdatingInventory(true);
                    try {
                      await updateInventoryRecord(editingInventoryItem.vehicleId, editInventory);
                      setShowEditInventoryModal(false);
                      setEditingInventoryItem(null);
                      setEditInventory({ quantity: 0 });
                      setEditInventoryErrors({});
                      setNotification({
                        isVisible: true,
                        message: 'Cập nhật tồn kho thành công!',
                        type: 'success'
                      });
                      await reloadInventory();
                    } catch (error) {
                      console.error('Update inventory error:', error);
                      setNotification({
                        isVisible: true,
                        message: 'Cập nhật tồn kho thất bại!',
                        type: 'error'
                      });
                    } finally {
                      setIsUpdatingInventory(false);
                    }
                  }}
                  disabled={isUpdatingInventory}
                >
                  {isUpdatingInventory ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Inventory Modal */}
        {showViewInventoryModal && selectedInventoryItem && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: '600px' }}>
              <div className={styles.modalHeader}>
                <h2>
                  <i className="fas fa-info-circle"></i>
                  Chi tiết tồn kho
                </h2>
                <button
                  className={styles.closeButton}
                  onClick={() => {
                    setShowViewInventoryModal(false);
                    setSelectedInventoryItem(null);
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.carDetails}>
                  {/* Vehicle ID */}
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>
                      <i className="fas fa-hashtag"></i>
                      Vehicle ID
                    </div>
                    <div className={styles.detailValue}>#{selectedInventoryItem.vehicleId}</div>
                  </div>

                  {/* Vehicle Name */}
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>
                      <i className="fas fa-car"></i>
                      Tên xe
                    </div>
                    <div className={styles.detailValue} style={{fontWeight: 'bold', fontSize: '16px'}}>
                      {formatVehicleDisplayName(selectedInventoryItem)}
                    </div>
                  </div>

                  <div className={styles.divider}></div>

                  {/* Quantity */}
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>
                      <i className="fas fa-boxes"></i>
                      Số lượng tồn kho
                    </div>
                    <div className={styles.detailValue} style={{
                      fontWeight: 'bold',
                      fontSize: '18px',
                      color: selectedInventoryItem.quantity > 50 ? '#065f46' : selectedInventoryItem.quantity > 20 ? '#92400e' : '#991b1b'
                    }}>
                      {selectedInventoryItem.quantity} xe
                    </div>
                  </div>

                  {/* Status */}
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>
                      <i className="fas fa-toggle-on"></i>
                      Trạng thái
                    </div>
                    <div className={styles.detailValue}>
                      <span className={`${styles.statusBadge} ${selectedInventoryItem.quantity > 20 ? styles.active : selectedInventoryItem.quantity > 0 ? styles.warning : styles.inactive}`}
                        style={{ padding: '6px 16px', fontSize: '13px', fontWeight: 700 }}>
                        <i className={`fas ${selectedInventoryItem.quantity > 20 ? 'fa-check-circle' : selectedInventoryItem.quantity > 0 ? 'fa-exclamation-triangle' : 'fa-times-circle'}`}
                           style={{ marginRight: '6px' }}></i>
                        {selectedInventoryItem.quantity > 20 ? 'Còn hàng' : selectedInventoryItem.quantity > 0 ? 'Sắp hết' : 'Hết hàng'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowViewInventoryModal(false);
                    setSelectedInventoryItem(null);
                  }}
                >
                  Đóng
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={() => {
                    setShowViewInventoryModal(false);
                    setEditingInventoryItem(selectedInventoryItem);
                    setEditInventory({ quantity: selectedInventoryItem.quantity });
                    setEditInventoryErrors({});
                    setSelectedInventoryItem(null);
                    setShowEditInventoryModal(true);
                  }}
                >
                  <i className="fas fa-edit"></i>
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Discount Modal */}
        {showAddDiscountModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: '600px' }}>
              <div className={styles.modalHeader}>
                <h2>
                  <i className="fas fa-percentage"></i>
                  Thêm chính sách chiết khấu mới
                </h2>
                <button
                  className={styles.closeButton}
                  onClick={() => {
                    setShowAddDiscountModal(false);
                    setNewDiscount({
                      minQuantity: 0,
                      maxQuantity: 0,
                      discountRate: 0,
                      description: '',
                      isActive: true
                    });
                    setNewDiscountErrors({});
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.modalBody} style={{ maxHeight: '500px', overflowY: 'auto', padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block', color: '#374151' }}>
                      Mô tả <span style={{color: '#ef4444'}}>*</span>
                    </label>
                    <input
                      type="text"
                      value={newDiscount.description}
                      onChange={(e) => {
                        setNewDiscount({ ...newDiscount, description: e.target.value });
                        if (newDiscountErrors.description) {
                          setNewDiscountErrors({ ...newDiscountErrors, description: '' });
                        }
                      }}
                      placeholder="VD: 5% discount for orders of 1-5 vehicles"
                      className={newDiscountErrors.description ? styles.inputError : ''}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: newDiscountErrors.description ? '2px solid #ef4444' : '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '14px'
                      }}
                    />
                    {newDiscountErrors.description && (
                      <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                        <i className="fas fa-exclamation-circle"></i> {newDiscountErrors.description}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className={styles.formGroup}>
                      <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block', color: '#374151' }}>
                        Số lượng tối thiểu <span style={{color: '#ef4444'}}>*</span>
                      </label>
                      <input
                        type="number"
                        value={newDiscount.minQuantity || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          setNewDiscount({ ...newDiscount, minQuantity: value });
                          if (newDiscountErrors.minQuantity) {
                            setNewDiscountErrors({ ...newDiscountErrors, minQuantity: '' });
                          }
                        }}
                        placeholder="VD: 1"
                        min="1"
                        className={newDiscountErrors.minQuantity ? styles.inputError : ''}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: newDiscountErrors.minQuantity ? '2px solid #ef4444' : '2px solid #e5e7eb',
                          borderRadius: '10px',
                          fontSize: '14px'
                        }}
                      />
                      {newDiscountErrors.minQuantity && (
                        <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                          <i className="fas fa-exclamation-circle"></i> {newDiscountErrors.minQuantity}
                        </span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block', color: '#374151' }}>
                        Số lượng tối đa <span style={{color: '#ef4444'}}>*</span>
                      </label>
                      <input
                        type="number"
                        value={newDiscount.maxQuantity || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          setNewDiscount({ ...newDiscount, maxQuantity: value });
                          if (newDiscountErrors.maxQuantity) {
                            setNewDiscountErrors({ ...newDiscountErrors, maxQuantity: '' });
                          }
                        }}
                        placeholder="VD: 5"
                        min="1"
                        className={newDiscountErrors.maxQuantity ? styles.inputError : ''}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: newDiscountErrors.maxQuantity ? '2px solid #ef4444' : '2px solid #e5e7eb',
                          borderRadius: '10px',
                          fontSize: '14px'
                        }}
                      />
                      {newDiscountErrors.maxQuantity && (
                        <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                          <i className="fas fa-exclamation-circle"></i> {newDiscountErrors.maxQuantity}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block', color: '#374151' }}>
                      Tỷ lệ giảm giá (%) <span style={{color: '#ef4444'}}>*</span>
                    </label>
                    <input
                      type="number"
                      value={newDiscount.discountRate ? (newDiscount.discountRate * 100) : ''}
                      onChange={(e) => {
                        const percentValue = parseFloat(e.target.value);
                        // Convert percent to decimal (5% -> 0.05)
                        const decimalValue = percentValue / 100;
                        setNewDiscount({ ...newDiscount, discountRate: decimalValue });
                        if (newDiscountErrors.discountRate) {
                          setNewDiscountErrors({ ...newDiscountErrors, discountRate: '' });
                        }
                      }}
                      placeholder="VD: 5, 10, 15, 20..."
                      min="0"
                      max="100"
                      step="0.01"
                      className={newDiscountErrors.discountRate ? styles.inputError : ''}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: newDiscountErrors.discountRate ? '2px solid #ef4444' : '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '14px'
                      }}
                    />
                    {newDiscountErrors.discountRate && (
                      <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                        <i className="fas fa-exclamation-circle"></i> {newDiscountErrors.discountRate}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={newDiscount.isActive}
                        onChange={(e) => {
                          setNewDiscount({ ...newDiscount, isActive: e.target.checked });
                        }}
                        style={{
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer'
                        }}
                      />
                      <span>Kích hoạt ngay</span>
                    </label>
                    <small style={{ color: '#6b7280', fontSize: '13px', display: 'block', marginTop: '4px' }}>
                      Chính sách sẽ được áp dụng ngay sau khi tạo
                    </small>
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowAddDiscountModal(false);
                    setNewDiscount({
                      minQuantity: 0,
                      maxQuantity: 0,
                      discountRate: 0,
                      description: '',
                      isActive: true
                    });
                    setNewDiscountErrors({});
                  }}
                  disabled={isCreatingDiscount}
                >
                  Hủy
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={async () => {
                    // Validation
                    const errors: Record<string, string> = {};
                    if (!newDiscount.description || !newDiscount.description.trim()) {
                      errors.description = 'Mô tả không được để trống';
                    }
                    if (!newDiscount.minQuantity || newDiscount.minQuantity <= 0) {
                      errors.minQuantity = 'Số lượng tối thiểu phải lớn hơn 0';
                    }
                    if (!newDiscount.maxQuantity || newDiscount.maxQuantity <= 0) {
                      errors.maxQuantity = 'Số lượng tối đa phải lớn hơn 0';
                    }
                    if (newDiscount.minQuantity && newDiscount.maxQuantity && newDiscount.minQuantity > newDiscount.maxQuantity) {
                      errors.maxQuantity = 'Số lượng tối đa phải lớn hơn hoặc bằng số lượng tối thiểu';
                    }
                    // discountRate is stored as decimal (0.05 = 5%), so check 0-1 range
                    if (!newDiscount.discountRate || newDiscount.discountRate <= 0 || newDiscount.discountRate > 1) {
                      errors.discountRate = 'Tỷ lệ giảm giá phải từ 0-100%';
                    }

                    if (Object.keys(errors).length > 0) {
                      setNewDiscountErrors(errors);
                      return;
                    }

                    setIsCreatingDiscount(true);
                    try {
                      await createDiscountPolicy(newDiscount);
                      setShowAddDiscountModal(false);
                      setNewDiscount({
                        minQuantity: 0,
                        maxQuantity: 0,
                        discountRate: 0,
                        description: '',
                        isActive: true
                      });
                      setNewDiscountErrors({});
                      setNotification({
                        isVisible: true,
                        message: 'Thêm chính sách chiết khấu thành công!',
                        type: 'success'
                      });
                      await reloadDiscounts();
                    } catch (error) {
                      console.error('Create discount error:', error);
                      setNotification({
                        isVisible: true,
                        message: 'Thêm chính sách chiết khấu thất bại!',
                        type: 'error'
                      });
                    } finally {
                      setIsCreatingDiscount(false);
                    }
                  }}
                  disabled={isCreatingDiscount}
                >
                  {isCreatingDiscount ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Đang thêm...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus"></i>
                      Thêm chính sách
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Discount Modal */}
        {showEditDiscountModal && editingDiscount && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: '600px' }}>
              <div className={styles.modalHeader}>
                <h2>
                  <i className="fas fa-edit"></i>
                  Chỉnh sửa chính sách chiết khấu
                </h2>
                <button
                  className={styles.closeButton}
                  onClick={() => {
                    setShowEditDiscountModal(false);
                    setEditingDiscount(null);
                    setEditDiscount({
                      minQuantity: 0,
                      maxQuantity: 0,
                      discountRate: 0,
                      description: '',
                      isActive: true
                    });
                    setEditDiscountErrors({});
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.modalBody} style={{ maxHeight: '500px', overflowY: 'auto', padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Description Field */}
                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block', color: '#374151' }}>
                      Mô tả chính sách <span style={{color: '#ef4444'}}>*</span>
                    </label>
                    <input
                      type="text"
                      value={editDiscount.description}
                      onChange={(e) => {
                        setEditDiscount({ ...editDiscount, description: e.target.value });
                        if (editDiscountErrors.description) {
                          setEditDiscountErrors({ ...editDiscountErrors, description: '' });
                        }
                      }}
                      placeholder="VD: Giảm 5% cho đơn hàng từ 1-5 xe"
                      className={editDiscountErrors.description ? styles.inputError : ''}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: editDiscountErrors.description ? '2px solid #ef4444' : '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '14px'
                      }}
                    />
                    {editDiscountErrors.description && (
                      <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                        <i className="fas fa-exclamation-circle"></i> {editDiscountErrors.description}
                      </span>
                    )}
                  </div>

                  {/* Quantity Range - Grid Layout */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Min Quantity */}
                    <div className={styles.formGroup}>
                      <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block', color: '#374151' }}>
                        Số lượng tối thiểu <span style={{color: '#ef4444'}}>*</span>
                      </label>
                      <input
                        type="number"
                        value={editDiscount.minQuantity || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          setEditDiscount({ ...editDiscount, minQuantity: value });
                          if (editDiscountErrors.minQuantity) {
                            setEditDiscountErrors({ ...editDiscountErrors, minQuantity: '' });
                          }
                        }}
                        placeholder="VD: 1"
                        min="0"
                        className={editDiscountErrors.minQuantity ? styles.inputError : ''}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: editDiscountErrors.minQuantity ? '2px solid #ef4444' : '2px solid #e5e7eb',
                          borderRadius: '10px',
                          fontSize: '14px'
                        }}
                      />
                      {editDiscountErrors.minQuantity && (
                        <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                          <i className="fas fa-exclamation-circle"></i> {editDiscountErrors.minQuantity}
                        </span>
                      )}
                    </div>

                    {/* Max Quantity */}
                    <div className={styles.formGroup}>
                      <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block', color: '#374151' }}>
                        Số lượng tối đa <span style={{color: '#ef4444'}}>*</span>
                      </label>
                      <input
                        type="number"
                        value={editDiscount.maxQuantity || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          setEditDiscount({ ...editDiscount, maxQuantity: value });
                          if (editDiscountErrors.maxQuantity) {
                            setEditDiscountErrors({ ...editDiscountErrors, maxQuantity: '' });
                          }
                        }}
                        placeholder="VD: 5"
                        min="0"
                        className={editDiscountErrors.maxQuantity ? styles.inputError : ''}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: editDiscountErrors.maxQuantity ? '2px solid #ef4444' : '2px solid #e5e7eb',
                          borderRadius: '10px',
                          fontSize: '14px'
                        }}
                      />
                      {editDiscountErrors.maxQuantity && (
                        <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                          <i className="fas fa-exclamation-circle"></i> {editDiscountErrors.maxQuantity}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Discount Rate with Percentage Conversion */}
                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block', color: '#374151' }}>
                      Tỷ lệ giảm giá (%) <span style={{color: '#ef4444'}}>*</span>
                    </label>
                    <input
                      type="number"
                      value={editDiscount.discountRate ? (editDiscount.discountRate * 100) : ''}
                      onChange={(e) => {
                        const percentValue = parseFloat(e.target.value);
                        const decimalValue = percentValue / 100;
                        setEditDiscount({ ...editDiscount, discountRate: decimalValue });
                        if (editDiscountErrors.discountRate) {
                          setEditDiscountErrors({ ...editDiscountErrors, discountRate: '' });
                        }
                      }}
                      placeholder="Nhập phần trăm giảm giá (VD: 5 cho 5%)"
                      min="0"
                      max="100"
                      step="0.01"
                      className={editDiscountErrors.discountRate ? styles.inputError : ''}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: editDiscountErrors.discountRate ? '2px solid #ef4444' : '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '14px'
                      }}
                    />
                    {editDiscountErrors.discountRate && (
                      <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                        <i className="fas fa-exclamation-circle"></i> {editDiscountErrors.discountRate}
                      </span>
                    )}
                  </div>

                  {/* Active Status Checkbox */}
                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#374151', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editDiscount.isActive}
                        onChange={(e) => setEditDiscount({ ...editDiscount, isActive: e.target.checked })}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: '#ff4d30'
                        }}
                      />
                      <span>Kích hoạt chính sách</span>
                    </label>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', marginLeft: '26px' }}>
                      Chính sách sẽ {editDiscount.isActive ? 'được áp dụng' : 'không được áp dụng'} ngay sau khi lưu
                    </p>
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowEditDiscountModal(false);
                    setEditingDiscount(null);
                    setEditDiscount({
                      minQuantity: 0,
                      maxQuantity: 0,
                      discountRate: 0,
                      description: '',
                      isActive: true
                    });
                    setEditDiscountErrors({});
                  }}
                  disabled={isUpdatingDiscount}
                >
                  Hủy
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={async () => {
                    // Validation
                    const errors: Record<string, string> = {};

                    if (!editDiscount.description || !editDiscount.description.trim()) {
                      errors.description = 'Mô tả chính sách không được để trống';
                    }

                    if (editDiscount.minQuantity === undefined || editDiscount.minQuantity < 0) {
                      errors.minQuantity = 'Số lượng tối thiểu phải lớn hơn hoặc bằng 0';
                    }

                    if (editDiscount.maxQuantity === undefined || editDiscount.maxQuantity < 0) {
                      errors.maxQuantity = 'Số lượng tối đa phải lớn hơn hoặc bằng 0';
                    }

                    if (editDiscount.minQuantity !== undefined && editDiscount.maxQuantity !== undefined &&
                        editDiscount.minQuantity > editDiscount.maxQuantity) {
                      errors.maxQuantity = 'Số lượng tối đa phải lớn hơn hoặc bằng số lượng tối thiểu';
                    }

                    if (!editDiscount.discountRate || editDiscount.discountRate <= 0 || editDiscount.discountRate > 1) {
                      errors.discountRate = 'Tỷ lệ giảm giá phải từ 0-100%';
                    }

                    if (Object.keys(errors).length > 0) {
                      setEditDiscountErrors(errors);
                      return;
                    }

                    setIsUpdatingDiscount(true);
                    try {
                      await updateDiscountPolicy(editingDiscount.id, editDiscount);
                      setShowEditDiscountModal(false);
                      setEditingDiscount(null);
                      setEditDiscount({
                        minQuantity: 0,
                        maxQuantity: 0,
                        discountRate: 0,
                        description: '',
                        isActive: true
                      });
                      setEditDiscountErrors({});
                      setNotification({
                        isVisible: true,
                        message: 'Cập nhật chính sách chiết khấu thành công!',
                        type: 'success'
                      });
                      await reloadDiscounts();
                    } catch (error) {
                      console.error('Update discount error:', error);
                      setNotification({
                        isVisible: true,
                        message: 'Cập nhật chính sách chiết khấu thất bại!',
                        type: 'error'
                      });
                    } finally {
                      setIsUpdatingDiscount(false);
                    }
                  }}
                  disabled={isUpdatingDiscount}
                >
                  {isUpdatingDiscount ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Discount Modal */}
        {showViewDiscountModal && selectedDiscount && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: '600px' }}>
              <div className={styles.modalHeader}>
                <h2>
                  <i className="fas fa-info-circle"></i>
                  Chi tiết chính sách chiết khấu
                </h2>
                <button
                  className={styles.closeButton}
                  onClick={() => {
                    setShowViewDiscountModal(false);
                    setSelectedDiscount(null);
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.carDetails}>
                  {/* Policy ID */}
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>
                      <i className="fas fa-hashtag"></i>
                      ID Chính sách
                    </div>
                    <div className={styles.detailValue}>#{selectedDiscount.id}</div>
                  </div>

                  {/* Description */}
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>
                      <i className="fas fa-align-left"></i>
                      Mô tả
                    </div>
                    <div className={styles.detailValue} style={{fontWeight: 'bold', fontSize: '16px'}}>
                      {selectedDiscount.description}
                    </div>
                  </div>

                  <div className={styles.divider}></div>

                  {/* Min Quantity */}
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>
                      <i className="fas fa-arrow-down"></i>
                      Số lượng tối thiểu
                    </div>
                    <div className={styles.detailValue} style={{fontWeight: 'bold'}}>
                      {selectedDiscount.minQuantity} xe
                    </div>
                  </div>

                  {/* Max Quantity */}
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>
                      <i className="fas fa-arrow-up"></i>
                      Số lượng tối đa
                    </div>
                    <div className={styles.detailValue} style={{fontWeight: 'bold'}}>
                      {selectedDiscount.maxQuantity >= 2147483647
                        ? 'Không giới hạn'
                        : `${selectedDiscount.maxQuantity} xe`
                      }
                    </div>
                  </div>

                  {/* Discount Rate */}
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>
                      <i className="fas fa-percentage"></i>
                      Tỷ lệ giảm giá
                    </div>
                    <div className={styles.detailValue} style={{
                      fontWeight: 'bold',
                      fontSize: '20px',
                      color: '#065f46'
                    }}>
                      {(selectedDiscount.discountRate * 100).toFixed(2)}%
                    </div>
                  </div>

                  <div className={styles.divider}></div>

                  {/* Status */}
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>
                      <i className="fas fa-toggle-on"></i>
                      Trạng thái
                    </div>
                    <div className={styles.detailValue}>
                      <span className={`${styles.statusBadge} ${selectedDiscount.isActive ? styles.active : styles.inactive}`}
                        style={{ padding: '6px 16px', fontSize: '13px', fontWeight: 700 }}>
                        <i className={`fas ${selectedDiscount.isActive ? 'fa-check-circle' : 'fa-times-circle'}`}
                           style={{ marginRight: '6px' }}></i>
                        {selectedDiscount.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowViewDiscountModal(false);
                    setSelectedDiscount(null);
                  }}
                >
                  Đóng
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={() => {
                    setShowViewDiscountModal(false);
                    setEditingDiscount(selectedDiscount);
                    setEditDiscount({
                      minQuantity: selectedDiscount.minQuantity,
                      maxQuantity: selectedDiscount.maxQuantity,
                      discountRate: selectedDiscount.discountRate,
                      description: selectedDiscount.description,
                      isActive: selectedDiscount.isActive
                    });
                    setEditDiscountErrors({});
                    setSelectedDiscount(null);
                    setShowEditDiscountModal(true);
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

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText="OK"
        cancelText="Hủy"
      />
    </AdminLayout>
  );
};

export default AdminPage;