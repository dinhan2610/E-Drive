import type {
  Customer,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  ListCustomersParams,
  ListCustomersResponse
} from '../types/customer';

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * List customers with pagination, search, and filters
 */
export async function listCustomers(params: ListCustomersParams = {}): Promise<ListCustomersResponse> {
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

    const data = await response.json();
    console.log('✅ Customers API Response:', data);

    if (data.statusCode === 200 && data.data) {
      const customers: Customer[] = data.data;
      
      // Apply client-side filtering and sorting since API doesn't support it yet
      let filtered = [...customers];
      
      // Search by name, phone, or email
      if (params.q) {
        const query = params.q.toLowerCase();
        filtered = filtered.filter((c: Customer) =>
          c.fullName.toLowerCase().includes(query) ||
          c.phone.includes(query) ||
          (c.email && c.email.toLowerCase().includes(query))
        );
      }

      // Sort
      filtered.sort((a, b) => {
        switch (params.sort) {
          case 'newest':
            return b.customerId - a.customerId;
          case 'oldest':
            return a.customerId - b.customerId;
          case 'name_asc':
            return a.fullName.localeCompare(b.fullName);
          case 'name_desc':
            return b.fullName.localeCompare(a.fullName);
          default:
            return 0;
        }
      });

      // Paginate
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const total = filtered.length;
      const totalPages = Math.ceil(total / pageSize);
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const items = filtered.slice(start, end);

      return {
        items,
        total,
        page,
        pageSize,
        totalPages
      };
    }

    throw new Error('Unexpected API response format');
  } catch (error) {
    console.error('❌ Fetch Customers Error:', error);
    throw error;
  }
}

/**
 * Get customer by ID
 */
export async function getCustomer(id: number): Promise<Customer> {
  const url = `${API_BASE_URL}/customer/${id}`;
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

/**
 * Get customer by dealer ID and customer ID
 */
export async function getCustomerByDealer(dealerId: number, customerId: number): Promise<Customer> {
  const url = `${API_BASE_URL}/dealer/${dealerId}/customers/${customerId}`;
  console.log('🔍 Getting customer by dealer and customer ID:', url);

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
    console.log('✅ Customer by Dealer Response:', data);

    if (data.statusCode === 200 && data.data) {
      return data.data;
    }

    throw new Error('Customer not found');
  } catch (error) {
    console.error('❌ Get Customer by Dealer Error:', error);
    throw error;
  }
}

/**
 * Get all customers by dealer ID
 */
export async function getCustomersByDealer(dealerId: number): Promise<Customer[]> {
  const url = `${API_BASE_URL}/dealer/${dealerId}/customers`;
  console.log('👥 Getting all customers for dealer:', url);

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
    console.log('✅ Customers by Dealer Response:', data);

    // Handle different response formats
    if (data.statusCode === 200 && data.data) {
      // Backend returns { statusCode: 200, message: "...", data: [...] }
      return Array.isArray(data.data) ? data.data : [];
    }

    // If data is directly an array
    if (Array.isArray(data)) {
      return data;
    }

    return [];
  } catch (error) {
    console.error('❌ Get Customers by Dealer Error:', error);
    throw error;
  }
}

/**
 * Create new customer
 */
export async function createCustomer(payload: CreateCustomerPayload): Promise<Customer> {
  const url = `${API_BASE_URL}/customer`;
  console.log('👤 Creating customer at:', url);
  console.log('📤 Request body:', JSON.stringify(payload, null, 2));

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
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
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

    console.log('✅ Customer Created Response:', data);

    if ((data.statusCode === 200 || data.statusCode === 201) && data.data) {
      return data.data;
    }

    throw new Error('API did not return created customer data in expected format');
  } catch (error) {
    console.error('❌ Create Customer Error:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error occurred while creating customer');
    }
  }
}

/**
 * Create new customer for a specific dealer
 */
export async function createCustomerForDealer(dealerId: number, payload: CreateCustomerPayload): Promise<Customer> {
  const url = `${API_BASE_URL}/dealer/${dealerId}/customers`;
  console.log('👤 Creating customer for dealer at:', url);
  console.log('📤 Request body:', JSON.stringify(payload, null, 2));

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
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
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

    console.log('✅ Customer Created for Dealer Response:', data);

    if ((data.statusCode === 200 || data.statusCode === 201) && data.data) {
      return data.data;
    }

    throw new Error('API did not return created customer data in expected format');
  } catch (error) {
    console.error('❌ Create Customer for Dealer Error:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error occurred while creating customer for dealer');
    }
  }
}

/**
 * Update customer
 */
export async function updateCustomer(id: number, payload: UpdateCustomerPayload): Promise<Customer> {
  const url = `${API_BASE_URL}/customer/${id}`;
  console.log('✏️ Updating customer at:', url);
  console.log('📤 Request body:', JSON.stringify(payload, null, 2));

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
      body: JSON.stringify(payload),
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

    console.log('✅ Customer Updated Response:', data);

    if (data.statusCode === 200 && data.data) {
      return data.data;
    }

    throw new Error('API did not return updated customer data in expected format');
  } catch (error) {
    console.error('❌ Update Customer Error:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error occurred while updating customer');
    }
  }
}

/**
 * Delete customer
 */
export async function deleteCustomer(id: number): Promise<void> {
  const url = `${API_BASE_URL}/customer/${id}`;
  console.log('🗑️ Deleting customer at:', url);

  try {
    const token = localStorage.getItem('accessToken');
    
    const headers: HeadersInit = {
      'Accept': '*/*',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
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

    // If response has content, parse it
    if (responseText) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Customer Deleted Response:', data);
      } catch (parseError) {
        // Response might be empty or plain text, which is OK for DELETE
        console.log('✅ Customer deleted successfully');
      }
    } else {
      console.log('✅ Customer deleted successfully (no content)');
    }
  } catch (error) {
    console.error('❌ Delete Customer Error:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error occurred while deleting customer');
    }
  }
}

/**
 * Update customer for a specific dealer
 */
export async function updateCustomerForDealer(dealerId: number, customerId: number, payload: UpdateCustomerPayload): Promise<Customer> {
  const url = `${API_BASE_URL}/dealer/${dealerId}/customers/${customerId}`;
  console.log('✏️ Updating customer for dealer at:', url);
  console.log('📤 Request body:', JSON.stringify(payload, null, 2));

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
      body: JSON.stringify(payload),
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

    console.log('✅ Customer Updated for Dealer Response:', data);

    if (data.statusCode === 200 && data.data) {
      return data.data;
    }

    throw new Error('API did not return updated customer data in expected format');
  } catch (error) {
    console.error('❌ Update Customer for Dealer Error:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error occurred while updating customer for dealer');
    }
  }
}

/**
 * Delete customer for a specific dealer
 */
export async function deleteCustomerForDealer(dealerId: number, customerId: number): Promise<void> {
  const url = `${API_BASE_URL}/dealer/${dealerId}/customers/${customerId}`;
  console.log('🗑️ Deleting customer for dealer at:', url);

  try {
    const token = localStorage.getItem('accessToken');
    
    const headers: HeadersInit = {
      'Accept': '*/*',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
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

    // If response has content, parse it
    if (responseText) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Customer Deleted for Dealer Response:', data);
      } catch (parseError) {
        // Response might be empty or plain text, which is OK for DELETE
        console.log('✅ Customer deleted for dealer successfully');
      }
    } else {
      console.log('✅ Customer deleted for dealer successfully (no content)');
    }
  } catch (error) {
    console.error('❌ Delete Customer for Dealer Error:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error occurred while deleting customer for dealer');
    }
  }
}

/**
 * Utility: Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  return phone;
}

/**
 * Utility: Get relative time
 */
export function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  } else {
    return date.toLocaleDateString('vi-VN');
  }
}

/**
 * Utility: Validate customer data
 */
export function validateCustomerData(data: Partial<CreateCustomerPayload>) {
  const errors: Record<string, string> = {};

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = 'Tên khách hàng phải có ít nhất 2 ký tự';
  }

  if (!data.dob) {
    errors.dob = 'Vui lòng chọn ngày sinh';
  } else {
    const dobDate = new Date(data.dob);
    const today = new Date();
    if (dobDate > today) {
      errors.dob = 'Ngày sinh không thể là ngày trong tương lai';
    }
  }

  if (!data.gender) {
    errors.gender = 'Vui lòng chọn giới tính';
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Email không hợp lệ';
  }

  if (!data.phone) {
    errors.phone = 'Vui lòng nhập số điện thoại';
  } else if (!/^[0-9]{10}$/.test(data.phone.replace(/\D/g, ''))) {
    errors.phone = 'Số điện thoại không hợp lệ (cần 10 chữ số)';
  }

  if (!data.address || data.address.trim().length < 5) {
    errors.address = 'Vui lòng nhập địa chỉ đầy đủ';
  }

  if (!data.idCardNo || !/^[0-9]{9,12}$/.test(data.idCardNo)) {
    errors.idCardNo = 'CCCD/CMND không hợp lệ (9-12 chữ số)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
