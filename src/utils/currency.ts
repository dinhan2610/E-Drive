/**
 * Format number to Vietnamese currency (VND)
 * @param n - Number to format
 * @returns Formatted currency string
 */
export const toVND = (n: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(n || 0)));
};

/**
 * Format number with thousand separators (no currency symbol)
 * @param n - Number to format
 * @returns Formatted number string
 */
export const formatNumber = (n: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(n || 0)));
};

/**
 * Parse formatted VND string back to number
 * @param str - Formatted currency string
 * @returns Parsed number
 */
export const parseVND = (str: string): number => {
  const cleaned = str.replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
};
