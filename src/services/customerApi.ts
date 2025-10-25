const API_BASE_URL = 'http://localhost:8080/api';

export interface Customer {
  customerId: number;
  fullName: string;
  dob: string; // Date of birth
  gender: string;
  email: string;
  phone: string;
  address: string;
  idCardNo: string; // ID Card Number (CCCD/CMND)
}

export interface CustomerApiResponse {
  statusCode: number;
  message: string;
  data: Customer[];
}

// Fetch all customers
export async function fetchCustomers(): Promise<Customer[]> {
  const url = `${API_BASE_URL}/customer`;
  console.log('👥 Fetching customers from:', url);

  try {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken');
    
    const headers: HeadersInit = {
      'Accept': '*/*',
    };
    
    // Add Authorization header if token exists
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

    const data: CustomerApiResponse = await response.json();
    console.log('✅ Customers Response:', data);

    if (data.statusCode === 200 && data.data) {
      return data.data;
    }

    throw new Error('Unexpected API response format');
  } catch (error) {
    console.error('❌ Fetch Customers Error:', error);
    throw error;
  }
}

// Get customer by ID
export async function getCustomerById(customerId: number): Promise<Customer> {
  const url = `${API_BASE_URL}/customer/${customerId}`;
  console.log('🔍 Getting customer by ID:', url);

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
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Customer Detail Response:', data);

    if (data.statusCode === 200 && data.data) {
      return data.data;
    }

    throw new Error('Customer not found');
  } catch (error) {
    console.error('❌ Get Customer by ID Error:', error);
    throw error;
  }
}

