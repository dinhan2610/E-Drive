// Order types for E-Drive

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface OrderSummary {
  id: number;
  code: string;                 // SO-2025-xxxx
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  paidTotal: number;
  remaining: number;
  status: string;
}

// Order types for contract creation
export interface OrderLite {
  id: string;
  code: string; // SO-2025-xxxx
  customer: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  dealer: {
    id: string;
    name: string;
  };
  vehicle: {
    model: string;
    variant?: string;
    color?: string;
    vin?: string;
  };
  money: {
    subtotal: number;
    discount: number;
    taxPercent: number;
    fees?: number;
    total: number;
    paidTotal: number;
    remaining: number;
  };
  status: string; // CONFIRMED/ALLOCATED/...
  hasContract?: boolean;
  createdAt: string;
  // Additional fields for contract page display
  orderDate?: string;
  desiredDeliveryDate?: string;
  orderStatus?: string;
  paymentStatus?: string;
  deliveryAddress?: string;
  deliveryNote?: string;
  orderItems?: Array<{
    vehicleName: string;
    vehicleVersion?: string;
    quantity: number;
    unitPrice: number;
    itemSubtotal: number;
    itemDiscount: number;
    itemTotal: number;
    color?: string;
  }>;
}
