// services/orderApi.ts - API cho Order Management

import api from "../lib/apiClient";

// ===== TYPES =====

export interface CreateOrderRequest {
  vehicleId?: string; // Optional for backward compatibility
  quantity?: string; // Optional for backward compatibility
  orderItems?: Array<{ // New: support multiple items
    vehicleId: number;
    quantity: number;
  }>;
  desiredDeliveryDate: string; // Format: YYYY-MM-DD
  deliveryNote: string;
  deliveryAddress: string;
  paymentMethod?: 'CASH'; // Backend currently only accepts CASH (returns as FULL)
}

export interface OrderItem {
  vehicleId: number;
  vehicleName: string;
  quantity: number;
  unitPrice: number;
  itemSubtotal: number;
  itemDiscount: number;
  itemTotal: number;
}

export interface Order {
  orderId: number | string;
  dealerId?: number;
  dealerName?: string;
  orderDate?: string;
  desiredDeliveryDate: string;
  actualDeliveryDate?: string | null;
  subtotal: number;
  dealerDiscount: number;
  vatAmount: number;
  grandTotal: number;
  deliveryAddress: string;
  deliveryNote: string;
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'CANCELLED';
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'INSTALLMENT' | 'FULL';
  orderItems?: OrderItem[];
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
    console.log('📦 Get orders response:', response.data);
    
    const data = response.data;
    
    // Extract orders array from different response formats
    let orders: any[] = [];
    
    if (Array.isArray(data)) {
      orders = data;
    } else if (data && Array.isArray(data.data)) {
      orders = data.data;
    } else if (data && Array.isArray(data.content)) {
      orders = data.content;
    } else {
      console.error('Unexpected response format:', data);
      return [];
    }
    
    console.log('✅ Orders array:', orders);
    
    // Map backend field names to frontend Order interface
    const mappedOrders: Order[] = orders.map((order: any) => ({
      orderId: order.orderId || order.id || order.orderID,
      dealerId: order.dealerId,
      dealerName: order.dealerName,
      orderDate: order.orderDate,
      desiredDeliveryDate: order.desiredDeliveryDate || '',
      actualDeliveryDate: order.actualDeliveryDate,
      subtotal: order.subtotal || 0,
      dealerDiscount: order.totalDiscount || order.dealerDiscount || 0,
      vatAmount: order.vatAmount || 0,
      grandTotal: order.totalPrice || order.grandTotal || 0,
      deliveryAddress: order.deliveryAddress || '',
      deliveryNote: order.deliveryNote || '',
      orderStatus: order.orderStatus || 'PENDING',
      paymentStatus: order.paymentStatus || 'PENDING',
      paymentMethod: order.paymentMethod || 'CASH',
      orderItems: order.orderItems ? order.orderItems.map((item: any) => ({
        vehicleId: item.vehicleId,
        vehicleName: item.vehicleName || item.name || `Vehicle #${item.vehicleId}`,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        itemSubtotal: item.itemSubtotal || 0,
        itemDiscount: item.itemDiscount || 0,
        itemTotal: item.itemTotal || 0
      })) : []
    }));
    
    console.log('✅ Mapped orders:', mappedOrders);
    return mappedOrders;
    
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    const message = error.response?.data?.message || 'Không thể tải danh sách đơn hàng';
    throw new OrderApiError(message, `HTTP_${error.response?.status}`, error);
  }
};

/**
 * GET /api/orders/dealer/{dealerId} - Get orders by dealer ID
 */
export const getOrdersByDealer = async (dealerId: number): Promise<Order[]> => {
  try {
    const response = await api.get<any>(`/api/orders/dealer/${dealerId}`);
    console.log('📦 Get orders by dealer response:', response.data);
    
    const data = response.data;
    
    // Extract orders array from different response formats
    let orders: any[] = [];
    
    if (Array.isArray(data)) {
      orders = data;
    } else if (data && Array.isArray(data.data)) {
      orders = data.data;
    } else if (data && Array.isArray(data.content)) {
      orders = data.content;
    } else {
      console.error('Unexpected response format:', data);
      return [];
    }
    
    console.log('✅ Orders array for dealer:', orders);
    
    // Map backend field names to frontend Order interface
    const mappedOrders: Order[] = orders.map((order: any) => ({
      orderId: order.orderId || order.id || order.orderID,
      dealerId: order.dealerId,
      dealerName: order.dealerName,
      orderDate: order.orderDate,
      desiredDeliveryDate: order.desiredDeliveryDate || '',
      actualDeliveryDate: order.actualDeliveryDate,
      subtotal: order.subtotal || 0,
      dealerDiscount: order.totalDiscount || order.dealerDiscount || 0,
      vatAmount: order.vatAmount || 0,
      grandTotal: order.totalPrice || order.grandTotal || 0,
      deliveryAddress: order.deliveryAddress || '',
      deliveryNote: order.deliveryNote || '',
      orderStatus: order.orderStatus || 'PENDING',
      paymentStatus: order.paymentStatus || 'PENDING',
      paymentMethod: order.paymentMethod || 'CASH',
      orderItems: order.orderItems ? order.orderItems.map((item: any) => ({
        vehicleId: item.vehicleId,
        vehicleName: item.vehicleName || item.name || `Vehicle #${item.vehicleId}`,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        itemSubtotal: item.itemSubtotal || 0,
        itemDiscount: item.itemDiscount || 0,
        itemTotal: item.itemTotal || 0
      })) : []
    }));
    
    console.log('✅ Mapped orders for dealer:', mappedOrders);
    return mappedOrders;
    
  } catch (error: any) {
    console.error('Error fetching orders by dealer:', error);
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
    
    const data = response.data;
    
    // Extract order data if wrapped in { data: {...} }
    let orderData = data;
    if (data.data && data.statusCode) {
      orderData = data.data;
    }
    
    console.log('✅ Order data:', orderData);
    
    // Map backend field names to frontend Order interface
    const mappedOrder: Order = {
      orderId: orderData.orderId || orderData.id || orderData.orderID,
      dealerId: orderData.dealerId,
      dealerName: orderData.dealerName,
      orderDate: orderData.orderDate,
      desiredDeliveryDate: orderData.desiredDeliveryDate || '',
      actualDeliveryDate: orderData.actualDeliveryDate,
      subtotal: orderData.subtotal || 0,
      dealerDiscount: orderData.totalDiscount || orderData.dealerDiscount || 0,
      vatAmount: orderData.vatAmount || 0,
      grandTotal: orderData.totalPrice || orderData.grandTotal || 0,
      deliveryAddress: orderData.deliveryAddress || '',
      deliveryNote: orderData.deliveryNote || '',
      orderStatus: orderData.orderStatus || 'PENDING',
      paymentStatus: orderData.paymentStatus || 'PENDING',
      paymentMethod: orderData.paymentMethod || 'CASH',
      orderItems: orderData.orderItems ? orderData.orderItems.map((item: any) => ({
        vehicleId: item.vehicleId,
        vehicleName: item.vehicleName || item.name || `Vehicle #${item.vehicleId}`,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        itemSubtotal: item.itemSubtotal || 0,
        itemDiscount: item.itemDiscount || 0,
        itemTotal: item.itemTotal || 0
      })) : []
    };
    
    return mappedOrder;
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
 * PUT /api/orders/{id}/cancel - Cancel order
 */
export const cancelOrder = async (id: number | string): Promise<void> => {
  try {
    console.log('🚫 Cancelling order:', id);
    const response = await api.put(`/api/orders/${id}/cancel`);
    console.log('✅ Order cancelled successfully:', response.data);
  } catch (error: any) {
    console.error('❌ Error cancelling order:', error);
    console.error('Error response:', error.response?.data);
    const message = error.response?.data?.message || 'Không thể hủy đơn hàng';
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
