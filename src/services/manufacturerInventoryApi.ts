import type { ManufacturerInventorySummary, VehicleInventoryItem } from '../types/inventory';

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Fetch manufacturer inventory summary
 * GET /api/manufacturer-inventory/summary
 * Returns: { manufacturerName, totalQuantity, vehicles: [...] }
 */
export async function fetchManufacturerInventorySummary(): Promise<ManufacturerInventorySummary> {
  const url = `${API_BASE_URL}/manufacturer-inventory/summary`;
  console.log('🌐 Fetching manufacturer inventory summary from:', url);

  try {
    const res = await fetch(url, { 
      headers: { 
        Accept: 'application/json',
        'Content-Type': 'application/json'
      } 
    });

    if (!res.ok) {
      throw new Error(`API request failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log('✅ API Response:', data);

    // Check if API returns an array (take first item) or direct object
    let summary: ManufacturerInventorySummary;
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('📦 API returned array, using first item');
      summary = data[0];
    } else if (data && typeof data === 'object' && 'vehicles' in data) {
      console.log('📦 API returned direct object');
      summary = data;
    } else {
      console.warn('⚠️ Unexpected response format', data);
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
  const url = `${API_BASE_URL}/manufacturer-inventory/${id}`;
  console.log('🌐 Fetching inventory item by ID from:', url);

  try {
    const res = await fetch(url, { 
      headers: { 
        Accept: 'application/json',
        'Content-Type': 'application/json'
      } 
    });

    if (!res.ok) {
      throw new Error(`API request failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log('✅ Inventory item:', data);
    return data;
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
  const url = `${API_BASE_URL}/manufacturer-inventory`;
  console.log('🌐 Creating inventory record:', request);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`Failed to create inventory record: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log('✅ Created inventory record:', data);
    return data;
  } catch (error) {
    console.error('❌ createInventoryRecord error:', error);
    throw error;
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
  const url = `${API_BASE_URL}/manufacturer-inventory/${id}`;
  console.log('🌐 Updating inventory record:', { id, ...request });

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`Failed to update inventory record: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log('✅ Updated inventory record:', data);
    return data;
  } catch (error) {
    console.error('❌ updateInventoryRecord error:', error);
    throw error;
  }
}

/**
 * Delete inventory record (Xóa bản ghi tồn kho)
 * DELETE /api/manufacturer-inventory/{id}
 */
export async function deleteInventoryRecord(id: number): Promise<void> {
  const url = `${API_BASE_URL}/manufacturer-inventory/${id}`;
  console.log('🌐 Deleting inventory record:', id);

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json'
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`Failed to delete inventory record: ${res.status} ${res.statusText}`);
    }

    console.log('✅ Deleted inventory record:', id);
  } catch (error) {
    console.error('❌ deleteInventoryRecord error:', error);
    throw error;
  }
}
