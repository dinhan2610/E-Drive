/**
 * Role-based utilities for E-Drive application
 * 
 * Backend Roles (PredefinedRole.java):
 * - ADMIN: System administrator
 * - DEALER_MANAGER: Dealer manager - full dealer access
 * - DEALER_STAFF: Dealer staff - limited access
 * - EVM_STAFF: EVM staff - admin-like access
 * 
 * Frontend Normalized Roles:
 * - admin: ADMIN role
 * - dealer: DEALER_MANAGER role
 * - staff: DEALER_STAFF role
 * - evm_staff: EVM_STAFF role
 */

import { getCurrentUser } from './authUtils';

export type UserRole = 'admin' | 'dealer' | 'staff' | 'evm_staff';

/**
 * Get current user role from localStorage
 * Maps backend roles to frontend normalized roles
 */
export const getCurrentUserRole = (): UserRole => {
  try {
    const user = getCurrentUser();
    if (!user) return 'dealer'; // Default fallback
    
    let role = user.role || 'dealer';
    
    // Normalize role (remove ROLE_ prefix if exists)
    role = role.toLowerCase().replace('role_', '');
    
    // Map backend roles to frontend roles (exact match with PredefinedRole.java)
    // ADMIN → admin
    // DEALER_MANAGER → dealer
    // DEALER_STAFF → staff
    // EVM_STAFF → evm_staff
    if (role === 'admin') {
      return 'admin';
    } else if (role === 'dealer_manager') {
      return 'dealer';
    } else if (role === 'dealer_staff') {
      return 'staff';
    } else if (role === 'evm_staff') {
      return 'evm_staff';
    }
    
    // Fallback for legacy roles
    return 'dealer';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'dealer';
  }
};

/**
 * Check if current user is staff
 */
export const isStaff = (): boolean => {
  return getCurrentUserRole() === 'staff';
};

/**
 * Check if current user is dealer
 */
export const isDealer = (): boolean => {
  return getCurrentUserRole() === 'dealer';
};

/**
 * Check if current user is admin
 */
export const isAdmin = (): boolean => {
  return getCurrentUserRole() === 'admin';
};

/**
 * Check if user can create orders
 * Only DEALER_MANAGER can create orders
 * DEALER_STAFF, ADMIN, EVM_STAFF cannot
 */
export const canCreateOrder = (): boolean => {
  return getCurrentUserRole() === 'dealer';
};

/**
 * Check if user can manage promotions
 * Only DEALER_MANAGER can manage promotions
 * DEALER_STAFF, ADMIN, EVM_STAFF cannot
 */
export const canManagePromotions = (): boolean => {
  return getCurrentUserRole() === 'dealer';
};

/**
 * Check if user can edit quote status
 * Only DEALER_MANAGER can edit status
 * DEALER_STAFF can only view
 */
export const canEditQuoteStatus = (): boolean => {
  return getCurrentUserRole() === 'dealer';
};

/**
 * Check if user should see quote button instead of order button
 * Staff → Quote button (Báo giá) - navigate to /quotes/create
 * Dealer → Order button (Đặt hàng) - navigate to /dealer-order
 * Admin → Has separate interface, doesn't use this
 */
export const shouldShowQuoteButton = (): boolean => {
  return getCurrentUserRole() === 'staff';
};

/**
 * Get user capabilities based on role
 */
export const getUserCapabilities = () => {
  const role = getCurrentUserRole();
  
  return {
    canCreateOrder: canCreateOrder(), // DEALER_MANAGER only
    canManagePromotions: canManagePromotions(), // DEALER_MANAGER only
    canEditQuoteStatus: canEditQuoteStatus(), // DEALER_MANAGER only
    shouldShowQuoteButton: shouldShowQuoteButton(), // DEALER_STAFF sees quote button
    canViewCustomers: role !== 'admin' && role !== 'evm_staff', // Dealer roles only
    canManageTestDrive: role !== 'admin' && role !== 'evm_staff', // Dealer roles only
    canViewQuotes: role !== 'admin' && role !== 'evm_staff', // Dealer roles only
    canCreateQuote: role !== 'admin' && role !== 'evm_staff', // Dealer roles only
    canManageFeedback: role !== 'admin' && role !== 'evm_staff', // Dealer roles only
    canViewInstallment: role !== 'admin' && role !== 'evm_staff', // Dealer roles only
    hasAdminAccess: hasAdminAccess(), // ADMIN or EVM_STAFF
    role
  };
};

/**
 * Check if current user is EVM_STAFF
 * EVM_STAFF has admin-like access but is not ADMIN
 */
export const isEvmStaff = (): boolean => {
  return getCurrentUserRole() === 'evm_staff';
};

/**
 * Check if user has admin-level access
 * Both ADMIN and EVM_STAFF have admin-level access
 */
export const hasAdminAccess = (): boolean => {
  const role = getCurrentUserRole();
  return role === 'admin' || role === 'evm_staff';
};
