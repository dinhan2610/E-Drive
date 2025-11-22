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
  // Backend compatibility fields
  dealerEmail?: string;
  contactPhone?: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  email: string;
  dealerEmail?: string; // Backend compatibility
  phone: string;
  contactPhone?: string; // Backend compatibility
  agencyName: string;
  contactPerson: string;
  agencyPhone: string;
  streetAddress: string;
  ward: string;
  district: string;
  city: string;
  fullAddress: string;
}

// Normalize backend response to frontend format
function normalizeProfileData(data: any): UserProfile {
  return {
    ...data,
    email: data.dealerEmail || data.email,
    phoneNumber: data.contactPhone || data.phoneNumber || data.agencyPhone,
    dealerEmail: data.dealerEmail || data.email,
    contactPhone: data.contactPhone || data.phoneNumber
  };
}

/**
 * Get user profile from API - GET /api/profile/me
 */
export async function getProfile(): Promise<UserProfile> {
  try {
    console.log('🔍 Fetching profile from API...');
    const response = await api.get<any>('/api/profile/me');
    console.log('📦 Raw Profile API Response:', response.data);
    
    // Extract data from wrapper if exists
    const profileData = response.data.data || response.data;
    console.log('📦 Profile data to normalize:', profileData);
    
    const normalized = normalizeProfileData(profileData);
    console.log('✅ Normalized Profile Data:', normalized);
    
    return normalized;
  } catch (error: any) {
    console.error('Failed to get profile:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get dealer details by ID (for real-time updated data)
 */
export async function getDealerProfile(dealerId: number): Promise<UserProfile> {
  try {
    console.log('🔍 Fetching dealer profile from /api/dealers/' + dealerId);
    const response = await api.get<any>(`/api/dealers/${dealerId}`);
    console.log('📦 Raw Dealer API Response:', response.data);
    
    // Map dealer response to UserProfile format
    const dealerData = response.data.data || response.data;
    console.log('📦 Dealer data to map:', dealerData);
    
    // Check if dealerData is valid
    if (!dealerData || typeof dealerData !== 'object') {
      console.error('❌ Invalid dealer data received:', dealerData);
      throw new Error('Invalid dealer data format');
    }
    
    const normalized: UserProfile = {
      profileId: dealerData.dealerId || dealerData.id || 0,
      fullName: dealerData.contactPerson || dealerData.fullName || dealerData.name || '',
      username: dealerData.username || '',
      email: dealerData.dealerEmail || dealerData.email || '',
      phoneNumber: dealerData.contactPhone || dealerData.phone || dealerData.phoneNumber || '',
      agencyName: dealerData.dealerName || dealerData.agencyName || '',
      contactPerson: dealerData.contactPerson || '',
      agencyPhone: dealerData.contactPhone || dealerData.phone || dealerData.agencyPhone || '',
      streetAddress: dealerData.houseNumberAndStreet || dealerData.streetAddress || '',
      ward: dealerData.wardOrCommune || dealerData.ward || '',
      district: dealerData.district || '',
      city: dealerData.provinceOrCity || dealerData.city || '',
      fullAddress: dealerData.fullAddress || 
                   `${dealerData.houseNumberAndStreet || ''}, ${dealerData.wardOrCommune || ''}, ${dealerData.district || ''}, ${dealerData.provinceOrCity || ''}`.replace(/(^, |, $)/g, ''),
      dealerId: dealerData.dealerId || dealerData.id || 0,
      dealerEmail: dealerData.dealerEmail || dealerData.email || '',
      contactPhone: dealerData.contactPhone || dealerData.phone || dealerData.phoneNumber || ''
    };
    
    console.log('✅ Normalized Dealer Profile:', normalized);
    return normalized;
  } catch (error: any) {
    // Only log error if it's not a 403 (permission denied is expected for some users)
    if (error.response?.status !== 403) {
      console.error('Failed to get dealer profile:', error.response?.data || error.message);
    }
    throw error;
  }
}

/**
 * Update user profile via API - Uses dealer endpoint for consistency
 */
export async function updateProfile(data: UpdateProfilePayload): Promise<UserProfile> {
  try {
    console.log('📝 Updating profile...');
    
    // First get current profile to get dealerId
    const currentProfile = await getProfile();
    
    if (currentProfile.dealerId) {
      // Update via dealer API for consistency with admin updates
      console.log('🔄 Updating via dealer API (dealerId:', currentProfile.dealerId, ')');
      
      const dealerUpdateData = {
        dealerName: data.agencyName,
        email: data.email,
        dealerEmail: data.email,
        houseNumberAndStreet: data.streetAddress,
        wardOrCommune: data.ward,
        district: data.district,
        provinceOrCity: data.city,
        contactPerson: data.fullName,
        phone: data.phone,
        contactPhone: data.phone
      };
      
      await api.put<any>(`/api/dealers/${currentProfile.dealerId}`, dealerUpdateData);
      console.log('✅ Dealer updated successfully');
      
      // Return updated dealer profile
      return getDealerProfile(currentProfile.dealerId);
    } else {
      // Fallback to profile API if no dealerId
      console.log('⚠️ No dealerId found, using profile API');
      const requestData = {
        ...data,
        email: data.email,
        dealerEmail: data.email,
        phone: data.phone,
        contactPhone: data.phone
      };
      
      const response = await api.put<any>('/api/profile/me', requestData);
      return normalizeProfileData(response.data);
    }
  } catch (error: any) {
    console.error('Failed to update profile:', error.response?.data || error.message);
    throw error;
  }
}