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
export async function startVnPay(orderId: number): Promise<VnPayInitResponse> {
  const { data } = await api.post<VnPayInitResponse>(`/api/payments/vnpay/${orderId}`);
  return data;
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
  const { data } = await api.get<VnPayReturnPayload>(`/api/payments/vnpay-return?${qs}`);
  return data;
}
