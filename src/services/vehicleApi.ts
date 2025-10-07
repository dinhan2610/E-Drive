import type { VehicleApiResponse, ApiListResponse, Product, ApiParams } from '../types/product';

const API_BASE_URL = 'http://localhost:8080/api';

// Convert API vehicle data to UI Product format - chỉ dùng data từ API
export function convertVehicleToProduct(vehicle: VehicleApiResponse): Product {
  return {
    id: vehicle.vehicleId.toString(),
    name: `${vehicle.modelName} ${vehicle.version}`,
    variant: vehicle.version,
    slug: `${vehicle.modelName.toLowerCase().replace(/\s+/g, '-')}-${vehicle.version.toLowerCase()}`,
    price: vehicle.priceRetail,
    originalPrice: vehicle.priceRetail,
    image: `src/images/cars-big/car-${vehicle.vehicleId}.jpg`, // Simple image path
    images: [`src/images/cars-big/car-${vehicle.vehicleId}.jpg`],
    
    // Chỉ dùng data từ API
    rangeKm: vehicle.rangeKm,
    battery: `${vehicle.batteryCapacityKwh} kWh`,
    motor: `${vehicle.motorPowerKw} kW`,
    fastCharge: `${vehicle.chargingTimeHours}h`,
    warranty: '8 years',
    driveType: 'AWD' as const,
    
    // Status từ API
    inStock: vehicle.status === 'AVAILABLE',
    isPopular: false,
    hasDiscount: false,
    tags: [vehicle.color.toLowerCase()],
    
    // Minimal info
    description: `${vehicle.modelName} ${vehicle.version} - ${vehicle.color}`,
    features: [`${vehicle.seatingCapacity} seats`, `${vehicle.rangeKm}km range`],
    createdAt: new Date().toISOString(),
  };
}

// Fetch vehicles from API
export async function fetchVehiclesFromApi(params: ApiParams = {}): Promise<{ vehicles: VehicleApiResponse[], total: number }> {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.size) queryParams.append('size', params.size.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
  if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
  if (params.status) queryParams.append('status', params.status);

  const url = `${API_BASE_URL}/vehicles?${queryParams.toString()}`;
  console.log('🌐 Fetching from API:', url);

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: ApiListResponse = await response.json();
    console.log('✅ API Response:', data);

    if (data.statusCode !== 200) {
      throw new Error(`API error: ${data.message}`);
    }

    return {
      vehicles: data.data,
      total: data.data.length, // API might return total separately in future
    };
  } catch (error) {
    console.error('❌ API Error:', error);
    throw error;
  }
}

// No fallback - chỉ sử dụng API thật

// Main function to get products (replaces the old mock-based function)
export async function getProductsFromApi(
  page: number = 1,
  pageSize: number = 12,
  search?: string,
  minPrice?: number,
  maxPrice?: number,
  status?: string
): Promise<{ products: Product[], total: number, totalPages: number }> {
  console.log('🔄 Getting products from API:', { page, pageSize, search, minPrice, maxPrice, status });

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

    console.log('✅ API Success - Converted to products:', { 
      productsCount: products.length, 
      total, 
      totalPages 
    });

    return {
      products,
      total,
      totalPages,
    };
  } catch (error) {
    console.error('❌ API Failed:', error);
    
    // Return empty result - chỉ dùng API thật
    return {
      products: [],
      total: 0,
      totalPages: 0,
    };
  }
}