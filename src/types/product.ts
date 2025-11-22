// API Response - đúng như backend trả về
export interface VehicleApiResponse {
  vehicleId: number;
  modelName: string;
  version: string;
  color: string;
  // Optional image URL provided by backend
  imageUrl?: string;
  batteryCapacityKwh: number;
  rangeKm: number;
  maxSpeedKmh: number;
  chargingTimeHours: number;
  seatingCapacity: number;
  motorPowerKw: number;
  weightKg: number;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  priceRetail: number;
  finalPrice: number; // Giá cuối cùng sau khuyến mãi
  status: 'AVAILABLE' | 'DISCONTINUED';
  manufactureYear?: number; // Optional field
}

export interface ApiListResponse {
  statusCode: number;
  message: string;
  data: VehicleApiResponse[];
  totalElements?: number; // Tổng số phần tử (nếu API trả về)
  totalPages?: number; // Tổng số trang (nếu API trả về)
}

// API Response cho create vehicle
export interface ApiCreateResponse {
  statusCode: number;
  message: string;
  data?: VehicleApiResponse | VehicleApiResponse[];
  vehicleId?: number;
}

// Color variant cho một màu xe cụ thể
export interface ColorVariant {
  vehicleId: number;
  color: string;
  colorHex: string; // Mã màu hex để hiển thị
  colorGradient?: string; // Gradient cho màu metallic
  priceRetail: number;
  finalPrice: number;
  imageUrl?: string;
  inStock: boolean;
}

// UI Product - đơn giản cho hiển thị
export interface Product {
  id: string;
  name: string;
  variant: string;
  slug: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  
  // Specs cơ bản
  rangeKm: number;
  battery: string;
  motor: string;
  fastCharge: string;
  warranty: string;
  driveType: 'FWD' | 'RWD' | 'AWD';
  
  // Status
  inStock: boolean;
  isPopular?: boolean;
  hasDiscount?: boolean;
  tags: string[];
  
  // Info cơ bản
  description: string;
  features: string[];
  createdAt: string;
  
  // Color variants - THÊM MỚI
  colorVariants?: ColorVariant[];
  selectedColor?: string; // Màu đang được chọn
}

// Filters cho UI
export interface ProductFilters {
  q?: string;
  priceMin?: number;
  priceMax?: number;
}

// Sort
export interface ProductSort {
  field: 'price' | 'name';
  order: 'asc' | 'desc';
}

// API params
export interface ApiParams {
  page?: number;
  size?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
}