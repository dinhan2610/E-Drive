import api from '../lib/apiClient';
import type { ManufacturerInventorySummary, VehicleInventoryItem } from '../types/inventory';

/**
 * Fetch manufacturer inventory summary
 * GET /api/manufacturer-inventory/summary
 * Returns: { manufacturerName, totalQuantity, vehicles: [...] }
 */
export async function fetchManufacturerInventorySummary(): Promise<ManufacturerInventorySummary> {

  try {
    const response = await api.get<any>('/api/manufacturer-inventory/summary');

    // Check if API returns an array (take first item) or direct object
    let summary: ManufacturerInventorySummary;
    
    // Format 1: Wrapped response with data as array { statusCode, message, data: [...] }
    if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      summary = response.data.data[0];
    }
    // Format 2: Direct array response
    else if (Array.isArray(response.data) && response.data.length > 0) {
      summary = response.data[0];
    } 
    // Format 3: Wrapped in data property { statusCode, message, data: {...} }
    else if (response.data?.data && typeof response.data.data === 'object' && 'vehicles' in response.data.data) {
      summary = response.data.data;
    }
    // Format 4: Direct object
    else if (response.data && typeof response.data === 'object' && 'vehicles' in response.data) {
      summary = response.data;
    } 
    // Format 5: Empty or unexpected
    else {
      console.warn('⚠️ Unexpected response format:', response.data);
      return {
        manufacturerName: 'EDrive',
        totalQuantity: 0,
        vehicles: []
      };
    }

    // Ensure vehicles is an array
    if (!Array.isArray(summary.vehicles)) {
      console.warn('⚠️ vehicles is not an array, converting to empty array');
      summary.vehicles = [];
    }

    return summary;
  } catch (error: any) {
    console.error('❌ fetchManufacturerInventorySummary error:', error);
    
    // Return empty summary instead of throwing error
    if (error.response?.status === 404 || error.response?.status === 500) {
      return {
        manufacturerName: 'EDrive',
        totalQuantity: 0,
        vehicles: []
      };
    }
    
    throw error;
  }
}

/**
 * Fetch inventory item by ID
 * GET /api/manufacturer-inventory/{id}
 * Returns: Single inventory item details
 */
export async function fetchInventoryItemById(id: number): Promise<VehicleInventoryItem> {

  try {
    const response = await api.get<VehicleInventoryItem>(`/api/manufacturer-inventory/${id}`);
    return response.data;
  } catch (error) {
    console.error('❌ fetchInventoryItemById error:', error);
    throw error;
  }
}

/**
 * Create new inventory record (Tạo mới bản ghi tồn kho)
 * POST /api/manufacturer-inventory
 * Request body: { vehicleId: number, quantity: number }
 */
export interface CreateInventoryRequest {
  vehicleId: number;
  quantity: number;
}

export async function createInventoryRecord(request: CreateInventoryRequest): Promise<VehicleInventoryItem> {

  try {
    const response = await api.post<VehicleInventoryItem>('/api/manufacturer-inventory', request);
    return response.data;
  } catch (error: any) {
    console.error('❌ createInventoryRecord error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create inventory record';
    throw new Error(errorMessage);
  }
}

/**
 * Update inventory quantity (Cập nhật thông tin tồn kho)
 * PUT /api/manufacturer-inventory/{id}
 * Request body: { quantity: number }
 */
export interface UpdateInventoryRequest {
  quantity: number;
}

export async function updateInventoryRecord(id: number, request: UpdateInventoryRequest): Promise<VehicleInventoryItem> {

  try {
    const response = await api.put<VehicleInventoryItem>(`/api/manufacturer-inventory/${id}`, request);
    return response.data;
  } catch (error: any) {
    console.error('❌ updateInventoryRecord error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update inventory record';
    throw new Error(errorMessage);
  }
}

/**
 * Delete inventory record (Xóa bản ghi tồn kho)
 * DELETE /api/manufacturer-inventory/{id}
 */
export async function deleteInventoryRecord(id: number): Promise<void> {

  try {
    await api.delete(`/api/manufacturer-inventory/${id}`);
  } catch (error) {
    console.error('❌ deleteInventoryRecord error:', error);
    throw error;
  }
}
