// services/deliveryApi.ts - API cho Delivery Management

import api from "../lib/apiClient";

// ===== TYPES =====

export interface ConfirmDeliveryResponse {
  statusCode: number;
  message: string;
  data: any;
}

export class DeliveryApiError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;

  constructor(message: string, code?: string, statusCode?: number, details?: any) {
    super(message);
    this.name = 'DeliveryApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ===== API FUNCTIONS =====

/**
 * POST /api/deliveries/orders/{orderId}/confirm-delivery
 * Xác nhận đã nhận hàng cho đơn hàng
 */
export const confirmDelivery = async (orderId: number | string): Promise<ConfirmDeliveryResponse> => {
  try {
    console.log(`🚚 Confirming delivery for order ${orderId}...`);
    const response = await api.post<ConfirmDeliveryResponse>(
      `/api/deliveries/orders/${orderId}/confirm-delivery`
    );
    
    console.log('✅ Delivery confirmed successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error confirming delivery:', error);
    
    const statusCode = error.response?.status;
    const message = error.response?.data?.message || 'Không thể xác nhận giao hàng';
    
    // Handle specific error cases
    if (statusCode === 400) {
      throw new DeliveryApiError(
        message,
        'ORDER_NOT_FOUND',
        statusCode,
        error.response?.data
      );
    }
    
    if (statusCode === 403) {
      throw new DeliveryApiError(
        'Bạn không có quyền xác nhận giao hàng cho đơn hàng này',
        'FORBIDDEN',
        statusCode,
        error.response?.data
      );
    }
    
    if (statusCode === 404) {
      throw new DeliveryApiError(
        'Không tìm thấy đơn hàng',
        'NOT_FOUND',
        statusCode,
        error.response?.data
      );
    }
    
    throw new DeliveryApiError(message, `HTTP_${statusCode}`, statusCode, error);
  }
};
