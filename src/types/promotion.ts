// src/types/promotion.ts
export type PromoType = "PERCENTAGE" | "AMOUNT";
export type ApplicableTo = "CUSTOMER" | "DEALER";

// Computed status based on dates
export type PromoStatus = "ACTIVE" | "INACTIVE" | "SCHEDULED" | "EXPIRED";

export interface Promotion {
  promoId: number;
  title: string;
  description: string;
  discountType: PromoType;
  discountValue: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  applicableTo: ApplicableTo;
  dealerId: number;
  vehicleIds: number[];
}

export type ListParams = {
  search?: string;
  page?: number;
  limit?: number;
};
