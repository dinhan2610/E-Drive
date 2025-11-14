/**
 * Role-based utilities for E-Drive application
 * 
 * 3 ROLES ONLY:
 * - admin: Separate admin interface at /admin (AdminPage)
 * - dealer: Can create orders, full management access
 * - staff: Can only create quotes, no order creation
 */

export type UserRole = 'admin' | 'dealer' | 'staff';

/**
 * Get current user role from localStorage
 */
export const getCurrentUserRole = (): UserRole => {
  try {
    const userData = localStorage.getItem('e-drive-user');
    if (!userData) return 'dealer'; // Default fallback
    
    const user = JSON.parse(userData);
    let role = user.role || 'dealer';
    
    // Normalize role (remove ROLE_ and role_ prefix if exists)
    role = role.toLowerCase().replace('role_', '').replace('dealer_', '');
    
    // Map backend roles to frontend roles
    // dealer_manager → dealer
    // dealer_staff → staff
    // dealer_admin → admin
    // manager → dealer (legacy support)
    if (role === 'manager') {
      role = 'dealer';
    }
    
    return role as UserRole;
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
 * Only Dealer can create orders (Admin has separate interface, Staff cannot)
 */
export const canCreateOrder = (): boolean => {
  return getCurrentUserRole() === 'dealer';
};

/**
 * Check if user can manage promotions
 * Only Dealer can manage promotions (Admin has separate interface, Staff cannot)
 */
export const canManagePromotions = (): boolean => {
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
    canCreateOrder: canCreateOrder(),
    canManagePromotions: canManagePromotions(),
    shouldShowQuoteButton: shouldShowQuoteButton(),
    canViewCustomers: true, // All roles can view customers
    canManageTestDrive: true, // All roles can manage test drives
    canViewQuotes: true, // All roles can view quotes
    canCreateQuote: true, // All roles can create quotes
    canManageFeedback: true, // All roles can manage feedback
    canViewInstallment: true, // All roles can view installment
    role
  };
};
