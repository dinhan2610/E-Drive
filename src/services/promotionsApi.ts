import api from "../lib/apiClient";
import type { Promotion, ListParams } from "../types/promotion";

export async function listPromotions(dealerId: number, params?: ListParams) {
  console.log('🎯 promotionsApi.listPromotions called with dealerId:', dealerId, 'params:', params);
  
  try {
    const endpoint = `/api/promotions/dealer/${dealerId}`;
    console.log('📡 Calling API endpoint:', endpoint);
    
    const { data } = await api.get<any>(endpoint, { params });
    
    console.log('✅ API Success - Raw response:', data);
    console.log('✅ Response type:', typeof data);
    console.log('✅ Response keys:', Object.keys(data || {}));
    
    if (data && data.data && Array.isArray(data.data)) {
      console.log('✅ Format 1: data.data array with', data.data.length, 'items');
      return { items: data.data, total: data.data.length };
    }
    
    if (Array.isArray(data)) {
      console.log('✅ Format 2: direct array with', data.length, 'items');
      return { items: data, total: data.length };
    }
    
    console.warn('⚠️ Unexpected response format:', data);
    return { items: [], total: 0 };
  } catch (error: any) {
    console.error('❌ promotionsApi.listPromotions ERROR:');
    console.error('   - DealerId:', dealerId);
    console.error('   - Status:', error.response?.status);
    console.error('   - Status Text:', error.response?.statusText);
    console.error('   - Error Data:', error.response?.data);
    console.error('   - Error Message:', error.message);
    return { items: [], total: 0 };
  }
}

export async function getPromotion(id: number) {
  const { data } = await api.get<Promotion>(`/api/promotions/${id}`);
  return data;
}

export async function createPromotion(dealerId: number, body: Omit<Promotion, 'promoId' | 'dealerId'>) {
  try {
    const { data } = await api.post<Promotion>(`/api/promotions/dealer/${dealerId}`, body);
    return data;
  } catch (error: any) {
    console.error(`Failed to create promotion for dealer ${dealerId}:`, error.response?.data || error.message);
    throw error;
  }
}

export async function updatePromotion(dealerId: number, id: number, body: Partial<Promotion>) {
  try {
    const { data } = await api.put<Promotion>(`/api/promotions/dealer/${dealerId}/${id}`, body);
    return data;
  } catch (error: any) {
    console.error(`Failed to update promotion ${id} for dealer ${dealerId}:`, error.response?.data || error.message);
    throw error;
  }
}

export async function removePromotion(dealerId: number, id: number) {
  try {
    await api.delete(`/api/promotions/dealer/${dealerId}/${id}`);
  } catch (error: any) {
    console.error(`Failed to delete promotion ${id} for dealer ${dealerId}:`, error.response?.data || error.message);
    throw error;
  }
}
