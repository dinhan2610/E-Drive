import api from '../lib/apiClient';

export interface Dealer {
  dealerId: number;
  dealerName: string;
  houseNumberAndStreet: string;
  wardOrCommune: string;
  district: string;
  provinceOrCity: string;
  contactPerson: string;
  phone: string;
  fullAddress: string;
}

export interface UnverifiedAccount {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  dealerName: string;
  dealerAddress: string;
  registrationDate: string | null;
  verified: boolean;
}

export interface DealerApiResponse {
  statusCode: number;
  message: string;
  data: Dealer[];
}

export interface UnverifiedAccountsApiResponse {
  statusCode: number;
  message: string;
  data: UnverifiedAccount[];
}

// Fetch all dealers
export async function fetchDealers(): Promise<Dealer[]> {
  console.log('🏢 Fetching dealers from API');

  try {
    const response = await api.get<DealerApiResponse>('/api/dealers');
    console.log('✅ Dealers Response:', response.data);

    if (response.data.statusCode === 200 && response.data.data) {
      return response.data.data;
    }

    throw new Error('Unexpected API response format');
  } catch (error) {
    console.error('❌ Fetch Dealers Error:', error);
    throw error;
  }
}

// Fetch unverified accounts (accounts waiting to become dealers)
export async function fetchUnverifiedAccounts(): Promise<UnverifiedAccount[]> {
  console.log('👥 Fetching unverified accounts from API');

  try {
    const response = await api.get<UnverifiedAccountsApiResponse>('/api/admin/unverified-accounts');
    console.log('✅ Unverified Accounts Response:', response.data);

    if (response.data.statusCode === 200) {
      return response.data.data || [];
    }

    throw new Error('Unexpected API response format');
  } catch (error) {
    console.error('❌ Fetch Unverified Accounts Error:', error);
    throw error;
  }
}

// Verify account (approve dealer registration)
export async function verifyAccount(userId: number): Promise<{ success: boolean; message: string; alreadyVerified?: boolean }> {
  console.log('✅ Verifying account:', userId);

  try {
    const response = await api.post<any>(`/api/admin/verify-account/${userId}`);
    const data = response.data;
    console.log('📦 Verify Account Response:', data);

    if (data.statusCode === 200) {
      return {
        success: true,
        message: data.message || 'Account verified successfully'
      };
    }

    throw new Error(data.message || 'Failed to verify account');
  } catch (error: any) {
    console.error('❌ Verify Account Error:', error);
    
    // Handle "already verified" case (status 400)
    if (error.response?.status === 400 && error.response?.data?.message?.toLowerCase().includes('already verified')) {
      return {
        success: true,
        message: 'Tài khoản đã được xác minh trước đó',
        alreadyVerified: true
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'An error occurred while verifying account'
    };
  }
}

// Get dealer by ID
export async function getDealerById(dealerId: number): Promise<Dealer> {
  console.log('🔍 Getting dealer by ID:', dealerId);

  try {
    const response = await api.get<any>(`/api/dealers/${dealerId}`);
    console.log('✅ Dealer Detail Response:', response.data);

    if (response.data.statusCode === 200 && response.data.data) {
      return response.data.data;
    }

    throw new Error('Dealer not found');
  } catch (error) {
    console.error('❌ Get Dealer by ID Error:', error);
    throw error;
  }
}

// Create new dealer
export async function createDealer(dealerData: Omit<Dealer, 'dealerId'>): Promise<Dealer> {
  console.log('🏢 Creating dealer');
  console.log('📤 Request body:', JSON.stringify(dealerData, null, 2));

  try {
    const response = await api.post<any>('/api/dealers', dealerData);
    console.log('✅ Dealer Created Response:', response.data);

    if ((response.data.statusCode === 200 || response.data.statusCode === 201) && response.data.data) {
      return response.data.data;
    }

    throw new Error('API did not return created dealer data in expected format');
  } catch (error: any) {
    console.error('❌ Create Dealer Error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred while creating dealer';
    throw new Error(errorMessage);
  }
}

// Update dealer
export async function updateDealer(dealerId: number, dealerData: Omit<Dealer, 'dealerId'>): Promise<Dealer> {
  console.log('✏️ Updating dealer:', dealerId);
  console.log('📤 Request body:', JSON.stringify(dealerData, null, 2));

  try {
    const response = await api.put<any>(`/api/dealers/${dealerId}`, dealerData);
    console.log('✅ Dealer Updated Response:', response.data);

    if ((response.data.statusCode === 200 || response.data.statusCode === 201) && response.data.data) {
      return response.data.data;
    }

    throw new Error('API did not return updated dealer data in expected format');
  } catch (error: any) {
    console.error('❌ Update Dealer Error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred while updating dealer';
    throw new Error(errorMessage);
  }
}

// Delete dealer
export async function deleteDealer(dealerId: number): Promise<{ success: boolean; message: string }> {
  console.log('🗑️ Deleting dealer:', dealerId);

  try {
    await api.delete(`/api/dealers/${dealerId}`);
    
    console.log('✅ Dealer deleted successfully');
    return {
      success: true,
      message: 'Xóa đại lý thành công'
    };
  } catch (error: any) {
    console.error('❌ Delete Dealer Error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Đã xảy ra lỗi khi xóa đại lý'
    };
  }
}

