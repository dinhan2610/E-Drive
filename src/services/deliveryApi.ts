// Delivery API service

import api from "../lib/apiClient";

export class DeliveryApiError extends Error {
  code?: string;
  details?: any;

  constructor(message: string, code?: string, details?: any) {
    super(message);
    this.name = 'DeliveryApiError';
    this.code = code;
    this.details = details;
  }
}

/**
 * POST /api/deliveries/orders/{orderId}/confirm-delivery
 * Xác nhận đã giao hàng thành công
 */
export const confirmDelivery = async (orderId: number | string): Promise<void> => {
  try {
    console.log('🚚 Confirming delivery for order:', orderId);
    const response = await api.post(`/api/deliveries/orders/${orderId}/confirm-delivery`);
    console.log('✅ Delivery confirmed successfully:', response.data);
  } catch (error: any) {
    console.error('❌ Error confirming delivery:', error);
    console.error('Error response:', error.response?.data);
    
    const message = error.response?.data?.message || 'Không thể xác nhận giao hàng';
    throw new DeliveryApiError(message, `HTTP_${error.response?.status}`, error);
  }
};
