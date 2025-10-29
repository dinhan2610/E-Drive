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

export interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  dealer: Dealer | null;
}

export interface UpdateProfilePayload {
  fullName: string;
  email: string;
  phone: string;
}

/**
 * Get user profile from API
 */
export async function getProfile(): Promise<UserProfile> {
  const url = `${API_BASE_URL}/profile`;
  console.log('👤 Fetching profile from:', url);

  try {
    const token = localStorage.getItem('accessToken');
    
    const headers: HeadersInit = {
      'Accept': '*/*',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Profile API Response:', data);

    return data;
  } catch (error) {
    console.error('❌ Fetch Profile Error:', error);
    throw error;
  }
}

/**
 * Update user profile via API
 */
export async function updateProfile(data: UpdateProfilePayload): Promise<UserProfile> {
  const url = `${API_BASE_URL}/profile`;
  console.log('✏️ Updating profile at:', url);
  console.log('📤 Request body:', JSON.stringify(data, null, 2));

  try {
    const token = localStorage.getItem('accessToken');
    
    const headers: HeadersInit = {
      'Accept': '*/*',
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
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

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error('Invalid JSON response from server');
    }

    console.log('✅ Profile Updated Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Update Profile Error:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error occurred while updating profile');
    }
  }
}
