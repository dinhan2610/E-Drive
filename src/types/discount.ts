export interface DiscountPolicy {
  id: number;
  minQuantity: number;
  maxQuantity: number;
  discountRate: number;
  isActive: boolean;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDiscountRequest {
  minQuantity: number;
  maxQuantity: number;
  discountRate: number;
  description: string;
  isActive: boolean;
}

export interface UpdateDiscountRequest {
  minQuantity: number;
  maxQuantity: number;
  discountRate: number;
  description: string;
  isActive: boolean;
}
