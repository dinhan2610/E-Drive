/**
 * Service & Accessory Management API
 * Manages additional services and accessories for vehicle quotes
 */

import apiClient from '../lib/apiClient';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type ServiceCategory = 'protection' | 'charging' | 'warranty' | 'accessory';

export interface ServiceAccessory {
  serviceId: number;
  serviceName: string;
  category: string;
  description?: string;
  price: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Backward compatibility fields
  id?: number;
  name?: string;
  icon?: string;
}

export interface CreateServiceAccessoryDto {
  serviceName: string;
  description: string;
  price: number;
  category: string;
  isActive?: boolean;
}

export interface UpdateServiceAccessoryDto {
  serviceName?: string;
  description?: string;
  price?: number;
  category?: string;
  isActive?: boolean;
}

export interface ServiceAccessoryListParams {
  page?: number;
  size?: number;
  category?: ServiceCategory;
  isActive?: boolean;
  search?: string;
}

export interface PageableResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Helper function to normalize service data from backend
 */
const normalizeService = (service: any): ServiceAccessory => {
  if (!service) {
    throw new Error('Service data is null or undefined');
  }
  
  return {
    ...service,
    id: service.serviceId,
    name: service.serviceName,
    icon: getCategoryIcon(service.category),
  };
};

/**
 * Get all services & accessories with pagination
 * GET /api/additional-services/all?page=1&size=10
 */
export const listAllServiceAccessories = async (
  params: ServiceAccessoryListParams = {}
): Promise<PageableResponse<ServiceAccessory>> => {
  try {
    const { page = 0, size = 100 } = params;
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    const response = await apiClient.get<{ statusCode: number; message: string; data: PageableResponse<any> }>(
      `/api/additional-services/all?${queryParams.toString()}`
    );
    
    // Normalize services data
    const data = response.data.data;
    return {
      ...data,
      content: data.content.map(normalizeService)
    };
  } catch (error: any) {
    console.error('Error fetching all service accessories:', error);
    throw new Error(error.response?.data?.message || 'Không thể tải danh sách dịch vụ & phụ kiện');
  }
};

/**
 * Get only active services & accessories (for CreateQuotePage)
 * GET /api/additional-services/active
 */
export const listActiveServiceAccessories = async (): Promise<ServiceAccessory[]> => {
  try {
    const response = await apiClient.get<{ statusCode: number; message: string; data: any[] }>(
      '/api/additional-services/active'
    );
    return response.data.data.map(normalizeService);
  } catch (error: any) {
    console.error('Error fetching active service accessories:', error);
    throw new Error(error.response?.data?.message || 'Không thể tải danh sách dịch vụ & phụ kiện');
  }
};

/**
 * Get a single service/accessory by ID
 * GET /api/additional-services/{id}
 */
export const getServiceAccessory = async (
  id: number
): Promise<ServiceAccessory> => {
  try {
    const response = await apiClient.get<{ statusCode: number; message: string; data: any }>(
      `/api/additional-services/${id}`
    );
    return normalizeService(response.data.data);
  } catch (error: any) {
    console.error('Error fetching service accessory:', error);
    throw new Error(error.response?.data?.message || 'Không thể tải thông tin dịch vụ/phụ kiện');
  }
};

/**
 * Get services by category ID
 * GET /api/additional-services/category/{categoryId}
 */
export const getServicesByCategory = async (
  categoryId: number
): Promise<ServiceAccessory[]> => {
  try {
    const response = await apiClient.get<{ statusCode: number; message: string; data: any[] }>(
      `/api/additional-services/category/${categoryId}`
    );
    return response.data.data.map(normalizeService);
  } catch (error: any) {
    console.error('Error fetching services by category:', error);
    throw new Error(error.response?.data?.message || 'Không thể tải danh sách dịch vụ theo danh mục');
  }
};

/**
 * Search services with keyword and pagination
 * GET /api/additional-services/search?keyword={keyword}&page={page}&size={size}
 */
export const searchServiceAccessories = async (
  keyword: string,
  page: number = 1,
  size: number = 10
): Promise<PageableResponse<ServiceAccessory>> => {
  try {
    const queryParams = new URLSearchParams({
      keyword: keyword,
      page: page.toString(),
      size: size.toString(),
    });
    
    const response = await apiClient.get<{ statusCode: number; message: string; data: PageableResponse<any> }>(
      `/api/additional-services/search?${queryParams.toString()}`
    );
    
    const data = response.data.data;
    return {
      ...data,
      content: data.content.map(normalizeService)
    };
  } catch (error: any) {
    console.error('Error searching service accessories:', error);
    throw new Error(error.response?.data?.message || 'Không thể tìm kiếm dịch vụ & phụ kiện');
  }
};

/**
 * Create a new service/accessory
 * POST /api/additional-services
 */
export const createServiceAccessory = async (
  data: CreateServiceAccessoryDto
): Promise<ServiceAccessory> => {
  try {
    const response = await apiClient.post<{ statusCode: number; message: string; data: any }>(
      '/api/additional-services',
      data
    );
    return normalizeService(response.data.data);
  } catch (error: any) {
    console.error('Error creating service accessory:', error);
    throw new Error(error.response?.data?.message || 'Không thể tạo dịch vụ/phụ kiện');
  }
};

/**
 * Update an existing service/accessory
 * PUT /api/additional-services/{id}
 */
export const updateServiceAccessory = async (
  id: number,
  data: UpdateServiceAccessoryDto
): Promise<ServiceAccessory> => {
  try {
    const response = await apiClient.put<{ statusCode: number; message: string; data: any }>(
      `/api/additional-services/${id}`,
      data
    );
    return normalizeService(response.data.data);
  } catch (error: any) {
    console.error('Error updating service accessory:', error);
    throw new Error(error.response?.data?.message || 'Không thể cập nhật dịch vụ/phụ kiện');
  }
};

/**
 * Delete a service/accessory
 * DELETE /api/additional-services/{id}
 */
export const deleteServiceAccessory = async (
  id: number
): Promise<void> => {
  try {
    await apiClient.delete(`/api/additional-services/${id}`);
  } catch (error: any) {
    console.error('Error deleting service accessory:', error);
    throw new Error(error.response?.data?.message || 'Không thể xóa dịch vụ/phụ kiện');
  }
};

/**
 * Toggle active status using activate/deactivate endpoints
 * PATCH /api/additional-services/{id}/activate
 * PATCH /api/additional-services/{id}/deactivate
 */
export const toggleServiceAccessoryStatus = async (
  id: number,
  isActive: boolean
): Promise<ServiceAccessory> => {
  try {
    const endpoint = isActive 
      ? `/api/additional-services/${id}/activate`
      : `/api/additional-services/${id}/deactivate`;
    
    const response = await apiClient.patch<{ statusCode: number; message: string; data?: any }>(
      endpoint
    );
    
    // Handle response - data might be in response.data.data or response.data
    const serviceData = response.data.data || response.data;
    
    if (!serviceData || typeof serviceData !== 'object') {
      throw new Error('Invalid response from server');
    }
    
    return normalizeService(serviceData);
  } catch (error: any) {
    console.error('Error toggling service accessory status:', error);
    throw new Error(error.response?.data?.message || 'Không thể thay đổi trạng thái');
  }
};

/**
 * Helper: Get category label in Vietnamese
 */
export const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    protection: 'Bảo vệ xe',
    charging: 'Sạc điện',
    warranty: 'Bảo hành',
    accessory: 'Phụ kiện',
  };
  return labels[category] || category;
};

/**
 * Helper: Get category icon
 */
export const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    protection: 'fa-shield-alt',
    charging: 'fa-charging-station',
    warranty: 'fa-file-contract',
    accessory: 'fa-wrench',
  };
  return icons[category] || 'fa-cog';
};

/**
 * Helper: Get category color
 */
export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    protection: '#3b82f6', // blue
    charging: '#10b981', // green
    warranty: '#f59e0b', // amber
    accessory: '#8b5cf6', // purple
  };
  return colors[category] || '#6b7280';
};

/**
 * Helper: Get default icon for category
 */
export const getDefaultIcon = (category: ServiceCategory): string => {
  const icons: Record<ServiceCategory, string> = {
    protection: 'fa-shield-halved',
    charging: 'fa-bolt',
    warranty: 'fa-certificate',
    accessory: 'fa-toolbox',
  };
  return icons[category] || 'fa-cube';
};
