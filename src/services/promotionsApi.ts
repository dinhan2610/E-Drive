import api from "../lib/apiClient";
import type { Promotion, ListParams } from "../types/promotion";

export async function listPromotions(dealerId: number, params?: ListParams) {
  try {
    const { data } = await api.get<any>(`/api/promotions/dealer/${dealerId}`, { params });
    
    if (data && data.data && Array.isArray(data.data)) {
      return { items: data.data, total: data.data.length };
    }
    
    if (Array.isArray(data)) {
      return { items: data, total: data.length };
    }
    
    console.warn('Unexpected response format:', data);
    return { items: [], total: 0 };
  } catch (error: any) {
    console.error(`Failed to load promotions for dealer ${dealerId}:`, error.response?.data || error.message);
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
