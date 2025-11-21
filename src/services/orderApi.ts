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
  vehicleVersion?: string;
  colorName?: string; // Backend returns colorName
  quantity: number;
  unitPrice: number;
  itemSubtotal: number;
  itemDiscount: number;
  itemTotal: number;
  color?: string; // Frontend uses color (mapped from colorName)
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
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'CHỜ_DUYỆT' | 'ĐÃ_XÁC_NHẬN';
  paymentStatus: 'PENDING' | 'PAID' | 'CANCELLED' | 'CHỜ_DUYỆT' | 'ĐÃ_THANH_TOÁN';
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'INSTALLMENT' | 'FULL';
  billUrl?: string; // URL to uploaded bill/invoice file
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

// ===== HELPER FUNCTIONS =====

/**
 * Deduplicate order items by vehicleId + color
 * Backend sometimes returns duplicate items - we need to merge them intelligently
 */
const deduplicateOrderItems = (items: any[]): OrderItem[] => {
  if (!items || !Array.isArray(items)) return [];
  
  const itemsMap = new Map();
  items.forEach((item: any) => {
    const uniqueKey = `${item.vehicleId}-${item.colorName || item.color || ''}`;
    
    if (itemsMap.has(uniqueKey)) {
      const existing = itemsMap.get(uniqueKey);
      
      // Check if this is truly a duplicate (same values) or additional quantity
      const isTrueDuplicate = 
        existing.unitPrice === item.unitPrice &&
        existing.quantity === item.quantity &&
        existing.itemTotal === item.itemTotal;
      
      if (isTrueDuplicate) {
        // True duplicate - backend error, skip it
        console.warn(`⚠️ Skipping duplicate item:`, {
          vehicleId: item.vehicleId,
          color: item.colorName,
          quantity: item.quantity
        });
      } else {
        // Different values - actually different orders, sum them
        existing.quantity += (item.quantity || 1);
        existing.itemSubtotal += (item.itemSubtotal || 0);
        existing.itemDiscount += (item.itemDiscount || 0);
        existing.itemTotal += (item.itemTotal || 0);
      }
    } else {
      itemsMap.set(uniqueKey, {
        vehicleId: item.vehicleId,
        vehicleName: item.vehicleName || item.name || `Vehicle #${item.vehicleId}`,
        vehicleVersion: item.vehicleVersion || item.version || '',
        colorName: item.colorName || item.color || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        itemSubtotal: item.itemSubtotal || 0,
        itemDiscount: item.itemDiscount || 0,
        itemTotal: item.itemTotal || 0,
        color: item.colorName || item.color || ''
      });
    }
  });
  
  return Array.from(itemsMap.values());
};

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

    // Map backend field names to frontend Order interface
    const mappedOrders: Order[] = orders.map((order: any) => {
      
      // Deduplicate items and calculate correct subtotal
      const deduplicatedItems = deduplicateOrderItems(order.orderItems || []);
      const calculatedSubtotal = deduplicatedItems.reduce((sum, item) => sum + item.itemTotal, 0);
      const correctSubtotal = calculatedSubtotal > 0 ? calculatedSubtotal : (order.subtotal || 0);
      
      const mappedOrder = {
        orderId: order.orderId || order.id || order.orderID,
        dealerId: order.dealerId,
        dealerName: order.dealerName,
        orderDate: order.orderDate,
        desiredDeliveryDate: order.desiredDeliveryDate || '',
        actualDeliveryDate: order.actualDeliveryDate,
        subtotal: correctSubtotal, // ✅ Use calculated subtotal
        dealerDiscount: order.totalDiscount || order.dealerDiscount || 0,
        vatAmount: order.vatAmount || 0,
        grandTotal: order.totalPrice || order.grandTotal || 0,
        deliveryAddress: order.deliveryAddress || '',
        deliveryNote: order.deliveryNote || '',
        orderStatus: order.orderStatus || 'PENDING',
        paymentStatus: order.paymentStatus || 'PENDING',
        paymentMethod: order.paymentMethod || 'CASH',
        orderItems: deduplicatedItems // ✅ Use deduplicated items
      };
      
      return mappedOrder;
    });

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
    const mappedOrders: Order[] = filteredOrders.map((order: any) => {
      // Deduplicate items and calculate correct subtotal
      const deduplicatedItems = deduplicateOrderItems(order.orderItems || []);
      const calculatedSubtotal = deduplicatedItems.reduce((sum, item) => sum + item.itemTotal, 0);
      const correctSubtotal = calculatedSubtotal > 0 ? calculatedSubtotal : Number(order.subtotal || 0);
      
      return {
        orderId: order.orderId || order.id || order.orderID,
        dealerId: Number(order.dealerId),
        dealerName: order.dealerName,
        orderDate: order.orderDate,
        desiredDeliveryDate: order.desiredDeliveryDate || '',
        actualDeliveryDate: order.actualDeliveryDate || null,
        subtotal: correctSubtotal, // ✅ Use calculated subtotal
        dealerDiscount: Number(order.totalDiscount || order.dealerDiscount || 0),
        vatAmount: Number(order.vatAmount || 0),
        grandTotal: Number(order.totalPrice || order.grandTotal || 0),
        deliveryAddress: order.deliveryAddress || '',
        deliveryNote: order.deliveryNote || '',
        orderStatus: order.orderStatus || 'PENDING',
        paymentStatus: order.paymentStatus || 'PENDING',
        paymentMethod: order.paymentMethod || 'CASH',
        orderItems: deduplicatedItems // ✅ Use deduplicated items
      };
    });

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

    const data = response.data;

    // Extract order data if wrapped in { data: {...} }
    let orderData = data;
    if (data.data && data.statusCode) {
      orderData = data.data;
    }

    // Deduplicate and calculate correct subtotal from items
    const deduplicatedItems = deduplicateOrderItems(orderData.orderItems || []);
    
    // Calculate subtotal from items (sum of all itemTotal)
    const calculatedSubtotal = deduplicatedItems.reduce((sum, item) => sum + item.itemTotal, 0);
    
    // Use calculated subtotal if backend subtotal is incorrect
    const correctSubtotal = calculatedSubtotal > 0 ? calculatedSubtotal : (orderData.subtotal || 0);

    // Map backend field names to frontend Order interface
    const mappedOrder: Order = {
      orderId: orderData.orderId || orderData.id || orderData.orderID,
      dealerId: orderData.dealerId,
      dealerName: orderData.dealerName,
      orderDate: orderData.orderDate,
      desiredDeliveryDate: orderData.desiredDeliveryDate || '',
      actualDeliveryDate: orderData.actualDeliveryDate,
      subtotal: correctSubtotal, // ✅ Use calculated subtotal
      dealerDiscount: orderData.totalDiscount || orderData.dealerDiscount || 0,
      vatAmount: orderData.vatAmount || 0,
      grandTotal: orderData.totalPrice || orderData.grandTotal || 0,
      deliveryAddress: orderData.deliveryAddress || '',
      deliveryNote: orderData.deliveryNote || '',
      orderStatus: orderData.orderStatus || 'PENDING',
      paymentStatus: orderData.paymentStatus || 'PENDING',
      paymentMethod: orderData.paymentMethod || 'CASH',
      orderItems: deduplicatedItems // ✅ Use deduplicated items
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
    const response = await api.put<Order>(`/api/orders/${orderId}`, {
      paymentStatus
    });
    
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
  orderStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'CHỜ_DUYỆT' | 'ĐÃ_XÁC_NHẬN'
): Promise<Order> => {
  try {
    const response = await api.put<Order>(`/api/orders/${orderId}`, {
      orderStatus
    });
    
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
 * Updates both orderStatus and paymentStatus to CANCELLED
 */
export const cancelOrder = async (id: number | string, reason?: string): Promise<Order> => {
  try {
    const response = await api.put<any>(`/api/orders/${id}/cancel`, 
      reason ? { reason } : undefined
    );
    
    // Extract order from response (backend wraps in {statusCode, message, data})
    const orderData = response.data?.data || response.data;
    
    // Ensure both statuses are CANCELLED
    const cancelledOrder = {
      ...orderData,
      orderStatus: 'CANCELLED' as const,
      paymentStatus: 'CANCELLED' as const
    };
    
    return cancelledOrder;
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
    const response = await api.put<Order>(`/api/orders/${id}/mark-paid`);
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
  // Normalize status: remove underscores and convert to uppercase
  const normalizedStatus = status?.toUpperCase().replace(/_/g, ' ').trim();
  
  const statusMap: Record<string, string> = {
    'PENDING': 'Chờ duyệt',
    'CHO DUYET': 'Chờ duyệt',
    'CHỜ DUYỆT': 'Chờ duyệt',
    'CONFIRMED': 'Đã xác nhận',
    'DA XAC NHAN': 'Đã xác nhận',
    'ĐÃ XÁC NHẬN': 'Đã xác nhận',
    'PROCESSING': 'Đang xử lý',
    'DANG XU LY': 'Đang xử lý',
    'ĐANG XỬ LÝ': 'Đang xử lý',
    'SHIPPED': 'Đang giao hàng',
    'DANG GIAO': 'Đang giao hàng',
    'ĐANG GIAO': 'Đang giao hàng',
    'DELIVERED': 'Đã giao hàng',
    'DA GIAO': 'Đã giao hàng',
    'ĐÃ GIAO': 'Đã giao hàng',
    'CANCELLED': 'Đã hủy',
    'DA HUY': 'Đã hủy',
    'ĐÃ HỦY': 'Đã hủy',
    'DA HUỶ': 'Đã hủy',
    'ĐÃ HUỶ': 'Đã hủy',
  };
  
  return statusMap[normalizedStatus] || status;
};

/**
 * Utility: Format payment status to Vietnamese
 * Auto-corrects invalid payment status from backend (e.g., "CHỜ_DUYỆT" → "Chờ thanh toán")
 */
export const formatPaymentStatus = (status: string): string => {
  // Normalize status: remove underscores and convert to uppercase
  const normalizedStatus = status?.toUpperCase().replace(/_/g, ' ').trim();
  
  // Mapping with business logic correction:
  // Backend sometimes returns order status values for payment status (e.g., "CHỜ_DUYỆT")
  // We auto-correct these to proper payment status values
  const statusMap: Record<string, string> = {
    // Valid payment statuses
    'PENDING': 'Chờ thanh toán',
    'CHO THANH TOAN': 'Chờ thanh toán',
    'CHỜ THANH TOÁN': 'Chờ thanh toán',
    'PAID': 'Đã thanh toán',
    'DA THANH TOAN': 'Đã thanh toán',
    'ĐÃ THANH TOÁN': 'Đã thanh toán',
    'CANCELLED': 'Đã hủy',
    'DA HUY': 'Đã hủy',
    'ĐÃ HỦY': 'Đã hủy',
    'DA HUỶ': 'Đã hủy',
    'ĐÃ HUỶ': 'Đã hủy',
    
    // Auto-correct: Backend incorrectly returns order status as payment status
    // "Chờ duyệt" is an ORDER status, not a PAYMENT status
    // Convert to proper payment status: "Chờ thanh toán"
    'CHO DUYET': 'Chờ thanh toán',
    'CHỜ DUYỆT': 'Chờ thanh toán',
    'CONFIRMED': 'Chờ thanh toán',
    'DA XAC NHAN': 'Chờ thanh toán',
    'ĐÃ XÁC NHẬN': 'Chờ thanh toán',
  };
  
  return statusMap[normalizedStatus] || 'Chờ thanh toán';
};

/**
 * Utility: Get CSS class name for order status (normalized to English for styling)
 */
export const getOrderStatusClass = (status: string): string => {
  const normalizedStatus = status?.toUpperCase().replace(/_/g, ' ').trim();
  
  const classMap: Record<string, string> = {
    'PENDING': 'pending',
    'CHO DUYET': 'pending',
    'CHỜ DUYỆT': 'pending',
    'CONFIRMED': 'confirmed',
    'DA XAC NHAN': 'confirmed',
    'ĐÃ XÁC NHẬN': 'confirmed',
    'PROCESSING': 'processing',
    'DANG XU LY': 'processing',
    'ĐANG XỬ LÝ': 'processing',
    'SHIPPED': 'shipped',
    'DANG GIAO': 'shipped',
    'ĐANG GIAO': 'shipped',
    'DELIVERED': 'delivered',
    'DA GIAO': 'delivered',
    'ĐÃ GIAO': 'delivered',
    'CANCELLED': 'cancelled',
    'DA HUY': 'cancelled',
    'ĐÃ HỦY': 'cancelled',
    'DA HUỶ': 'cancelled',
    'ĐÃ HUỶ': 'cancelled',
  };
  return classMap[normalizedStatus] || 'pending';
};

/**
 * Utility: Get CSS class name for payment status (normalized to English for styling)
 */
export const getPaymentStatusClass = (status: string): string => {
  const normalizedStatus = status?.toUpperCase().replace(/_/g, ' ').trim();
  
  const classMap: Record<string, string> = {
    'PENDING': 'pending',
    'CHO THANH TOAN': 'pending',
    'CHỜ THANH TOÁN': 'pending',
    'CHO DUYET': 'pending',
    'CHỜ DUYỆT': 'pending',
    'PAID': 'paid',
    'DA THANH TOAN': 'paid',
    'ĐÃ THANH TOÁN': 'paid',
    'CANCELLED': 'cancelled',
    'DA HUY': 'cancelled',
    'ĐÃ HỦY': 'cancelled',
    'DA HUỶ': 'cancelled',
    'ĐÃ HUỶ': 'cancelled',
  };
  return classMap[normalizedStatus] || 'pending';
};

/**
 * Utility: Format payment method to Vietnamese
 */
export const formatPaymentMethod = (method: string): string => {
  // Normalize method: remove underscores and convert to uppercase
  const normalizedMethod = method?.toUpperCase().replace(/_/g, ' ').trim();
  
  const methodMap: Record<string, string> = {
    'CASH': 'Tiền mặt',
    'TIỀN MẶT': 'Tiền mặt',
    'BANK TRANSFER': 'Chuyển khoản',
    'CHUYỂN KHOẢN': 'Chuyển khoản',
    'INSTALLMENT': 'Trả góp',
    'TRẢ GÓP': 'Trả góp',
    'FULL': 'Thanh toán đầy đủ',
    'THANH TOÁN ĐẦY ĐỦ': 'Thanh toán đầy đủ',
  };
  return methodMap[normalizedMethod] || method;
};

/**
 * Upload bill/invoice file for an order
 * @param orderId - ID of the order
 * @param file - Bill file to upload (image/pdf)
 * @returns Promise<void>
 */
export const uploadOrderBill = async (orderId: number | string, file: File): Promise<void> => {
  try {
    // Create FormData
    const formData = new FormData();
    formData.append('bill', file);
    
    // Upload bill - Sử dụng /api prefix vì backend cần
    const response = await api.post(`/api/orders/${orderId}/upload-bill`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
    const response = await api.get(`/api/orders/${orderId}/bill-preview`, {
      responseType: 'blob', // Important: Get file as blob
    });
    
    const blob = response.data as Blob;
    
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