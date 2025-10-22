import { apiClient } from './apiClient';

export interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  dealerId: number | null;
  dealerName: string | null;
}

export interface UpdateProfilePayload {
  fullName: string;
  email: string;
  phone: string;
}

/**
 * Get user profile from API
 * Falls back to localStorage data if API returns 403 or fails
 */
export async function getProfile(): Promise<UserProfile> {
  try {
    const response = await apiClient.get('/profile');
    
    // If 403, try to use localStorage data instead
    if (response.status === 403) {
      console.warn('Profile API returned 403, using localStorage fallback');
      return getMockProfileFromLocalStorage();
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.warn('Profile API failed, using localStorage fallback:', error);
    return getMockProfileFromLocalStorage();
  }
}

/**
 * Get mock profile from localStorage
 */
function getMockProfileFromLocalStorage(): UserProfile {
  const userData = localStorage.getItem('e-drive-user');
  
  if (!userData) {
    throw new Error('No user data available');
  }
  
  const parsedUser = JSON.parse(userData);
  
  return {
    id: parsedUser.id || 1,
    username: parsedUser.username || 'user',
    fullName: parsedUser.fullName || parsedUser.name || 'E-Drive User',
    email: parsedUser.email || 'user@edrive.com',
    phone: parsedUser.phone || '0901234567',
    role: parsedUser.role || 'dealer',
    dealerId: parsedUser.dealerId || null,
    dealerName: parsedUser.dealerName || null,
  };
}

/**
 * Update user profile via API
 */
export async function updateProfile(data: UpdateProfilePayload): Promise<UserProfile> {
  const response = await apiClient.put('/profile', data);
  
  if (!response.ok) {
    throw new Error(`Failed to update profile: ${response.status}`);
  }
  
  return response.json();
}
