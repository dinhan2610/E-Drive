import api from '../lib/apiClient';
import type { VehicleColor, CreateColorRequest, UpdateColorRequest } from '../types/color';

/**
 * Fetch all vehicle colors
 * GET /api/colors
 * Response format: { statusCode: 200, message: "...", data: [...] }
 */
export async function fetchColors(): Promise<VehicleColor[]> {
  console.log('🎨 Fetching colors from API');

  try {
    const response = await api.get<{ statusCode: number; message: string; data: VehicleColor[] }>('/api/colors');
    console.log('✅ API Response:', response.data);
    
    // API returns { statusCode, message, data: [...] }
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      console.log('✅ Colors fetched:', response.data.data);
      return response.data.data;
    }
    
    console.warn('⚠️ Unexpected response format', response.data);
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
  console.log('🎨 Fetching color by ID:', colorId);

  try {
    const response = await api.get<{ statusCode: number; message: string; data: VehicleColor }>(`/api/colors/${colorId}`);
    console.log('✅ Color fetched:', response.data);
    
    // API returns { statusCode, message, data: {...} }
    if (response.data && response.data.data) {
      return response.data.data;
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
  console.log('🎨 Creating color:', colorData);

  try {
    const response = await api.post<{ statusCode: number; message: string; data: VehicleColor }>('/api/colors', colorData);
    console.log('✅ Color created:', response.data);
    
    // API returns { statusCode, message, data: {...} }
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Invalid response format');
  } catch (error: any) {
    console.error('❌ createColor error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create color';
    throw new Error(errorMessage);
  }
}

/**
 * Update an existing color
 * PUT /api/colors/{id}
 * Response format: { statusCode: 200, message: "...", data: {...} }
 */
export async function updateColor(colorId: number, colorData: UpdateColorRequest): Promise<VehicleColor> {
  console.log('🎨 Updating color:', colorId, colorData);

  try {
    const response = await api.put<{ statusCode: number; message: string; data: VehicleColor }>(`/api/colors/${colorId}`, colorData);
    console.log('✅ Color updated:', response.data);
    
    // API returns { statusCode, message, data: {...} }
    if (response.data && response.data.data) {
      return response.data.data;
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
  console.log('🎨 Deleting color:', colorId);

  try {
    await api.delete(`/api/colors/${colorId}`);
    console.log('✅ Color deleted successfully');
  } catch (error) {
    console.error('❌ deleteColor error:', error);
    throw error;
  }
}
