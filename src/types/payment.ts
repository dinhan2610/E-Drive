// Payment types for E-Drive

export interface CashRequest {
  orderId: string;
  amount: number;     // số tiền thu ngay
  note?: string;
}

export interface CashResponse {
  orderId: number;
  paidNow: number;
  totalCollected: number;
  grandTotal: number;
  remaining: number;
  changeAmount: number;
  orderStatus: string;
  paymentStatus: string;
}

export interface VnPayInitResponse {
  paymentUrl: string;  // URL để redirect đến VNPAY
}

export interface VnPayReturnPayload {
  [k: string]: string | undefined; // nhận toàn bộ query trả về
  vnp_ResponseCode?: string;
  vnp_TransactionStatus?: string;
  vnp_Amount?: string;
  vnp_BankCode?: string;
  vnp_TransactionNo?: string;
  vnp_OrderInfo?: string;
}

export type PaymentMethod = 'VNPAY' | 'CASH';

export interface PaymentHistory {
  id: number;
  orderId: number;
  amount: number;
  method: PaymentMethod;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  transactionNo?: string;
  createdAt: string;
}
