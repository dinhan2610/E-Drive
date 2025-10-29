import api from '../lib/apiClient';

export interface UserProfile {
  profileId: number;
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  agencyName: string;
  contactPerson: string;
  agencyPhone: string;
  streetAddress: string;
  ward: string;
  district: string;
  city: string;
  fullAddress: string;
  dealerId: number;
}

export interface UpdateProfilePayload {
  fullName: string;
  email: string;
  phone: string;
  agencyName: string;
  contactPerson: string;
  agencyPhone: string;
  streetAddress: string;
  ward: string;
  district: string;
  city: string;
  fullAddress: string;
}

/**
 * Get user profile from API - GET /api/profile/me
 */
export async function getProfile(): Promise<UserProfile> {
  try {
    const response = await api.get<UserProfile>('/api/profile/me');
    return response.data;
  } catch (error: any) {
    console.error('Failed to get profile:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Update user profile via API - PUT /api/profile/me
 */
export async function updateProfile(data: UpdateProfilePayload): Promise<UserProfile> {
  try {
    const response = await api.put<UserProfile>('/api/profile/me', data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to update profile:', error.response?.data || error.message);
    throw error;
  }
}