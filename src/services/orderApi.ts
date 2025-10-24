// services/orderApi.ts - API cho Order Management

import api from "../lib/apiClient";

// ===== TYPES =====

export interface CreateOrderRequest {
  vehicleId: string;
  quantity: string;
  desiredDeliveryDate: string; // Format: YYYY-MM-DD
  deliveryNote: string;
  deliveryAddress: string;
  paymentMethod: 'CASH'; // Backend currently only accepts CASH (returns as FULL)
}

export interface Order {
  orderId: number;
  subtotal: number;
  dealerDiscount: number;
  vatAmount: number;
  grandTotal: number;
  desiredDeliveryDate: string;
  deliveryAddress: string;
  deliveryNote: string;
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'CANCELLED';
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'INSTALLMENT' | 'FULL';
}

export class OrderApiError extends Error {
  code?: string;
  details?: any;

  constructor(message: string, code?: string, details?: any) {
    super(message);
    this.name = 'OrderApiError';
    this.code = code;
    this.details = details;
  }
}

// ===== API FUNCTIONS =====

/**
 * POST /api/orders - Create new order
 */
export const createOrder = async (orderData: CreateOrderRequest): Promise<Order> => {
  try {
    const response = await api.post<Order>('/api/orders', orderData);
    return response.data;
  } catch (error: any) {
    console.error('Error creating order:', error);
    const message = error.response?.data?.message || 'Không thể tạo đơn hàng';
    throw new OrderApiError(message, `HTTP_${error.response?.status}`, error);
  }
};

/**
 * GET /api/orders - Get all orders
 */
export const getOrders = async (): Promise<Order[]> => {
  try {
    const response = await api.get<any>('/api/orders');
    const data = response.data;
    
    // Handle different response formats
    if (Array.isArray(data)) {
      return data as Order[];
    }
    
    if (data && Array.isArray(data.data)) {
      return data.data as Order[];
    }
    
    if (data && Array.isArray(data.content)) {
      return data.content as Order[];
    }
    
    console.error('Unexpected response format:', data);
    return [];
    
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    const message = error.response?.data?.message || 'Không thể tải danh sách đơn hàng';
    throw new OrderApiError(message, `HTTP_${error.response?.status}`, error);
  }
};

/**
 * GET /api/orders/{id} - Get order by ID
 */
export const getOrderById = async (id: number): Promise<Order> => {
  try {
    const response = await api.get<Order>(`/api/orders/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching order:', error);
    const message = error.response?.data?.message || 'Không thể tải thông tin đơn hàng';
    throw new OrderApiError(message, `HTTP_${error.response?.status}`, error);
  }
};

/**
 * PUT /api/orders/{id} - Update order
 */
export const updateOrder = async (id: number, orderData: Partial<CreateOrderRequest>): Promise<Order> => {
  try {
    const response = await api.put<Order>(`/api/orders/${id}`, orderData);
    return response.data;
  } catch (error: any) {
    console.error('Error updating order:', error);
    const message = error.response?.data?.message || 'Không thể cập nhật đơn hàng';
    throw new OrderApiError(message, `HTTP_${error.response?.status}`, error);
  }
};

/**
 * DELETE /api/orders/{id} - Delete order
 */
export const deleteOrder = async (id: number): Promise<void> => {
  try {
    await api.delete(`/api/orders/${id}`);
  } catch (error: any) {
    console.error('Error deleting order:', error);
    const message = error.response?.data?.message || 'Không thể xóa đơn hàng';
    throw new OrderApiError(message, `HTTP_${error.response?.status}`, error);
  }
};

/**
 * Utility: Format order status to Vietnamese
 */
export const formatOrderStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'PENDING': 'Chờ xử lý',
    'CONFIRMED': 'Đã xác nhận',
    'PROCESSING': 'Đang xử lý',
    'SHIPPED': 'Đang giao hàng',
    'DELIVERED': 'Đã giao hàng',
    'CANCELLED': 'Đã hủy',
  };
  return statusMap[status] || status;
};

/**
 * Utility: Format payment status to Vietnamese
 */
export const formatPaymentStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'PENDING': 'Chờ thanh toán',
    'PAID': 'Đã thanh toán',
    'CANCELLED': 'Đã hủy',
  };
  return statusMap[status] || status;
};

/**
 * Utility: Format payment method to Vietnamese
 */
export const formatPaymentMethod = (method: string): string => {
  const methodMap: Record<string, string> = {
    'CASH': 'Tiền mặt',
    'BANK_TRANSFER': 'Chuyển khoản',
    'INSTALLMENT': 'Trả góp',
    'FULL': 'Thanh toán đầy đủ',
  };
  return methodMap[method] || method;
};
