// services/orderApi.ts - API cho Order Management

import api from "../lib/apiClient";

// ===== TYPES =====

export interface OrderItem {
  vehicleId: number;
  quantity: number;
}

export interface CreateOrderRequest {
  orderItems: OrderItem[];
  desiredDeliveryDate: string; // Format: YYYY-MM-DD
  deliveryNote: string;
  deliveryAddress: string;
}

export interface Order {
  orderId: number | string;  // Can be number or UUID string
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
  orderItems?: Array<{
    vehicleId: number;
    vehicleName?: string;
    quantity: number;
    unitPrice: number;
  }>;
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
export const createOrder = async (orderRequest: CreateOrderRequest): Promise<Order> => {
  try {
    const response = await api.post<any>('/api/orders', orderRequest);
    console.log('📦 Raw create order response:', response.data);
    
    // Handle response format: { statusCode, message, data: {...} }
    let orderData = response.data;
    
    // If response is wrapped in { data: {...} }, extract it
    if (orderData.data && orderData.statusCode) {
      orderData = orderData.data;
    }
    
    console.log('✅ Order data:', orderData);
    
    // Map field names if backend uses different names
    const normalizedOrder: Order = {
      orderId: orderData.orderId || orderData.id || orderData.orderID,
      subtotal: orderData.subtotal || 0,
      dealerDiscount: orderData.totalDiscount || orderData.dealerDiscount || 0,
      vatAmount: orderData.vatAmount || 0,
      grandTotal: orderData.totalPrice || orderData.grandTotal || orderData.totalAmount || 0,
      desiredDeliveryDate: orderData.desiredDeliveryDate || '',
      deliveryAddress: orderData.deliveryAddress || '',
      deliveryNote: orderData.deliveryNote || '',
      orderStatus: orderData.orderStatus || 'PENDING',
      paymentStatus: orderData.paymentStatus || 'PENDING',
      paymentMethod: orderData.paymentMethod || 'CASH',
      orderItems: orderData.orderItems || []
    };
    
    console.log('✅ Normalized order:', normalizedOrder);
    return normalizedOrder;
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
    console.log('📦 Get orders response:', response.data);
    const data = response.data;
    
    let orders: any[] = [];
    
    // Handle different response formats
    // Format 1: { statusCode, message, data: [...] }
    if (data.data && data.statusCode && Array.isArray(data.data)) {
      orders = data.data;
    }
    // Format 2: Direct array
    else if (Array.isArray(data)) {
      orders = data;
    }
    // Format 3: { data: [...] }
    else if (data && Array.isArray(data.data)) {
      orders = data.data;
    }
    // Format 4: { content: [...] }
    else if (data && Array.isArray(data.content)) {
      orders = data.content;
    } else {
      console.error('Unexpected response format:', data);
      return [];
    }
    
    console.log('✅ Orders array:', orders);
    
    // Map backend field names to frontend Order interface
    return orders.map(order => ({
      orderId: order.orderId,
      subtotal: order.subtotal || 0,
      dealerDiscount: order.totalDiscount || order.dealerDiscount || 0,
      vatAmount: order.vatAmount || 0,
      grandTotal: order.totalPrice || order.grandTotal || 0,
      desiredDeliveryDate: order.desiredDeliveryDate || '',
      deliveryAddress: order.deliveryAddress || '',
      deliveryNote: order.deliveryNote || '',
      orderStatus: order.orderStatus || 'PENDING',
      paymentStatus: order.paymentStatus || 'PENDING',
      paymentMethod: order.paymentMethod || 'CASH',
      orderItems: order.orderItems || []
    }));
    
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    const message = error.response?.data?.message || 'Không thể tải danh sách đơn hàng';
    throw new OrderApiError(message, `HTTP_${error.response?.status}`, error);
  }
};

/**
 * GET /api/orders/{id} - Get order by ID
 */
export const getOrderById = async (id: number | string): Promise<Order> => {
  try {
    const response = await api.get<any>(`/api/orders/${id}`);
    console.log('📦 Get order by ID response:', response.data);
    
    // Handle response format: { statusCode, message, data: {...} }
    let orderData = response.data;
    
    // If response is wrapped in { data: {...} }, extract it
    if (orderData.data && orderData.statusCode) {
      orderData = orderData.data;
    }
    
    console.log('✅ Order data:', orderData);
    
    // Map backend field names to frontend Order interface
    return {
      orderId: orderData.orderId,
      subtotal: orderData.subtotal || 0,
      dealerDiscount: orderData.totalDiscount || orderData.dealerDiscount || 0,
      vatAmount: orderData.vatAmount || 0,
      grandTotal: orderData.totalPrice || orderData.grandTotal || 0,
      desiredDeliveryDate: orderData.desiredDeliveryDate || '',
      deliveryAddress: orderData.deliveryAddress || '',
      deliveryNote: orderData.deliveryNote || '',
      orderStatus: orderData.orderStatus || 'PENDING',
      paymentStatus: orderData.paymentStatus || 'PENDING',
      paymentMethod: orderData.paymentMethod || 'CASH',
      orderItems: orderData.orderItems || []
    };
  } catch (error: any) {
    console.error('Error fetching order:', error);
    
    // Handle specific error codes
    if (error.response?.status === 403) {
      const message = 'Bạn không có quyền truy cập đơn hàng này. Vui lòng kiểm tra lại.';
      throw new OrderApiError(message, 'FORBIDDEN', error);
    }
    
    if (error.response?.status === 404) {
      const message = 'Không tìm thấy đơn hàng. Đơn hàng có thể đã bị xóa.';
      throw new OrderApiError(message, 'NOT_FOUND', error);
    }
    
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
