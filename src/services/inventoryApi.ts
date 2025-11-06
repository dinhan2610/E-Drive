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
