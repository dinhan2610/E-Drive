import apiClient from '../lib/apiClient';

// Dealer Inventory Response Type
export interface DealerInventoryItem {
  modelName: string;
  version: string;
  colorName: string;
  quantity: number;
}

/**
 * Fetch dealer inventory by dealer ID
 * GET /dealer-inventory/dealer/{dealerId}
 */
export async function getDealerInventory(dealerId: number): Promise<DealerInventoryItem[]> {
  try {
    console.log('📦 Fetching dealer inventory for dealer:', dealerId);
    const response = await apiClient.get<{
      statusCode: number;
      message: string;
      data: DealerInventoryItem[];
    }>(`/dealer-inventory/dealer/${dealerId}`);
    
    console.log('✅ Dealer inventory response:', response.data);
    return response.data.data || [];
  } catch (error: any) {
    console.error('❌ Error fetching dealer inventory:', error?.response?.data || error);
    throw new Error(error?.response?.data?.message || 'Không thể tải dữ liệu kho hàng');
  }
}

/**
 * Update vehicle quantity in dealer inventory
 * PUT /dealer-inventory/update/{dealerId}/{vehicleId}
 */
export async function updateDealerInventory(
  dealerId: number,
  vehicleId: number,
  quantity: number
): Promise<void> {
  try {
    console.log('📝 Updating dealer inventory:', { dealerId, vehicleId, quantity });
    await apiClient.put(`/dealer-inventory/update/${dealerId}/${vehicleId}`, null, {
      params: { quantity }
    });
    console.log('✅ Inventory updated successfully');
  } catch (error: any) {
    console.error('❌ Error updating dealer inventory:', error?.response?.data || error);
    throw new Error(error?.response?.data?.message || 'Không thể cập nhật kho hàng');
  }
}

// import type { ManufacturerInventorySummary, VehicleInventoryItem } from '../types/inventory';

// const API_BASE_URL = 'http://localhost:8080/api';

// /**
//  * Fetch manufacturer inventory summary
//  * GET /api/manufacturer-inventory/summary
//  * Returns: { manufacturerName, totalQuantity, vehicles: [...] }
//  */
// export async function fetchManufacturerInventorySummary(): Promise<ManufacturerInventorySummary> {
//   const url = `${API_BASE_URL}/manufacturer-inventory/summary`;
//   console.log('🌐 Fetching manufacturer inventory summary from:', url);

//   try {
//     const res = await fetch(url, { 
//       headers: { 
//         Accept: 'application/json',
//         'Content-Type': 'application/json'
//       } 
//     });

//     if (!res.ok) {
//       throw new Error(`API request failed: ${res.status} ${res.statusText}`);
//     }

//     const data = await res.json();
//     console.log('✅ API Response:', data);

//     // Check if API returns an array (take first item) or direct object
//     let summary: ManufacturerInventorySummary;
    
//     if (Array.isArray(data) && data.length > 0) {
//       console.log('📦 API returned array, using first item');
//       summary = data[0];
//     } else if (data && typeof data === 'object' && 'vehicles' in data) {
//       console.log('📦 API returned direct object');
//       summary = data;
//     } else {
//       console.warn('⚠️ Unexpected response format', data);
//       return {
//         manufacturerName: 'Unknown',
//         totalQuantity: 0,
//         vehicles: []
//       };
//     }

//     console.log('✅ Manufacturer inventory summary:', summary);
//     return summary;
//   } catch (error) {
//     console.error('❌ fetchManufacturerInventorySummary error:', error);
//     throw error;
//   }
// }
