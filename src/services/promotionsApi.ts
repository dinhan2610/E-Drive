// src/services/promotionsApi.ts
import api from "../lib/apiClient";
import type { Promotion, ListParams } from "../types/promotion";

// Get dealerId from token or localStorage
const getDealerId = (): number => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.dealerId || 1; // Default to 1 if not found
    } catch {
      return 1;
    }
  }
  return 1;
};

export async function listPromotions(params?: ListParams) {
  const dealerId = getDealerId();
  try {
    const { data } = await api.get<any>(`/api/promotions/dealer/${dealerId}`, { params });
    console.log('✅ Promotions loaded:', data);
    
    // Backend returns {statusCode, message, data: Promotion[]}
    if (data && data.data && Array.isArray(data.data)) {
      return { items: data.data, total: data.data.length };
    }
    
    // Fallback: check if data is array directly
    if (Array.isArray(data)) {
      return { items: data, total: data.length };
    }
    
    console.warn('⚠️ Unexpected response format:', data);
    return { items: [], total: 0 };
  } catch (error) {
    console.error('❌ API Error:', error);
    return { items: [], total: 0 };
  }
}

export async function getPromotion(id: number) {
  const { data } = await api.get<Promotion>(`/api/promotions/${id}`);
  return data;
}

export async function createPromotion(body: Omit<Promotion, 'promoId' | 'dealerId'>) {
  const dealerId = getDealerId();
  
  try {
    // Backend likely expects POST to /api/promotions/dealer/{dealerId}
    const { data } = await api.post<Promotion>(`/api/promotions/dealer/${dealerId}`, body);
    return data;
  } catch (error: any) {
    console.error('Create promotion error:', error.response?.data || error.message);
    throw error;
  }
}

export async function updatePromotion(id: number, body: Partial<Promotion>) {
  const dealerId = getDealerId();
  const { data } = await api.put<Promotion>(`/api/promotions/dealer/${dealerId}/${id}`, body);
  return data;
}

export async function removePromotion(id: number) {
  const dealerId = getDealerId();
  await api.delete(`/api/promotions/dealer/${dealerId}/${id}`);
}
