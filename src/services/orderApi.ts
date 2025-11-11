// services/orderApi.ts - API cho Order Management

import api from "../lib/apiClient";

// ===== TYPES =====

export interface CreateOrderRequest {
  vehicleId?: string; // Optional for backward compatibility
  quantity?: string; // Optional for backward compatibility
  orderItems?: Array<{ // New: support multiple items
    vehicleId: number;
    quantity: number;
    color?: string;
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
  color?: string;
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
        itemTotal: item.itemTotal || 0,
        color: item.color
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
 * Includes strict filtering to ensure only correct dealer orders are returned
 */
export const getOrdersByDealer = async (dealerId: number): Promise<Order[]> => {
  try {
    const response = await api.get<any>(`/api/orders/dealer/${dealerId}`);
    const data = response.data;

    // Extract orders array from response
    const rawOrders: any[] = Array.isArray(data) 
      ? data 
      : (data?.data || data?.content || []);

    if (!Array.isArray(rawOrders)) {
      console.error('Invalid response format');
      return [];
    }

    // CRITICAL: Filter to ensure ONLY orders for this dealer
    const filteredOrders = rawOrders.filter(order => {
      const orderDealerId = Number(order.dealerId);
      const isMatch = orderDealerId === Number(dealerId);
      
      if (!isMatch) {
        console.warn(`⚠️ Filtered out order ${order.orderId} - belongs to dealer ${orderDealerId}, not ${dealerId}`);
      }
      
      return isMatch;
    });

    if (filteredOrders.length === 0) {
      return [];
    }

    // Map to frontend Order interface
    const mappedOrders: Order[] = filteredOrders.map((order: any) => ({
      orderId: order.orderId || order.id || order.orderID,
      dealerId: Number(order.dealerId),
      dealerName: order.dealerName,
      orderDate: order.orderDate,
      desiredDeliveryDate: order.desiredDeliveryDate || '',
      actualDeliveryDate: order.actualDeliveryDate || null,
      subtotal: Number(order.subtotal || 0),
      dealerDiscount: Number(order.totalDiscount || order.dealerDiscount || 0),
      vatAmount: Number(order.vatAmount || 0),
      grandTotal: Number(order.totalPrice || order.grandTotal || 0),
      deliveryAddress: order.deliveryAddress || '',
      deliveryNote: order.deliveryNote || '',
      orderStatus: order.orderStatus || 'PENDING',
      paymentStatus: order.paymentStatus || 'PENDING',
      paymentMethod: order.paymentMethod || 'CASH',
      orderItems: order.orderItems?.map((item: any) => ({
        vehicleId: item.vehicleId,
        vehicleName: item.vehicleName || item.name || `Vehicle #${item.vehicleId}`,
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice || 0),
        itemSubtotal: Number(item.itemSubtotal || 0),
        itemDiscount: Number(item.itemDiscount || 0),
        itemTotal: Number(item.itemTotal || 0),
        color: item.color
      })) || []
    }));

    console.log(`✅ Loaded ${mappedOrders.length} orders for dealer ${dealerId}`);
    return mappedOrders;

  } catch (error: any) {
    console.error('❌ Error fetching orders by dealer:', error);
    
    // Handle specific error codes
    if (error.response?.status === 404) {
      throw new OrderApiError('Dealer không tồn tại', 'DEALER_NOT_FOUND', error);
    }
    if (error.response?.status === 403) {
      throw new OrderApiError('Bạn không có quyền xem đơn hàng của dealer này', 'FORBIDDEN', error);
    }
    
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
        itemTotal: item.itemTotal || 0,
        color: item.color
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
 * Update payment status for an order
 * @param orderId - ID of the order
 * @param paymentStatus - New payment status
 */
export const updatePaymentStatus = async (
  orderId: number | string, 
  paymentStatus: 'PENDING' | 'PAID' | 'CANCELLED'
): Promise<Order> => {
  try {
    console.log('💳 Updating payment status for order:', orderId, '→', paymentStatus);
    
    const response = await api.put<Order>(`/api/orders/${orderId}`, {
      paymentStatus
    });
    
    console.log('✅ Payment status updated:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error updating payment status:', error);
    
    if (error.response?.status === 404) {
      throw new OrderApiError('Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND');
    } else if (error.response?.status === 403) {
      throw new OrderApiError('Bạn không có quyền cập nhật đơn hàng này', 'FORBIDDEN');
    } else {
      throw new OrderApiError(
        error.response?.data?.message || 'Không thể cập nhật trạng thái thanh toán',
        'UPDATE_FAILED'
      );
    }
  }
};

/**
 * Update order status
 * @param orderId - ID of the order
 * @param orderStatus - New order status
 */
export const updateOrderStatus = async (
  orderId: number | string, 
  orderStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
): Promise<Order> => {
  try {
    console.log('📦 Updating order status for order:', orderId, '→', orderStatus);
    
    const response = await api.put<Order>(`/api/orders/${orderId}`, {
      orderStatus
    });
    
    console.log('✅ Order status updated:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error updating order status:', error);
    
    if (error.response?.status === 404) {
      throw new OrderApiError('Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND');
    } else if (error.response?.status === 403) {
      throw new OrderApiError('Bạn không có quyền cập nhật đơn hàng này', 'FORBIDDEN');
    } else {
      throw new OrderApiError(
        error.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng',
        'UPDATE_FAILED'
      );
    }
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
 * PUT /api/orders/{id}/mark-paid - Mark order as paid
 * Requires: Order must have uploaded bill
 */
export const markOrderAsPaid = async (id: number | string): Promise<Order> => {
  try {
    console.log('💰 Marking order as paid:', id);
    const response = await api.put<Order>(`/api/orders/${id}/mark-paid`);
    console.log('✅ Order marked as paid successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error marking order as paid:', error);
    console.error('Error response:', error.response?.data);
    
    // Extract error message from backend
    let message = 'Không thể xác nhận thanh toán';
    
    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.response?.status === 400) {
      message = 'Đơn hàng chưa có hóa đơn. Vui lòng yêu cầu đại lý upload hóa đơn trước!';
    } else if (error.response?.status === 404) {
      message = 'Không tìm thấy đơn hàng';
    }
    
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

/**
 * Upload bill/invoice file for an order
 * @param orderId - ID of the order
 * @param file - Bill file to upload (image/pdf)
 * @returns Promise<void>
 */
export const uploadOrderBill = async (orderId: number | string, file: File): Promise<void> => {
  try {
    console.log('📤 Uploading bill for order:', orderId);
    console.log('📄 File details:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)} KB`
    });
    
    // Create FormData
    const formData = new FormData();
    formData.append('bill', file);
    
    // Upload bill - Sử dụng /api prefix vì backend cần
    const response = await api.post(`/api/orders/${orderId}/upload-bill`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('✅ Bill uploaded successfully:', response.data);
  } catch (error: any) {
    console.error('❌ Error uploading bill:', error);
    console.error('Response:', error.response?.data);
    
    if (error.response?.status === 404) {
      throw new OrderApiError('Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND');
    } else if (error.response?.status === 403) {
      throw new OrderApiError('Bạn không có quyền upload hóa đơn cho đơn hàng này', 'FORBIDDEN');
    } else if (error.response?.status === 400) {
      const errorMsg = error.response?.data?.message || 'File không hợp lệ';
      throw new OrderApiError(errorMsg, 'INVALID_FILE');
    } else {
      throw new OrderApiError(
        error.response?.data?.message || 'Không thể upload hóa đơn',
        'UPLOAD_FAILED'
      );
    }
  }
};

/**
 * Get bill preview for an order
 * @param orderId - ID of the order
 * @returns Promise<Blob> - Bill file as Blob
 */
export const getBillPreview = async (orderId: number | string): Promise<Blob> => {
  try {
    console.log('📥 Fetching bill preview for order:', orderId);
    
    const response = await api.get(`/api/orders/${orderId}/bill-preview`, {
      responseType: 'blob', // Important: Get file as blob
    });
    
    const blob = response.data as Blob;
    
    console.log('✅ Bill preview fetched:', {
      size: `${(blob.size / 1024).toFixed(2)} KB`,
      type: blob.type
    });
    
    return blob;
  } catch (error: any) {
    console.error('❌ Error fetching bill preview:', error);
    
    if (error.response?.status === 404) {
      throw new OrderApiError('Không tìm thấy hóa đơn cho đơn hàng này', 'BILL_NOT_FOUND');
    } else if (error.response?.status === 403) {
      throw new OrderApiError('Bạn không có quyền xem hóa đơn này', 'FORBIDDEN');
    } else {
      throw new OrderApiError('Không thể tải hóa đơn', 'FETCH_FAILED');
    }
  }
};