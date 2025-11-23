import apiClient from '../lib/apiClient';

// Dealer Inventory Response Type
export interface DealerInventoryItem {
  vehicleId: number;
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
    const response = await apiClient.get<{
      statusCode: number;
      message: string;
      data: DealerInventoryItem[];
    }>(`/dealer-inventory/dealer/${dealerId}`);
    
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
    await apiClient.put(`/dealer-inventory/update/${dealerId}/${vehicleId}`, null, {
      params: { quantity }
    });
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

//     // Check if API returns an array (take first item) or direct object
//     let summary: ManufacturerInventorySummary;
    
//     if (Array.isArray(data) && data.length > 0) {
//       summary = data[0];
//     } else if (data && typeof data === 'object' && 'vehicles' in data) {
//       summary = data;
//     } else {
//       console.warn('⚠️ Unexpected response format', data);
//       return {
//         manufacturerName: 'Unknown',
//         totalQuantity: 0,
//         vehicles: []
//       };
//     }

//     return summary;
//   } catch (error) {
//     console.error('❌ fetchManufacturerInventorySummary error:', error);
//     throw error;
//   }
// }
