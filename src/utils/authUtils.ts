/**
 * Authentication Utilities
 * Handles session vs persistent storage, token expiry, and login state
 */

export interface AuthData {
  user: any;
  isLoggedIn: boolean;
  userRole: string;
  loginTimestamp?: number;
  loginExpiry?: number;
}

/**
 * Check if user session is valid
 * Returns null if expired or invalid
 */
export const getValidAuthData = (): AuthData | null => {
  // Check both sessionStorage (priority) and localStorage
  let userData = sessionStorage.getItem('e-drive-user');
  let isLoggedIn = sessionStorage.getItem('isLoggedIn');
  let userRole = sessionStorage.getItem('userRole');
  let loginTimestamp = sessionStorage.getItem('loginTimestamp');
  let loginExpiry = sessionStorage.getItem('loginExpiry');
  let storage: 'session' | 'local' = 'session';

  // If not in session, check localStorage (Remember Me)
  if (!userData || isLoggedIn !== 'true') {
    userData = localStorage.getItem('e-drive-user');
    isLoggedIn = localStorage.getItem('isLoggedIn');
    userRole = localStorage.getItem('userRole');
    loginTimestamp = localStorage.getItem('loginTimestamp');
    loginExpiry = localStorage.getItem('loginExpiry');
    storage = 'local';
  }

  // No valid login found
  if (!userData || isLoggedIn !== 'true') {
    return null;
  }

  // Check if persistent login has expired (7 days)
  if (storage === 'local' && loginExpiry) {
    const now = new Date().getTime();
    const expiry = parseInt(loginExpiry, 10);
    
    if (now > expiry) {
      console.log('🔴 Login expired, clearing data...');
      clearAuthData();
      return null;
    }
  }

  // Parse user data
  try {
    const user = JSON.parse(userData);
    return {
      user,
      isLoggedIn: true,
      userRole: userRole || 'dealer',
      loginTimestamp: loginTimestamp ? parseInt(loginTimestamp, 10) : undefined,
      loginExpiry: loginExpiry ? parseInt(loginExpiry, 10) : undefined
    };
  } catch (error) {
    console.error('Error parsing user data:', error);
    clearAuthData();
    return null;
  }
};

/**
 * Clear all authentication data from both storages
 */
export const clearAuthData = (): void => {
  // Clear sessionStorage
  sessionStorage.removeItem('e-drive-user');
  sessionStorage.removeItem('isLoggedIn');
  sessionStorage.removeItem('userRole');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('loginTimestamp');
  sessionStorage.removeItem('loginExpiry');

  // Clear localStorage
  localStorage.removeItem('e-drive-user');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userRole');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('loginTimestamp');
  localStorage.removeItem('loginExpiry');
};

/**
 * Check if user is logged in (without returning data)
 */
export const isUserLoggedIn = (): boolean => {
  return getValidAuthData() !== null;
};

/**
 * Get current user data if logged in
 */
export const getCurrentUser = (): any | null => {
  const authData = getValidAuthData();
  return authData ? authData.user : null;
};

/**
 * Get current user role
 */
export const getCurrentUserRole = (): string | null => {
  const authData = getValidAuthData();
  return authData ? authData.userRole : null;
};

/**
 * Get login expiry info for display
 */
export const getLoginExpiryInfo = (): { isPersistent: boolean; daysRemaining?: number } | null => {
  const authData = getValidAuthData();
  
  if (!authData) {
    return null;
  }

  if (!authData.loginExpiry) {
    return { isPersistent: false }; // Session login
  }

  const now = new Date().getTime();
  const expiry = authData.loginExpiry;
  const msRemaining = expiry - now;
  const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

  return {
    isPersistent: true,
    daysRemaining: Math.max(0, daysRemaining)
  };
};

/**
 * Format login duration for display
 */
export const getLoginDuration = (): string | null => {
  const authData = getValidAuthData();
  
  if (!authData || !authData.loginTimestamp) {
    return null;
  }

  const now = new Date().getTime();
  const duration = now - authData.loginTimestamp;
  
  const minutes = Math.floor(duration / (60 * 1000));
  const hours = Math.floor(duration / (60 * 60 * 1000));
  const days = Math.floor(duration / (24 * 60 * 60 * 1000));

  if (days > 0) {
    return `${days} ngày trước`;
  } else if (hours > 0) {
    return `${hours} giờ trước`;
  } else if (minutes > 0) {
    return `${minutes} phút trước`;
  } else {
    return 'Vừa xong';
  }
};
