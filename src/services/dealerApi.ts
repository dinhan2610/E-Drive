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

export interface DealerApiResponse {
  statusCode: number;
  message: string;
  data: Dealer[];
}

// Fetch all dealers
export async function fetchDealers(): Promise<Dealer[]> {
  const url = `${API_BASE_URL}/dealers`;
  console.log('🏢 Fetching dealers from:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
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
export async function deleteDealer(dealerId: number): Promise<void> {
  const url = `${API_BASE_URL}/dealers/${dealerId}`;
  console.log('🗑️ Deleting dealer at:', url);

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept': '*/*',
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
  } catch (error) {
    console.error('❌ Delete Dealer Error:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error occurred while deleting dealer');
    }
  }
}

