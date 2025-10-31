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
  status: 'AVAILABLE' | 'DISCONTINUED';
  manufactureYear?: number; // Optional field
}

export interface ApiListResponse {
  statusCode: number;
  message: string;
  data: VehicleApiResponse[];
}

// API Response cho create vehicle
export interface ApiCreateResponse {
  statusCode: number;
  message: string;
  data?: VehicleApiResponse | VehicleApiResponse[];
  vehicleId?: number;
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