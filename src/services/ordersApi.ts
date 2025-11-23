import apiClient from '../lib/apiClient';
import type { OrderLite } from '../types/order';
import { getOrderById as getOrderByIdFromApi, type Order } from './orderApi';

// Search orders for contract (only orders without contract)
export async function searchOrdersForContract(q?: string): Promise<OrderLite[]> {
  try {
    const response = await apiClient.get<any>('/api/orders/for-contract', { 
      params: { q } 
    });
    
    // Mock data if backend not ready
    if (response.status === 404) {
      return mockOrdersForContract(q);
    }
    
    const items = response.data?.items || response.data || [];
    return items.map(mapToOrderLite);
  } catch (error: any) {
    console.warn('Using mock data for orders:', error.message);
    return mockOrdersForContract(q);
  }
}

// Get order by ID for contract creation - using real API
export async function getOrderById(id: string): Promise<OrderLite> {
  try {
    
    const order = await getOrderByIdFromApi(id);
    
    const orderLite = await mapApiOrderToOrderLite(order);
    
    return orderLite;
  } catch (error: any) {
    console.error('❌ [Contract] Error fetching order:', error);
    
    // Fallback to mock data
    console.warn('⚠️ [Contract] Using mock data as fallback');
    const mockOrders = mockOrdersForContract();
    const found = mockOrders.find(o => o.id === id);
    if (found) {
      return found;
    }
    
    throw new Error(error?.message || 'Không thể lấy thông tin đơn hàng');
  }
}

// Helper: Map API Order to OrderLite
async function mapApiOrderToOrderLite(order: Order): Promise<OrderLite> {
  // Get first vehicle from orderItems
  const firstItem = order.orderItems?.[0];
  const vehicleName = firstItem?.vehicleName || 'Xe điện';
  const [model, ...variantParts] = vehicleName.split(' - ');
  const variant = variantParts.join(' - ') || 'Standard';
  
  // Try to get dealer info for contact
  let customerName = order.dealerName || 'Khách hàng';
  let customerPhone = '';
  let customerEmail = '';
  
  if (order.dealerId) {
    try {
      const { getDealerById } = await import('./dealerApi');
      const dealer = await getDealerById(order.dealerId);
      if (dealer) {
        customerName = dealer.contactPerson || dealer.dealerName || customerName;
        customerPhone = dealer.phone || '';
      }
    } catch (error) {
      console.warn('Could not fetch dealer info:', error);
    }
  }
  
  return {
    id: order.orderId?.toString() || '',
    code: `${order.orderId}`,
    customer: {
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
      address: order.deliveryAddress || '',
    },
    dealer: {
      id: order.dealerId?.toString() || '',
      name: order.dealerName || 'Showroom chính',
    },
    vehicle: {
      model: model || vehicleName,
      variant: variant,
      color: '',
      vin: '',
    },
    money: {
      subtotal: order.subtotal || 0,
      discount: order.dealerDiscount || 0,
      taxPercent: order.subtotal > 0 ? Math.round((order.vatAmount / order.subtotal) * 100) : 10,
      fees: 0,
      total: order.grandTotal || 0,
      paidTotal: order.paymentStatus === 'PAID' ? order.grandTotal : 0,
      remaining: order.paymentStatus === 'PAID' ? 0 : order.grandTotal,
    },
    status: order.orderStatus || 'CONFIRMED',
    hasContract: false,
    createdAt: order.orderDate || new Date().toISOString(),
    // Additional fields for contract page
    orderDate: order.orderDate,
    desiredDeliveryDate: order.desiredDeliveryDate,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    deliveryAddress: order.deliveryAddress,
    deliveryNote: order.deliveryNote,
    orderItems: order.orderItems?.map(item => ({
      vehicleName: item.vehicleName,
      vehicleVersion: item.vehicleVersion || '', // Add version from API
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      itemSubtotal: item.itemSubtotal,
      itemDiscount: item.itemDiscount,
      itemTotal: item.itemTotal,
      color: item.colorName || item.color || '', // Map colorName from backend to color
    })) || [],
  };
}

// Helper: Map backend response to OrderLite
function mapToOrderLite(order: any): OrderLite {
  return {
    id: order.id?.toString() || order._id?.toString() || '',
    code: order.orderCode || order.code || '',
    customer: {
      name: order.customerName || order.customer?.name || '',
      phone: order.customerPhone || order.customer?.phone || '',
      email: order.customerEmail || order.customer?.email || '',
      address: order.customerAddress || order.customer?.address || '',
    },
    dealer: {
      id: order.dealerId?.toString() || '',
      name: order.dealerName || order.dealer?.name || 'Showroom chính',
    },
    vehicle: {
      model: order.vehicleModel || order.vehicle?.model || '',
      variant: order.vehicleVariant || order.vehicle?.variant || '',
      color: order.vehicleColor || order.vehicle?.color || '',
      vin: order.vehicleVin || order.vehicle?.vin || '',
    },
    money: {
      subtotal: order.subtotal || order.money?.subtotal || 0,
      discount: order.discount || order.money?.discount || 0,
      taxPercent: order.taxPercent || order.money?.taxPercent || 10,
      fees: order.fees || order.money?.fees || 0,
      total: order.total || order.money?.total || 0,
      paidTotal: order.paidTotal || order.money?.paidTotal || 0,
      remaining: order.remaining || order.money?.remaining || 0,
    },
    status: order.status || 'CONFIRMED',
    hasContract: order.hasContract || false,
    createdAt: order.createdAt || new Date().toISOString(),
  };
}

// Mock data for development
function mockOrdersForContract(q?: string): OrderLite[] {
  const allOrders: OrderLite[] = [
    {
      id: '1',
      code: 'SO-2025-001',
      customer: {
        name: 'Nguyễn Văn A',
        phone: '0901234567',
        email: 'nguyenvana@email.com',
        address: '123 Đường ABC, Quận 1, TP.HCM',
      },
      dealer: {
        id: 'D001',
        name: 'Showroom HCM',
      },
      vehicle: {
        model: 'VinFast VF e34',
        variant: 'Eco',
        color: 'Trắng',
        vin: 'VF34ECO2025001',
      },
      money: {
        subtotal: 690000000,
        discount: 20000000,
        taxPercent: 10,
        fees: 15000000,
        total: 752000000,
        paidTotal: 100000000,
        remaining: 652000000,
      },
      status: 'CONFIRMED',
      hasContract: false,
      createdAt: '2025-01-15T08:30:00Z',
    },
    {
      id: '2',
      code: 'SO-2025-002',
      customer: {
        name: 'Trần Thị B',
        phone: '0912345678',
        email: 'tranthib@email.com',
        address: '456 Đường XYZ, Quận 3, TP.HCM',
      },
      dealer: {
        id: 'D002',
        name: 'Showroom Hà Nội',
      },
      vehicle: {
        model: 'VinFast VF 8',
        variant: 'Plus',
        color: 'Đỏ',
        vin: 'VF8PLUS2025002',
      },
      money: {
        subtotal: 1050000000,
        discount: 50000000,
        taxPercent: 10,
        fees: 20000000,
        total: 1120000000,
        paidTotal: 200000000,
        remaining: 920000000,
      },
      status: 'ALLOCATED',
      hasContract: false,
      createdAt: '2025-01-20T10:15:00Z',
    },
    {
      id: '3',
      code: 'SO-2025-003',
      customer: {
        name: 'Lê Văn C',
        phone: '0923456789',
        email: 'levanc@email.com',
        address: '789 Đường KLM, Quận 7, TP.HCM',
      },
      dealer: {
        id: 'D001',
        name: 'Showroom HCM',
      },
      vehicle: {
        model: 'VinFast VF 9',
        variant: 'Premium',
        color: 'Xanh Dương',
        vin: '',
      },
      money: {
        subtotal: 1500000000,
        discount: 100000000,
        taxPercent: 10,
        fees: 30000000,
        total: 1570000000,
        paidTotal: 300000000,
        remaining: 1270000000,
      },
      status: 'CONFIRMED',
      hasContract: false,
      createdAt: '2025-01-25T14:20:00Z',
    },
  ];

  if (!q || q.trim() === '') return allOrders;

  const query = q.toLowerCase().trim();
  return allOrders.filter(
    order =>
      order.code.toLowerCase().includes(query) ||
      order.customer.name.toLowerCase().includes(query) ||
      order.customer.phone?.includes(query) ||
      order.vehicle.model.toLowerCase().includes(query)
  );
}

// Get all orders (legacy support)
export const getAllOrders = async (): Promise<OrderLite[]> => {
  return searchOrdersForContract();
};
