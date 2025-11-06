import type { VehicleColor, CreateColorRequest, UpdateColorRequest } from '../types/color';

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Fetch all vehicle colors
 * GET /api/colors
 * Response format: { statusCode: 200, message: "...", data: [...] }
 */
export async function fetchColors(): Promise<VehicleColor[]> {
  const url = `${API_BASE_URL}/colors`;
  console.log('🎨 Fetching colors from:', url);

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`API request failed: ${res.status} ${res.statusText}`);
    }

    const response = await res.json();
    console.log('✅ API Response:', response);
    
    // API returns { statusCode, message, data: [...] }
    if (response && response.data && Array.isArray(response.data)) {
      console.log('✅ Colors fetched:', response.data);
      return response.data;
    }
    
    console.warn('⚠️ Unexpected response format', response);
    return [];
  } catch (error) {
    console.error('❌ fetchColors error:', error);
    throw error;
  }
}

/**
 * Get a specific color by ID
 * GET /api/colors/{id}
 * Response format: { statusCode: 200, message: "...", data: {...} }
 */
export async function getColorById(colorId: number): Promise<VehicleColor> {
  const url = `${API_BASE_URL}/colors/${colorId}`;
  console.log('🎨 Fetching color by ID:', colorId);

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`API request failed: ${res.status} ${res.statusText}`);
    }

    const response = await res.json();
    console.log('✅ Color fetched:', response);
    
    // API returns { statusCode, message, data: {...} }
    if (response && response.data) {
      return response.data;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('❌ getColorById error:', error);
    throw error;
  }
}

/**
 * Create a new color
 * POST /api/colors
 * Response format: { statusCode: 201, message: "...", data: {...} }
 */
export async function createColor(colorData: CreateColorRequest): Promise<VehicleColor> {
  const url = `${API_BASE_URL}/colors`;
  console.log('🎨 Creating color:', colorData);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(colorData),
    });

    console.log('📡 Response status:', res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ API Error Response:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || `API request failed: ${res.status}`);
      } catch {
        throw new Error(`API request failed: ${res.status} ${res.statusText}`);
      }
    }

    const response = await res.json();
    console.log('✅ Color created:', response);
    
    // API returns { statusCode, message, data: {...} }
    if (response && response.data) {
      return response.data;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('❌ createColor error:', error);
    throw error;
  }
}

/**
 * Update an existing color
 * PUT /api/colors/{id}
 * Response format: { statusCode: 200, message: "...", data: {...} }
 */
export async function updateColor(colorId: number, colorData: UpdateColorRequest): Promise<VehicleColor> {
  const url = `${API_BASE_URL}/colors/${colorId}`;
  console.log('🎨 Updating color:', colorId, colorData);

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(colorData),
    });

    if (!res.ok) {
      throw new Error(`API request failed: ${res.status} ${res.statusText}`);
    }

    const response = await res.json();
    console.log('✅ Color updated:', response);
    
    // API returns { statusCode, message, data: {...} }
    if (response && response.data) {
      return response.data;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('❌ updateColor error:', error);
    throw error;
  }
}

/**
 * Delete a color
 * DELETE /api/colors/{id}
 */
export async function deleteColor(colorId: number): Promise<void> {
  const url = `${API_BASE_URL}/colors/${colorId}`;
  console.log('🎨 Deleting color:', colorId);

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!res.ok) {
      throw new Error(`API request failed: ${res.status} ${res.statusText}`);
    }

    console.log('✅ Color deleted successfully');
  } catch (error) {
    console.error('❌ deleteColor error:', error);
    throw error;
  }
}
