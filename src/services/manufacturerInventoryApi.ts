import api from '../lib/apiClient';
import type { ManufacturerInventorySummary, VehicleInventoryItem } from '../types/inventory';

/**
 * Fetch manufacturer inventory summary
 * GET /api/manufacturer-inventory/summary
 * Returns: { manufacturerName, totalQuantity, vehicles: [...] }
 */
export async function fetchManufacturerInventorySummary(): Promise<ManufacturerInventorySummary> {
  console.log('🌐 Fetching manufacturer inventory summary from API');

  try {
    const response = await api.get<any>('/api/manufacturer-inventory/summary');
    console.log('✅ API Response:', response.data);

    // Check if API returns an array (take first item) or direct object
    let summary: ManufacturerInventorySummary;
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log('📦 API returned array, using first item');
      summary = response.data[0];
    } else if (response.data && typeof response.data === 'object' && 'vehicles' in response.data) {
      console.log('📦 API returned direct object');
      summary = response.data;
    } else {
      console.warn('⚠️ Unexpected response format', response.data);
      return {
        manufacturerName: 'Unknown',
        totalQuantity: 0,
        vehicles: []
      };
    }

    console.log('✅ Manufacturer inventory summary:', summary);
    return summary;
  } catch (error) {
    console.error('❌ fetchManufacturerInventorySummary error:', error);
    throw error;
  }
}

/**
 * Fetch inventory item by ID
 * GET /api/manufacturer-inventory/{id}
 * Returns: Single inventory item details
 */
export async function fetchInventoryItemById(id: number): Promise<VehicleInventoryItem> {
  console.log('🌐 Fetching inventory item by ID:', id);

  try {
    const response = await api.get<VehicleInventoryItem>(`/api/manufacturer-inventory/${id}`);
    console.log('✅ Inventory item:', response.data);
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
  console.log('🌐 Creating inventory record:', request);

  try {
    const response = await api.post<VehicleInventoryItem>('/api/manufacturer-inventory', request);
    console.log('✅ Created inventory record:', response.data);
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
  console.log('🌐 Updating inventory record:', { id, ...request });

  try {
    const response = await api.put<VehicleInventoryItem>(`/api/manufacturer-inventory/${id}`, request);
    console.log('✅ Updated inventory record:', response.data);
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
  console.log('🌐 Deleting inventory record:', id);

  try {
    await api.delete(`/api/manufacturer-inventory/${id}`);
    console.log('✅ Deleted inventory record:', id);
  } catch (error) {
    console.error('❌ deleteInventoryRecord error:', error);
    throw error;
  }
}
