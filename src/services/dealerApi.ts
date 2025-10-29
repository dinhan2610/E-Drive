const API_BASE_URL = 'http://localhost:8080/api';

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
  const url = `${API_BASE_URL}/dealers`;
  console.log('🏢 Fetching dealers from:', url);

  try {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: DealerApiResponse = await response.json();
    console.log('✅ Dealers Response:', data);

    if (data.statusCode === 200 && data.data) {
      return data.data;
    }

    throw new Error('Unexpected API response format');
  } catch (error) {
    console.error('❌ Fetch Dealers Error:', error);
    throw error;
  }
}

// Fetch unverified accounts (accounts waiting to become dealers)
export async function fetchUnverifiedAccounts(): Promise<UnverifiedAccount[]> {
  const url = `${API_BASE_URL}/admin/unverified-accounts`;
  console.log('👥 Fetching unverified accounts from:', url);

  try {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: UnverifiedAccountsApiResponse = await response.json();
    console.log('✅ Unverified Accounts Response:', data);

    if (data.statusCode === 200) {
      return data.data || [];
    }

    throw new Error('Unexpected API response format');
  } catch (error) {
    console.error('❌ Fetch Unverified Accounts Error:', error);
    throw error;
  }
}

// Verify account (approve dealer registration)
export async function verifyAccount(userId: number): Promise<{ success: boolean; message: string; alreadyVerified?: boolean }> {
  const url = `${API_BASE_URL}/admin/verify-account/${userId}`;
  console.log('✅ Verifying account:', url);

  try {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Authorization': `Bearer ${token}`
      },
    });

    const data = await response.json();
    console.log('📦 Verify Account Response:', data);

    // Handle "already verified" case (status 400)
    if (response.status === 400 && data.message?.toLowerCase().includes('already verified')) {
      return {
        success: true,
        message: 'Tài khoản đã được xác minh trước đó',
        alreadyVerified: true
      };
    }

    if (!response.ok) {
      throw new Error(data.message || `API request failed: ${response.status} ${response.statusText}`);
    }

    if (data.statusCode === 200) {
      return {
        success: true,
        message: data.message || 'Account verified successfully'
      };
    }

    throw new Error(data.message || 'Failed to verify account');
  } catch (error) {
    console.error('❌ Verify Account Error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while verifying account'
    };
  }
}

// Get dealer by ID
export async function getDealerById(dealerId: number): Promise<Dealer> {
  const url = `${API_BASE_URL}/dealers/${dealerId}`;
  console.log('🔍 Getting dealer by ID:', url);

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Dealer Detail Response:', data);

    if (data.statusCode === 200 && data.data) {
      return data.data;
    }

    throw new Error('Dealer not found');
  } catch (error) {
    console.error('❌ Get Dealer by ID Error:', error);
    throw error;
  }
}

// Create new dealer
export async function createDealer(dealerData: Omit<Dealer, 'dealerId'>): Promise<Dealer> {
  const url = `${API_BASE_URL}/dealers`;
  console.log('🏢 Creating dealer at:', url);
  console.log('📤 Request body:', JSON.stringify(dealerData, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dealerData),
    });

    const responseText = await response.text();
    console.log('📥 Raw API Response:', responseText);

    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ API Error Response:', errorData);
        
        if (errorData.message) {
          throw new Error(`API Error (${response.status}): ${errorData.message}`);
        } else if (errorData.error) {
          throw new Error(`API Error (${response.status}): ${errorData.error}`);
        } else {
          throw new Error(`API Error (${response.status}): ${response.statusText}`);
        }
      } catch (parseError) {
        console.error('❌ Raw error response:', responseText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error('Invalid JSON response from server');
    }

    console.log('✅ Dealer Created Response:', data);

    if ((data.statusCode === 200 || data.statusCode === 201) && data.data) {
      return data.data;
    }

    throw new Error('API did not return created dealer data in expected format');
  } catch (error) {
    console.error('❌ Create Dealer Error:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error occurred while creating dealer');
    }
  }
}

// Update dealer
export async function updateDealer(dealerId: number, dealerData: Omit<Dealer, 'dealerId'>): Promise<Dealer> {
  const url = `${API_BASE_URL}/dealers/${dealerId}`;
  console.log('✏️ Updating dealer at:', url);
  console.log('📤 Request body:', JSON.stringify(dealerData, null, 2));

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dealerData),
    });

    const responseText = await response.text();
    console.log('📥 Raw API Response:', responseText);

    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ API Error Response:', errorData);
        
        if (errorData.message) {
          throw new Error(`API Error (${response.status}): ${errorData.message}`);
        } else if (errorData.error) {
          throw new Error(`API Error (${response.status}): ${errorData.error}`);
        } else {
          throw new Error(`API Error (${response.status}): ${response.statusText}`);
        }
      } catch (parseError) {
        console.error('❌ Raw error response:', responseText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error('Invalid JSON response from server');
    }

    console.log('✅ Dealer Updated Response:', data);

    if ((data.statusCode === 200 || data.statusCode === 201) && data.data) {
      return data.data;
    }

    throw new Error('API did not return updated dealer data in expected format');
  } catch (error) {
    console.error('❌ Update Dealer Error:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error occurred while updating dealer');
    }
  }
}

// Delete dealer
export async function deleteDealer(dealerId: number): Promise<{ success: boolean; message: string }> {
  const url = `${API_BASE_URL}/dealers/${dealerId}`;
  console.log('🗑️ Deleting dealer at:', url);

  try {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept': '*/*',
        'Authorization': `Bearer ${token}`
      },
    });

    console.log('📥 Delete Response Status:', response.status);

    if (!response.ok) {
      const responseText = await response.text();
      console.error('❌ Delete Error Response:', responseText);
      
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) {
          throw new Error(`API Error (${response.status}): ${errorData.message}`);
        } else if (errorData.error) {
          throw new Error(`API Error (${response.status}): ${errorData.error}`);
        }
      } catch (parseError) {
        // If can't parse JSON, throw with status text
      }
      
      throw new Error(`Failed to delete dealer: ${response.status} ${response.statusText}`);
    }

    console.log('✅ Dealer deleted successfully');
    return {
      success: true,
      message: 'Xóa đại lý thành công'
    };
  } catch (error) {
    console.error('❌ Delete Dealer Error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xóa đại lý'
    };
  }
}

