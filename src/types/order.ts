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
