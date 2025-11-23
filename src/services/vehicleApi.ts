import type { VehicleApiResponse, ApiCreateResponse, Product, ApiParams, ApiListResponse, ColorVariant } from '../types/product';
import { getColorStyle } from '../utils/colorMapping';

const API_BASE_URL = 'http://localhost:8080/api';

// Convert API vehicle data to UI Product format - chỉ dùng data từ API
export function convertVehicleToProduct(vehicle: VehicleApiResponse): Product {
  const hasDiscount = vehicle.finalPrice > 0 && vehicle.finalPrice < vehicle.priceRetail;
  const imageUrl = vehicle.imageUrl || `/src/images/cars-big/car-${vehicle.vehicleId}.jpg`;

  return {
    id: vehicle.vehicleId.toString(),
    name: `${vehicle.modelName} ${vehicle.version}`,
    variant: vehicle.version,
    slug: `${vehicle.modelName.toLowerCase().replace(/\s+/g, '-')}-${vehicle.version.toLowerCase()}`,
    price: vehicle.finalPrice > 0 ? vehicle.finalPrice : vehicle.priceRetail,
    originalPrice: hasDiscount ? vehicle.priceRetail : undefined,
    image: imageUrl,
    images: [imageUrl],

    // Specs từ API
    rangeKm: vehicle.rangeKm,
    battery: `${vehicle.batteryCapacityKwh} kWh`,
    motor: `${vehicle.motorPowerKw} kW`,
    fastCharge: `${vehicle.chargingTimeHours}h`,
    warranty: '8 years',
    driveType: 'AWD' as const,
    
    // Status từ API
    inStock: vehicle.status === 'AVAILABLE',
    isPopular: false,
    hasDiscount: hasDiscount,
    tags: [vehicle.color.toLowerCase()],
    
    // Minimal info
    description: `${vehicle.modelName} ${vehicle.version} - ${vehicle.color}`,
    features: [`${vehicle.seatingCapacity} seats`, `${vehicle.rangeKm}km range`],
    createdAt: new Date().toISOString(),

    // Color variants - sẽ được thêm bởi groupVehiclesByModel
    colorVariants: [],
    selectedColor: vehicle.color,
  };
}

/**
 * Group vehicles theo modelName + version, tạo color variants
 */
export function groupVehiclesByModel(vehicles: VehicleApiResponse[]): Product[] {
  // Group theo modelName + version
  const grouped = new Map<string, VehicleApiResponse[]>();

  vehicles.forEach(vehicle => {
    const key = `${vehicle.modelName}-${vehicle.version}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(vehicle);
  });


  // Convert mỗi group thành 1 Product với color variants
  const products: Product[] = [];

  grouped.forEach((vehicleGroup) => {
    // Sắp xếp theo giá để lấy xe rẻ nhất làm default
    vehicleGroup.sort((a, b) => {
      const priceA = a.finalPrice > 0 ? a.finalPrice : a.priceRetail;
      const priceB = b.finalPrice > 0 ? b.finalPrice : b.priceRetail;
      return priceA - priceB;
    });

    const defaultVehicle = vehicleGroup[0]; // Xe đầu tiên (rẻ nhất) làm default

    // Tạo color variants
    const colorVariants: ColorVariant[] = vehicleGroup.map(vehicle => {
      const colorStyle = getColorStyle(vehicle.color);
      return {
        vehicleId: vehicle.vehicleId,
        color: vehicle.color,
        colorHex: colorStyle.solid,
        colorGradient: colorStyle.gradient,
        priceRetail: vehicle.priceRetail,
        finalPrice: vehicle.finalPrice,
        imageUrl: vehicle.imageUrl,
        inStock: vehicle.status === 'AVAILABLE',
      };
    });

    // Convert vehicle đầu tiên thành Product
    const product = convertVehicleToProduct(defaultVehicle);

    // Thêm color variants
    product.colorVariants = colorVariants;
    product.selectedColor = defaultVehicle.color;

    // Cập nhật tags để include tất cả màu
    product.tags = vehicleGroup.map(v => v.color.toLowerCase());


    products.push(product);
  });

  return products;
}

// Fetch vehicles from API
export async function fetchVehiclesFromApi(params: ApiParams = {}): Promise<{ vehicles: VehicleApiResponse[], total: number }> {
  const queryParams = new URLSearchParams();
  
  // Page và size - API sử dụng page từ 0
  if (params.page !== undefined) queryParams.append('page', params.page.toString());
  if (params.size) queryParams.append('size', params.size.toString());

  // Search parameters (nếu API hỗ trợ)
  if (params.search) queryParams.append('search', params.search);
  if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
  if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
  if (params.status) queryParams.append('status', params.status);

  const url = `${API_BASE_URL}/vehicles?${queryParams.toString()}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: ApiListResponse = await response.json();

    // Kiểm tra response structure
    if (data.statusCode !== 200) {
      throw new Error(`API error: ${data.message}`);
    }

    if (!Array.isArray(data.data)) {
      throw new Error('Invalid API response: data is not an array');
    }

    // Return vehicles và total
    // Nếu API trả về totalElements thì dùng, không thì dùng length của array
    const total = data.totalElements !== undefined ? data.totalElements : data.data.length;

    return {
      vehicles: data.data,
      total: total,
    };
  } catch (error) {
    console.error('❌ API Error:', error);
    throw error;
  }
}

// Type for creating vehicle with multiple colors - NEW API FORMAT
export interface CreateVehicleRequest {
  modelName: string;
  version: string;
  colors: Array<{
    colorId: number;
    imageUrl: string; // Can be URL string or base64 string
  }>;
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
  manufactureYear: number;
}

// Response type when creating multiple vehicles
export interface CreateVehiclesResponse {
  statusCode: number;
  message: string;
  data: VehicleApiResponse[];
}

// Type for updating a single vehicle by ID - API expects colors array
export interface UpdateVehicleRequest {
  modelName: string;
  version: string;
  colors: Array<{
    colorId: number;
    imageUrl: string; // URL or base64 string
  }>;
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
  manufactureYear: number;
}

// Create new vehicle in database
export async function createVehicle(vehicleData: CreateVehicleRequest): Promise<CreateVehiclesResponse | VehicleApiResponse | VehicleApiResponse[]> {
  const url = `${API_BASE_URL}/vehicles`;
  
  // Loại bỏ các field undefined/null
  const cleanedData = Object.fromEntries(
    Object.entries(vehicleData).filter(([_, value]) => value !== undefined && value !== null)
  );
  
  // Get authentication token
  const accessToken = localStorage.getItem('accessToken');
  const legacyToken = localStorage.getItem('token');
  const token = accessToken || legacyToken;

  if (!token) {
    throw new Error('Vui lòng đăng nhập để tạo xe mới');
  }
  

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(cleanedData),
    });

    // Xử lý response text trước khi parse JSON
    const responseText = await response.text();

    if (!response.ok) {
      // Thử parse error response
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ API Error Response:', errorData);
        console.error('❌ Full error details:', JSON.stringify(errorData, null, 2));
        
        // Trả về thông báo lỗi chi tiết từ API
        if (errorData.message) {
          throw new Error(`API Error (${response.status}): ${errorData.message}`);
        } else if (errorData.error) {
          throw new Error(`API Error (${response.status}): ${errorData.error}`);
        } else {
          throw new Error(`API Error (${response.status}): ${response.statusText}`);
        }
      } catch (parseError) {
        // Nếu không parse được JSON, log raw response
        console.error('❌ Raw error response:', responseText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}. Response: ${responseText}`);
      }
    }

    // Parse successful response
    let data: ApiCreateResponse;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error('Invalid JSON response from server');
    }


    // Xử lý các format response khác nhau

    // Format 1: Response với statusCode + data array (như trong hình API - ưu tiên cao nhất)
    // { statusCode: 201, message: "Vehicles created", data: [...] }
    if ((data.statusCode === 200 || data.statusCode === 201) && data.data && Array.isArray(data.data)) {
      return {
        statusCode: data.statusCode,
        message: data.message || 'Vehicles created',
        data: data.data
      } as CreateVehiclesResponse;
    }
    // Format 2: ApiCreateResponse với data object (single vehicle)
    else if ((data.statusCode === 200 || data.statusCode === 201) && data.data && typeof data.data === 'object' && !Array.isArray(data.data) && 'vehicleId' in data.data) {
      return data.data as VehicleApiResponse;
    }
    // Format 3: Direct VehicleApiResponse
    else if ('vehicleId' in data && 'modelName' in data) {
      return data as unknown as VehicleApiResponse;
    }
    // Format 4: Response với message thành công nhưng không có data chi tiết
    else if (data.statusCode === 200 || data.statusCode === 201) {
      throw new Error('API created vehicle successfully but did not return vehicle data');
    }
    
    console.error('❌ Unhandled response format:', data);
    throw new Error('API did not return created vehicle data in expected format');
  } catch (error) {
    console.error('❌ Create Vehicle Error:', error);
    
    // Re-throw với thông báo lỗi chi tiết hơn
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error occurred while creating vehicle');
    }
  }
}

// Get vehicle by ID for detail view
export async function getVehicleById(vehicleId: number): Promise<VehicleApiResponse> {
  const url = `${API_BASE_URL}/vehicles/${vehicleId}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Xử lý response format từ API
    let vehicleData: VehicleApiResponse | null = null;

    // Format 1: ApiListResponse với data array
    if (data.statusCode === 200 && data.data && Array.isArray(data.data) && data.data.length > 0) {
      vehicleData = data.data[0];
    }
    // Format 2: Direct VehicleApiResponse
    else if (data.vehicleId && data.modelName) {
      vehicleData = data;
    }
    // Format 3: Data object trực tiếp
    else if (data.data && data.data.vehicleId) {
      vehicleData = data.data;
    }

    if (vehicleData) {
      return vehicleData;
    }
    
    throw new Error('Vehicle not found in response');
  } catch (error) {
    console.error('❌ Get Vehicle by ID Error:', error);
    throw error;
  }
}

// Update vehicle by ID - Updates a single vehicle
export async function updateVehicle(vehicleId: number, vehicleData: UpdateVehicleRequest): Promise<VehicleApiResponse> {
  const url = `${API_BASE_URL}/vehicles/${vehicleId}`;

  // Clean data - remove undefined/null
  const cleanedData = Object.fromEntries(
    Object.entries(vehicleData).filter(([_, value]) => value !== undefined && value !== null)
  );

  // Get authentication token
  const accessToken = localStorage.getItem('accessToken');
  const legacyToken = localStorage.getItem('token');
  const token = accessToken || legacyToken;

  if (!token) {
    throw new Error('Vui lòng đăng nhập để cập nhật xe');
  }


  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(cleanedData),
    });

    const responseText = await response.text();

    if (!response.ok) {
      const errorText = responseText;
      console.error('❌ Update Vehicle Error Response:', errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    // Parse response
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error('Invalid JSON response from server');
    }


    // Handle different response formats
    let updatedVehicle: VehicleApiResponse | null = null;

    // Format 1: Response with statusCode and data object
    if ((data.statusCode === 200 || data.statusCode === 0) && data.data && typeof data.data === 'object') {
      if ('vehicleId' in data.data) {
        updatedVehicle = data.data;
      }
    }
    // Format 2: Direct VehicleApiResponse
    else if (data.vehicleId && data.modelName) {
      updatedVehicle = data;
    }
    // Format 3: Success message without detailed data
    else if (data.statusCode === 200 || data.statusCode === 0) {
      // Refetch the vehicle to get updated data
      return await getVehicleById(vehicleId);
    }

    if (updatedVehicle) {
      return updatedVehicle;
    }
    
    console.error('❌ Unhandled response format:', data);
    throw new Error('API did not return updated vehicle data');
  } catch (error) {
    console.error('❌ Update Vehicle Error:', error);
    throw error;
  }
}

// Delete vehicle by ID
export async function deleteVehicle(vehicleId: number): Promise<void> {
  const url = `${API_BASE_URL}/vehicles/${vehicleId}`;

  // Get authentication token
  const accessToken = localStorage.getItem('accessToken');
  const legacyToken = localStorage.getItem('token');
  const token = accessToken || legacyToken;

  if (!token) {
    throw new Error('Vui lòng đăng nhập để xóa xe');
  }

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept': '*/*',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Try to parse error response
      let errorMessage = 'Yêu cầu không hợp lệ';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        
        // Check for foreign key constraint violation
        if (errorMessage.includes('foreign key constraint') || 
            errorMessage.includes('manufacturer_inventory') ||
            errorMessage.includes('is still referenced')) {
          throw new Error('Không thể xóa xe này vì còn tồn kho. Vui lòng xóa tồn kho trước khi xóa xe.');
        }
      } catch (e) {
        // If it's already our custom error, re-throw it
        if (e instanceof Error && e.message.includes('tồn kho')) {
          throw e;
        }
        // Otherwise ignore JSON parse error
      }

      // Handle specific error cases
      if (response.status === 404) {
        throw new Error(`Xe không tồn tại với ID: ${vehicleId}`);
      } else if (response.status === 400) {
        throw new Error(errorMessage);
      } else if (response.status === 403) {
        throw new Error('Không có quyền xóa xe này');
      } else if (response.status === 500) {
        throw new Error('Lỗi máy chủ, vui lòng thử lại sau');
      } else {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
    }

  } catch (error) {
    console.error('❌ Delete Vehicle Error:', error);
    throw error;
  }
}

// Main function to get products from API
export async function getProductsFromApi(
  page: number = 1,
  pageSize: number = 12,
  search?: string,
  minPrice?: number,
  maxPrice?: number,
  status?: string
): Promise<{ products: Product[], total: number, totalPages: number }> {

  try {
    const { vehicles, total } = await fetchVehiclesFromApi({
      page,
      size: pageSize,
      search,
      minPrice,
      maxPrice,
      status,
    });

    // Convert vehicles to products
    const products = vehicles.map(convertVehicleToProduct);
    
    // Calculate total pages (API might provide this in future)
    const totalPages = Math.ceil(total / pageSize);

    return {
      products,
      total,
      totalPages,
    };
  } catch (error) {
    console.error('❌ API Failed:', error);
    
    // Return empty result when API fails
    return {
      products: [],
      total: 0,
      totalPages: 0,
    };
  }
}