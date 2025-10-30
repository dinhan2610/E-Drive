import api from "../lib/apiClient";
import type { TrackingItem, DeliveryStatus } from "../types/tracking";

// Mock data generator
const generateMockTracking = (code: string): TrackingItem => {
  const statusOptions: DeliveryStatus[] = ["CONFIRMED", "ALLOCATED", "IN_TRANSIT", "AT_DEALER", "SCHEDULED", "DELIVERED"];
  const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
  
  const statusTexts: Record<DeliveryStatus, string> = {
    CONFIRMED: "Đơn hàng đã được xác nhận",
    ALLOCATED: "Đã phân bổ xe cho đơn hàng",
    IN_TRANSIT: "Xe đang được vận chuyển",
    AT_DEALER: "Xe đã về đại lý",
    SCHEDULED: "Đã lên lịch giao xe",
    DELIVERED: "Đã giao xe thành công",
    ON_HOLD: "Đơn hàng tạm dừng",
    CANCELLED: "Đơn hàng đã hủy"
  };

  const milestones = [
    { key: "CREATED" as const, label: "Đơn hàng được tạo", at: "2025-01-15T10:00:00Z" },
    { key: "CONFIRMED" as const, label: "Xác nhận đơn hàng", at: randomStatus !== "CONFIRMED" ? "2025-01-16T14:30:00Z" : undefined },
    { key: "ALLOCATED" as const, label: "Phân bổ xe", at: ["ALLOCATED", "IN_TRANSIT", "AT_DEALER", "SCHEDULED", "DELIVERED"].includes(randomStatus) ? "2025-01-20T09:15:00Z" : undefined },
    { key: "IN_TRANSIT" as const, label: "Vận chuyển", at: ["IN_TRANSIT", "AT_DEALER", "SCHEDULED", "DELIVERED"].includes(randomStatus) ? "2025-01-22T08:00:00Z" : undefined },
    { key: "AT_DEALER" as const, label: "Về đại lý", at: ["AT_DEALER", "SCHEDULED", "DELIVERED"].includes(randomStatus) ? "2025-01-25T16:00:00Z" : undefined },
    { key: "SCHEDULED" as const, label: "Hẹn lịch giao xe", at: ["SCHEDULED", "DELIVERED"].includes(randomStatus) ? "2025-01-26T10:00:00Z" : undefined },
    { key: "DELIVERED" as const, label: "Hoàn tất giao xe", at: randomStatus === "DELIVERED" ? "2025-01-28T14:00:00Z" : undefined }
  ];

  return {
    id: code.split("-")[2] || "0001",
    code,
    customerName: "Nguyễn Văn A",
    customerPhoneMasked: "09******89",
    status: randomStatus,
    statusText: statusTexts[randomStatus],
    updatedAt: new Date().toISOString(),
    dealerName: "E-Drive Showroom Hà Nội",
    dealerPhone: "0241234567",
    vehicle: {
      model: "E-Drive Neo S",
      variant: "Premium",
      color: "Trắng ngọc trai",
      vin: ["ALLOCATED", "IN_TRANSIT", "AT_DEALER", "SCHEDULED", "DELIVERED"].includes(randomStatus) ? "EDNEO2025S000001" : undefined,
      image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&q=80"
    },
    milestones,
    appointment: ["SCHEDULED", "DELIVERED"].includes(randomStatus) ? {
      date: "2025-01-28T14:00:00Z",
      location: "E-Drive Showroom Hà Nội - 123 Đường Láng, Đống Đa",
      contact: "Trần Minh Tuấn - 0912345678",
      canRequestChange: randomStatus === "SCHEDULED"
    } : undefined,
    documents: [
      { name: "Hợp đồng mua bán", status: "READY" as const, url: "#" },
      { name: "Biên bản giao nhận", status: randomStatus === "DELIVERED" ? "READY" as const : "PENDING" as const },
      { name: "Hóa đơn VAT", status: "READY" as const, url: "#" },
      { name: "Hồ sơ đăng ký xe", status: randomStatus === "DELIVERED" ? "READY" as const : "PENDING" as const }
    ]
  };
};

// Tra cứu theo mã đơn
export async function trackByCode(code: string): Promise<TrackingItem> {
  try {
    const { data } = await api.get<TrackingItem>(`/api/orders/track`, { params: { code } });
    return data;
  } catch (error) {
    // Mock fallback
    console.log("Using mock data for trackByCode");
    return generateMockTracking(code);
  }
}

// Gửi OTP (mock)
export async function sendOtp(phone: string): Promise<{ ok: boolean }> {
  try {
    await api.post(`/api/orders/track/send-otp`, { phone });
    return { ok: true };
  } catch (error) {
    // Mock fallback
    console.log("Mock OTP sent to:", phone);
    return { ok: true };
  }
}

// Xác thực OTP và lấy danh sách đơn của SĐT
export async function trackByPhoneWithOtp(phone: string, otp: string): Promise<TrackingItem[]> {
  try {
    const { data } = await api.post<{ items: TrackingItem[] }>(`/api/orders/track/by-phone`, { phone, otp });
    return data.items;
  } catch (error) {
    // Mock fallback - giả lập có 2 đơn
    console.log("Using mock data for trackByPhoneWithOtp");
    return [
      generateMockTracking("SO-202501-0001"),
      generateMockTracking("SO-202501-0002")
    ];
  }
}

// Yêu cầu đổi lịch giao (mock)
export async function requestReschedule(orderId: string, payload: { date: string; note?: string }): Promise<{ success: boolean; message: string }> {
  try {
    const { data } = await api.post<{ success: boolean; message: string }>(`/api/orders/${orderId}/request-reschedule`, payload);
    return data;
  } catch (error) {
    // Mock fallback
    console.log("Mock reschedule request for order:", orderId, payload);
    return { 
      success: true, 
      message: "Yêu cầu đổi lịch đã được ghi nhận. Chúng tôi sẽ liên hệ với bạn trong vòng 24h." 
    };
  }
}
