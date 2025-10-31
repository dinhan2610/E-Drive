import type { ManufacturerInventoryItem } from '../types/inventory';

const API_BASE_URL = 'http://localhost:8080/api';

export async function fetchManufacturerInventory(): Promise<ManufacturerInventoryItem[]> {
  const url = `${API_BASE_URL}/manufacturer-inventory`;
  console.log('🌐 Fetching manufacturer inventory from:', url);

  try {
    const res = await fetch(url, { headers: { Accept: '*/*' } });
    if (!res.ok) {
      throw new Error(`API request failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    // API may return array directly or wrapper { statusCode, data }
    if (Array.isArray(data)) {
      return data as ManufacturerInventoryItem[];
    }

    if (data && Array.isArray(data.data)) {
      return data.data as ManufacturerInventoryItem[];
    }

    // If single object with fields, try to detect
    if (data && typeof data === 'object' && 'inventoryId' in data) {
      return [data as ManufacturerInventoryItem];
    }

    console.warn('⚠️ Unexpected manufacturer-inventory response format', data);
    return [];
  } catch (error) {
    console.error('❌ fetchManufacturerInventory error:', error);
    throw error;
  }
}
