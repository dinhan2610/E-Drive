export type DeliveryStatus =
  | "CONFIRMED"     // đơn đã xác nhận
  | "ALLOCATED"     // đã cấp xe/VIN
  | "IN_TRANSIT"    // đang vận chuyển
  | "AT_DEALER"     // đã về đại lý
  | "SCHEDULED"     // đã hẹn giao
  | "DELIVERED"     // đã giao
  | "ON_HOLD"       // tạm dừng/chờ xử lý
  | "CANCELLED";

export interface TrackingItem {
  id: string;             // orderId
  code: string;           // SO-2025-0001
  customerName: string;
  customerPhoneMasked: string; // 09******89
  status: DeliveryStatus;
  statusText: string;     // mô tả thân thiện
  updatedAt: string;      // ISO
  dealerName: string;
  dealerPhone?: string;
  vehicle: {
    model: string;        // E-Drive Neo S
    variant?: string;
    color?: string;
    vin?: string;
    image?: string;
  };
  milestones: Array<{
    key: DeliveryStatus | "CREATED";
    label: string;        // văn bản mốc
    at?: string;          // ISO, có thể rỗng nếu chưa đạt
    note?: string;
  }>;
  appointment?: {
    date?: string;        // ISO
    location?: string;
    contact?: string;     // cố vấn giao xe
    canRequestChange?: boolean;
  };
  documents?: Array<{
    name: string;         // Hợp đồng, Biên bản...
    url?: string;         // nếu có file
    status?: "READY" | "MISSING" | "PENDING";
  }>;
}
