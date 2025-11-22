/**
 * Financing calculation utilities for 0% interest loans
 */

export interface FinancingParams {
  price: number;
  downPayment?: number;
  downIsPercent: boolean;
  downPercent?: number;
  fees?: number;
  months: number;
}

export interface PaymentScheduleItem {
  period: number;
  monthly: number;
  remaining: number;
}

export interface FinancingResult {
  dp: number;
  loanAmount: number;
  monthly: number;
  schedule: PaymentScheduleItem[];
  totalPayable: number;
}

/**
 * Calculate 0% interest financing
 * @param params - Financing parameters
 * @returns Calculation result with payment schedule
 */
export function calc0Percent({
  price,
  downPayment,
  downIsPercent,
  downPercent,
  fees = 0,
  months,
}: FinancingParams): FinancingResult {
  // Calculate down payment
  const dp = downIsPercent
    ? Math.max(0, Math.min(100, downPercent || 0)) * price / 100
    : (downPayment || 0);

  // Calculate loan amount
  const loanAmount = Math.max(0, price + (fees || 0) - dp);

  // Calculate monthly payment (rounded up to avoid fractional cents)
  const monthlyRaw = loanAmount / months;
  const monthly = Math.ceil(monthlyRaw);

  // Generate payment schedule
  const schedule: PaymentScheduleItem[] = Array.from({ length: months }, (_, i) => {
    const period = i + 1;
    const remaining = Math.max(0, loanAmount - monthly * period);
    return { period, monthly, remaining };
  });

  // Calculate total payable (down payment + all monthly payments)
  const totalPayable = dp + monthly * months;

  return {
    dp,
    loanAmount,
    monthly,
    schedule,
    totalPayable,
  };
}

/**
 * Available financing terms (in months)
 */
export const FINANCING_TERMS = [6, 12, 18, 24, 36] as const;

export type FinancingTerm = typeof FINANCING_TERMS[number];

/**
 * Validate down payment percentage
 * @param percent - Down payment percentage
 * @returns Validated percentage (clamped to 0-80)
 */
export function validateDownPercent(percent: number): number {
  return Math.max(0, Math.min(80, percent));
}

/**
 * Validate down payment amount
 * @param amount - Down payment amount
 * @param maxPrice - Maximum price (car price)
 * @returns Validated amount (clamped to 0-maxPrice)
 */
export function validateDownPayment(amount: number, maxPrice: number): number {
  return Math.max(0, Math.min(maxPrice, amount));
}
