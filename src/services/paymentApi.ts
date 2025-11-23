// Payment API service

import api from "../lib/apiClient";
import type { 
  CashRequest, 
  CashResponse, 
  VnPayInitResponse, 
  VnPayReturnPayload 
} from "../types/payment";

/**
 * POST /api/payments/vnpay/{orderId}
 * Khởi tạo thanh toán VNPAY
 */
export async function startVnPay(orderId: number | string): Promise<VnPayInitResponse> {
  try {
    
    // Some backends expect an empty object body for POST requests
    const { data } = await api.post<any>(`/api/payments/vnpay/${orderId}`, {});
    
    
    // Backend response format: { statusCode, message, data: { vnpayUrl } }
    if (data.data && data.data.vnpayUrl) {
      return {
        paymentUrl: data.data.vnpayUrl
      };
    }
    
    // Fallback if direct format
    if (data.vnpayUrl) {
      return {
        paymentUrl: data.vnpayUrl
      };
    }
    
    // If already in correct format
    if (data.paymentUrl) {
      return data;
    }
    
    throw new Error('Invalid VNPay response format');
  } catch (error: any) {
    console.error('❌ VNPay initiation error:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    
    // Extract meaningful error message from backend
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    throw error;
  }
}

/**
 * POST /api/payments/cash
 * Thanh toán tiền mặt
 */
export async function payCash(body: CashRequest): Promise<CashResponse> {
  const { data } = await api.post<CashResponse>(`/api/payments/cash`, body, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
}

/**
 * GET /api/payments/vnpay-return?...
 * Xử lý return từ VNPAY
 */
export async function handleVnPayReturn(query: URLSearchParams): Promise<VnPayReturnPayload> {
  const qs = query.toString();
  
  try {
    const { data } = await api.get<any>(`/api/payments/vnpay-return?${qs}`);
    
    // Extract VNPay params from query string directly
    const vnpParams: VnPayReturnPayload = {};
    query.forEach((value, key) => {
      vnpParams[key] = value;
    });
    
    
    // Return the VNPay params from URL, not from backend response
    // Backend may have issues but VNPay params in URL are the source of truth
    return vnpParams;
    
  } catch (error: any) {
    console.error('❌ VNPay return error:', error);
    
    // Even if backend API fails, we can still parse VNPay params from URL
    const vnpParams: VnPayReturnPayload = {};
    query.forEach((value, key) => {
      vnpParams[key] = value;
    });
    
    
    // Return VNPay params from URL
    return vnpParams;
  }
}
