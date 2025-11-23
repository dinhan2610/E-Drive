import type { DiscountPolicy, CreateDiscountRequest, UpdateDiscountRequest } from '../types/discount';
import api from '../lib/apiClient';

/**
 * Fetch all discount policies
 * GET /api/admin/discount-policies
 */
export async function fetchDiscountPolicies(): Promise<DiscountPolicy[]> {
  try {
    const response = await api.get<DiscountPolicy[]>('/api/admin/discount-policies');
    return response.data;
  } catch (error: any) {
    console.error('❌ fetchDiscountPolicies error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fetch active discount policies only
 * GET /api/admin/discount-policies/active
 * Response format: { statusCode: 200, message: "...", data: [...] }
 */
export async function fetchActiveDiscountPolicies(): Promise<DiscountPolicy[]> {
  try {
    const response = await api.get<any>('/api/admin/discount-policies/active');
    
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    else if (Array.isArray(response.data)) {
      return response.data;
    }
    
    console.warn('⚠️ Unexpected response format:', response.data);
    return [];
  } catch (error: any) {
    console.error('❌ fetchActiveDiscountPolicies error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fetch discount policy by ID
 * GET /api/admin/discount-policies/{id}
 */
export async function getDiscountPolicyById(id: number): Promise<DiscountPolicy> {
  try {
    const response = await api.get<DiscountPolicy>(`/api/admin/discount-policies/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('❌ getDiscountPolicyById error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create new discount policy
 * POST /api/admin/discount-policies
 */
export async function createDiscountPolicy(request: CreateDiscountRequest): Promise<DiscountPolicy> {
  try {
    const response = await api.post<DiscountPolicy>('/api/admin/discount-policies', request);
    return response.data;
  } catch (error: any) {
    console.error('❌ createDiscountPolicy error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Update discount policy
 * PUT /api/admin/discount-policies/{id}
 */
export async function updateDiscountPolicy(id: number, request: UpdateDiscountRequest): Promise<DiscountPolicy> {
  try {
    const response = await api.put<DiscountPolicy>(`/api/admin/discount-policies/${id}`, request);
    return response.data;
  } catch (error: any) {
    console.error('❌ updateDiscountPolicy error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Delete discount policy
 * DELETE /api/admin/discount-policies/{id}
 */
export async function deleteDiscountPolicy(id: number): Promise<void> {
  try {
    await api.delete(`/api/admin/discount-policies/${id}`);
  } catch (error: any) {
    console.error('❌ deleteDiscountPolicy error:', error.response?.data || error.message);
    throw error;
  }
}
