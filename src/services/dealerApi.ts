import api from '../lib/apiClient';

export interface Dealer {
  userId?: number | null;
  dealerId: number;
  dealerName: string;
  dealerEmail?: string; // Backend field name
  houseNumberAndStreet: string;
  wardOrCommune: string;
  district: string;
  provinceOrCity: string;
  contactPerson: string;
  contactPhone?: string; // Backend field name - made optional for frontend usage
  fullAddress?: string; // Optional
  roles?: any;
  // Frontend aliases (optional for flexibility)
  email?: string;
  phone?: string;
}

export interface UnverifiedAccount {
  userId: number;
  dealerId?: number; // Backend may return dealerId
  username: string;
  fullName: string;
  email: string;
  phone: string;
  dealerName: string;
  dealerAddress: string;
  businessLicenseUrl?: string;
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

  try {
    const response = await api.get<DealerApiResponse>('/api/dealers');

    if (response.data.statusCode === 200 && response.data.data) {
      // Normalize each dealer's data to match frontend field names
      return response.data.data.map(dealer => normalizeDealerData(dealer));
    }

    throw new Error('Unexpected API response format');
  } catch (error) {
    console.error('❌ Fetch Dealers Error:', error);
    throw error;
  }
}

// Fetch unverified accounts (accounts waiting to become dealers)
export async function fetchUnverifiedAccounts(): Promise<UnverifiedAccount[]> {

  try {
    const response = await api.get<UnverifiedAccountsApiResponse>('/api/admin/unverified-accounts');

    if (response.data.statusCode === 200) {
      return response.data.data || [];
    }

    throw new Error('Unexpected API response format');
  } catch (error) {
    console.error('❌ Fetch Unverified Accounts Error:', error);
    throw error;
  }
}

// Fetch ALL accounts (both verified and unverified) for business license lookup
export async function fetchAllAccounts(): Promise<UnverifiedAccount[]> {

  try {
    const response = await api.get<UnverifiedAccountsApiResponse>('/api/admin/all-accounts');

    if (response.data.statusCode === 200) {
      return response.data.data || [];
    }

    throw new Error('Unexpected API response format');
  } catch (error) {
    console.error('❌ Fetch All Accounts Error:', error);
    // Fallback to unverified accounts if endpoint doesn't exist
    console.warn('⚠️ /all-accounts endpoint not available, falling back to unverified only');
    return [];
  }
}

// Verify account (approve dealer registration) - UPDATED to use dealerId
export async function verifyAccount(userId: number, dealerId?: number): Promise<{ success: boolean; message: string; alreadyVerified?: boolean }> {
  // Prefer dealerId if available (new backend), fallback to userId for compatibility
  const idToUse = dealerId || userId;
  const idType = dealerId ? 'dealerId' : 'userId';

  try {
    // Backend now uses dealerId in the endpoint
    const response = await api.post<any>(`/api/admin/verify-account/${idToUse}`, {});
    const data = response.data;

    if (data.statusCode === 200) {
      return {
        success: true,
        message: data.message || 'Account verified successfully'
      };
    }

    throw new Error(data.message || 'Failed to verify account');
  } catch (error: any) {
    console.error('❌ Verify Account Error:', error);
    console.error('❌ Error Response Data:', error.response?.data);
    console.error('❌ Error Response Status:', error.response?.status);
    
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

// Helper function to normalize dealer data from API
function normalizeDealerData(dealerData: any): Dealer {
  const phone = dealerData.contactPhone || dealerData.phone || '';
  const email = dealerData.dealerEmail || dealerData.email || '';
  
  // Build full address from parts if not provided
  let fullAddress = dealerData.fullAddress || '';
  if (!fullAddress && dealerData.houseNumberAndStreet) {
    const parts = [
      dealerData.houseNumberAndStreet,
      dealerData.wardOrCommune,
      dealerData.district,
      dealerData.provinceOrCity
    ].filter(Boolean);
    fullAddress = parts.join(', ');
  }
  
  return {
    ...dealerData,
    // Ensure both backend and frontend field names exist
    contactPhone: phone,
    phone: phone,
    dealerEmail: email,
    email: email,
    fullAddress: fullAddress
  };
}

// Get dealer by ID
export async function getDealerById(dealerId: number): Promise<Dealer> {

  try {
    const response = await api.get<any>(`/api/dealers/${dealerId}`);

    if (response.data.statusCode === 200 && response.data.data) {
      return normalizeDealerData(response.data.data);
    }

    throw new Error('Dealer not found');
  } catch (error) {
    console.error('❌ Get Dealer by ID Error:', error);
    throw error;
  }
}

// Create new dealer
export async function createDealer(dealerData: Omit<Dealer, 'dealerId'>): Promise<Dealer> {
  
  // Backend expects both naming conventions
  const emailValue = dealerData.email || dealerData.dealerEmail || '';
  const phoneValue = dealerData.phone || dealerData.contactPhone || '';
  
  const backendData = {
    dealerName: dealerData.dealerName,
    email: emailValue,
    dealerEmail: emailValue,
    houseNumberAndStreet: dealerData.houseNumberAndStreet,
    wardOrCommune: dealerData.wardOrCommune,
    district: dealerData.district,
    provinceOrCity: dealerData.provinceOrCity,
    contactPerson: dealerData.contactPerson,
    phone: phoneValue,
    contactPhone: phoneValue
  };
  

  try {
    const response = await api.post<any>('/api/dealers', backendData);

    if ((response.data.statusCode === 200 || response.data.statusCode === 201) && response.data.data) {
      return normalizeDealerData(response.data.data);
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
  
  // Backend expects both naming conventions
  const emailValue = dealerData.email || dealerData.dealerEmail || '';
  const phoneValue = dealerData.phone || dealerData.contactPhone || '';
  
  const backendData = {
    dealerName: dealerData.dealerName,
    email: emailValue,
    dealerEmail: emailValue,
    houseNumberAndStreet: dealerData.houseNumberAndStreet,
    wardOrCommune: dealerData.wardOrCommune,
    district: dealerData.district,
    provinceOrCity: dealerData.provinceOrCity,
    contactPerson: dealerData.contactPerson,
    phone: phoneValue,
    contactPhone: phoneValue
  };
  

  try {
    const response = await api.put<any>(`/api/dealers/${dealerId}`, backendData);

    if ((response.data.statusCode === 200 || response.data.statusCode === 201) && response.data.data) {
      return normalizeDealerData(response.data.data);
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

  try {
    await api.delete(`/api/dealers/${dealerId}`);
    
    return {
      success: true,
      message: 'Xóa đại lý thành công'
    };
  } catch (error: any) {
    console.error('❌ Delete Dealer Error:', error);
    
    // Check for foreign key constraint violation
    const errorMessage = error.response?.data?.message || error.message || '';
    
    if (errorMessage.includes('foreign key constraint') || 
        errorMessage.includes('violates foreign key') ||
        errorMessage.includes('still referenced')) {
      
      // Extract table name from error message
      let detailMessage = 'Không thể xóa đại lý này vì còn dữ liệu liên quan.';
      
      if (errorMessage.includes('users')) {
        detailMessage = '❌ Không thể xóa đại lý này vì còn tài khoản người dùng (users) liên kết.\n\n' +
                       '📋 Hướng dẫn:\n' +
                       '1. Xóa hoặc chuyển tất cả users của đại lý này sang đại lý khác\n' +
                       '2. Sau đó mới có thể xóa đại lý';
      } else if (errorMessage.includes('customers')) {
        detailMessage = '❌ Không thể xóa đại lý này vì còn khách hàng (customers) liên kết.\n\n' +
                       '📋 Hướng dẫn: Xóa hoặc chuyển tất cả khách hàng sang đại lý khác trước';
      } else if (errorMessage.includes('feedback')) {
        detailMessage = '❌ Không thể xóa đại lý này vì còn phản hồi (feedback) liên kết.\n\n' +
                       '📋 Hướng dẫn: Xóa tất cả phản hồi của đại lý này trước';
      } else if (errorMessage.includes('test_drives')) {
        detailMessage = '❌ Không thể xóa đại lý này vì còn lịch lái thử (test drives) liên kết.\n\n' +
                       '📋 Hướng dẫn: Xóa tất cả lịch lái thử của đại lý này trước';
      }
      
      return {
        success: false,
        message: detailMessage
      };
    }
    
    return {
      success: false,
      message: errorMessage || 'Đã xảy ra lỗi khi xóa đại lý'
    };
  }
}

// Get business license image for a dealer by userId (legacy)
export async function getBusinessLicense(userId: number): Promise<Blob> {

  try {
    const response = await api.get(`/api/admin/business-license/${userId}`, {
      responseType: 'blob'
    });
    
    return response.data as Blob;
  } catch (error) {
    console.error('❌ Fetch Business License Error:', error);
    throw error;
  }
}

// Get business license image for a dealer by dealerId (NEW - OPTIMIZED)
export async function getBusinessLicenseByDealerId(dealerId: number): Promise<Blob> {

  try {
    const response = await api.get(`/api/admin/business-license/${dealerId}`, {
      responseType: 'blob'
    });
    
    return response.data as Blob;
  } catch (error) {
    console.error('❌ Fetch Business License Error:', error);
    throw error;
  }
}

