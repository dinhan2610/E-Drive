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
  id: number;
  name: string;
  description: string;
  price: number;
  category: ServiceCategory;
  icon: string;
  isActive: boolean;
  dealerId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateServiceAccessoryDto {
  name: string;
  description: string;
  price: number;
  category: ServiceCategory;
  icon: string;
  isActive?: boolean;
  dealerId: number;
}

export interface UpdateServiceAccessoryDto {
  name?: string;
  description?: string;
  price?: number;
  category?: ServiceCategory;
  icon?: string;
  isActive?: boolean;
}

export interface ServiceAccessoryListParams {
  dealerId: number;
  category?: ServiceCategory;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ServiceAccessoryListResponse {
  items: ServiceAccessory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get all services & accessories for a dealer
 */
export const listServiceAccessories = async (
  params: ServiceAccessoryListParams
): Promise<ServiceAccessoryListResponse> => {
  try {
    const { dealerId, category, isActive, search, page = 1, limit = 10 } = params;
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (category) queryParams.append('category', category);
    if (typeof isActive === 'boolean') queryParams.append('isActive', isActive.toString());
    if (search) queryParams.append('search', search);
    
    const response = await apiClient.get(
      `/api/dealers/${dealerId}/service-accessories?${queryParams.toString()}`
    );
    
    return response.data as ServiceAccessoryListResponse;
  } catch (error: any) {
    console.error('Error fetching service accessories:', error);
    throw new Error(error.response?.data?.message || 'Không thể tải danh sách dịch vụ & phụ kiện');
  }
};

/**
 * Get a single service/accessory by ID
 */
export const getServiceAccessory = async (
  dealerId: number,
  id: number
): Promise<ServiceAccessory> => {
  try {
    const response = await apiClient.get(`/api/dealers/${dealerId}/service-accessories/${id}`);
    return response.data as ServiceAccessory;
  } catch (error: any) {
    console.error('Error fetching service accessory:', error);
    throw new Error(error.response?.data?.message || 'Không thể tải thông tin dịch vụ/phụ kiện');
  }
};

/**
 * Create a new service/accessory
 */
export const createServiceAccessory = async (
  data: CreateServiceAccessoryDto
): Promise<ServiceAccessory> => {
  try {
    const response = await apiClient.post(
      `/api/dealers/${data.dealerId}/service-accessories`,
      data
    );
    return response.data as ServiceAccessory;
  } catch (error: any) {
    console.error('Error creating service accessory:', error);
    throw new Error(error.response?.data?.message || 'Không thể tạo dịch vụ/phụ kiện');
  }
};

/**
 * Update an existing service/accessory
 */
export const updateServiceAccessory = async (
  dealerId: number,
  id: number,
  data: UpdateServiceAccessoryDto
): Promise<ServiceAccessory> => {
  try {
    const response = await apiClient.put(
      `/api/dealers/${dealerId}/service-accessories/${id}`,
      data
    );
    return response.data as ServiceAccessory;
  } catch (error: any) {
    console.error('Error updating service accessory:', error);
    throw new Error(error.response?.data?.message || 'Không thể cập nhật dịch vụ/phụ kiện');
  }
};

/**
 * Delete a service/accessory
 */
export const deleteServiceAccessory = async (
  dealerId: number,
  id: number
): Promise<void> => {
  try {
    await apiClient.delete(`/api/dealers/${dealerId}/service-accessories/${id}`);
  } catch (error: any) {
    console.error('Error deleting service accessory:', error);
    throw new Error(error.response?.data?.message || 'Không thể xóa dịch vụ/phụ kiện');
  }
};

/**
 * Toggle active status
 */
export const toggleServiceAccessoryStatus = async (
  dealerId: number,
  id: number,
  isActive: boolean
): Promise<ServiceAccessory> => {
  try {
    const response = await apiClient.patch(
      `/api/dealers/${dealerId}/service-accessories/${id}/toggle-status`,
      { isActive }
    );
    return response.data as ServiceAccessory;
  } catch (error: any) {
    console.error('Error toggling service accessory status:', error);
    throw new Error(error.response?.data?.message || 'Không thể thay đổi trạng thái');
  }
};

/**
 * Get statistics for dashboard
 */
export const getServiceAccessoryStats = async (dealerId: number) => {
  try {
    const response = await apiClient.get(`/api/dealers/${dealerId}/service-accessories/stats`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching service accessory stats:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      byCategory: {
        protection: 0,
        charging: 0,
        warranty: 0,
        accessory: 0,
      },
    };
  }
};

/**
 * Helper: Get category label in Vietnamese
 */
export const getCategoryLabel = (category: ServiceCategory): string => {
  const labels: Record<ServiceCategory, string> = {
    protection: 'Bảo vệ xe',
    charging: 'Sạc điện',
    warranty: 'Bảo hành',
    accessory: 'Phụ kiện',
  };
  return labels[category] || category;
};

/**
 * Helper: Get category color
 */
export const getCategoryColor = (category: ServiceCategory): string => {
  const colors: Record<ServiceCategory, string> = {
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
