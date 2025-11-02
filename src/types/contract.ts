// Contract types

import type { OrderLite } from './order';

export type ContractStatus = "DRAFT" | "SIGNING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface ContractPayload {
  orderId: string;
  order?: OrderLite; // Full order data for display
  contractNo?: string; // auto gen nếu bỏ trống
  buyer: { 
    name: string; 
    phone?: string; 
    email?: string; 
    address?: string 
  };
  dealer: { 
    id: string; 
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    taxCode?: string;
    representative?: string;
  };
  manufacturer?: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    taxCode?: string;
    representative?: string;
  };
  vehicle: { 
    model: string; 
    variant?: string; 
    color?: string; 
    vin?: string 
  };
  terms: {
    deliveryDate?: string; // ISO
    deliveryLocation?: string;
    warrantyMonths?: number;
    notes?: string;
  };
  pricing: {
    subtotal: number;
    discount: number;
    taxPercent: number; // ví dụ VAT 10
    fees?: number; // bảo hiểm/biển số/hồ sơ
    total: number; // computed
    paidTotal?: number;
    remaining?: number;
  };
  attachments?: Array<{ name: string; url?: string }>;
}

export interface Contract extends ContractPayload {
  id: string;
  status: ContractStatus;
  pdfUrl?: string;
  signRequestId?: string;
  createdAt: string;
  updatedAt: string;
}

// Legacy types for backward compatibility with old ContractCreatePage
export interface ContractFormData {
  orderId: string;
  orderCode: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  buyerIdNumber: string;
  buyerAddress: string;
  dealerId: string;
  dealerName: string;
  vehicleModel: string;
  vehicleVariant: string;
  vehicleColor: string;
  vehicleYear?: number;
  vehicleVin: string;
  signDate: string;
  deliveryDate: string;
  deliveryLocation: string;
  warrantyTerms: string;
  notes: string;
  subtotal: number;
  discount: number;
  taxPercent: number;
  fees: number;
}

export interface ContractValidationErrors {
  buyer?: {
    name?: string;
    phone?: string;
    email?: string;
    idNumber?: string;
    address?: string;
  };
  vehicle?: {
    model?: string;
    variant?: string;
    color?: string;
    year?: string;
  };
  terms?: {
    signDate?: string;
    deliveryDate?: string;
    deliveryLocation?: string;
  };
  pricing?: {
    subtotal?: string;
    discount?: string;
  };
}
