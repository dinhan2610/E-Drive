// services/testDriveApi.ts - Optimized API với Authentication

const API_BASE_URL = 'http://localhost:8080';

// ===== TYPES =====

export interface TestDrive {
  testdriveId: number;
  customerId: number;
  customerName: string;
  dealerId: number;
  dealerName: string;
  vehicleId: number;
  vehicleModel: string;
  scheduleDatetime: string;
  completedAt: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  cancelReason: string | null;
}

export interface TestDriveRequest {
  customerId: number;
  dealerId: number;
  vehicleId: number;
  scheduleDatetime: string; // ISO 8601 format: "2025-10-24T18:29:34.064Z"
  status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  cancelReason?: string;
  note?: string; // Additional notes, can include customer info for walk-in bookings
}

export class TestDriveApiError extends Error {
  code?: string;
  details?: any;

  constructor(message: string, code?: string, details?: any) {
    super(message);
    this.name = 'TestDriveApiError';
    this.code = code;
    this.details = details;
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Get token from localStorage and create headers
 */
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'accept': '*/*',
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Handle response and errors
 */
const handleResponse = async <T>(response: Response): Promise<T> => {
  console.log('🔍 handleResponse - status:', response.status, 'ok:', response.ok);
  
  if (!response.ok) {
    let errorMessage = 'Đã xảy ra lỗi';
    
    try {
      const errorData = await response.json();
      console.log('❌ Error data:', errorData);
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    switch (response.status) {
      case 401:
        // Remove expired tokens (both keys)
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        throw new TestDriveApiError(
          'Phien dang nhap da het han. Vui long dang nhap lai', 
          'AUTH_ERROR'
        );
      case 403:
        throw new TestDriveApiError(
          'Ban khong co quyen truy cap. Vui long dang nhap voi tai khoan Admin', 
          'FORBIDDEN'
        );
      case 404:
        throw new TestDriveApiError('Khong tim thay du lieu', 'NOT_FOUND');
      case 400:
        throw new TestDriveApiError(errorMessage, 'BAD_REQUEST');
      default:
        throw new TestDriveApiError(errorMessage, 'API_ERROR');
    }
  }

  const jsonData = await response.json();
  console.log('✅ Success response data:', jsonData);
  return jsonData;
};

// ===== API FUNCTIONS =====

/**
 * GET /api/testdrives - Get all test drive bookings (Authentication required)
 */
export const getTestDriveBookings = async (): Promise<TestDrive[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/testdrives`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const result = await handleResponse<any>(response);
    
    console.log('API Response:', result);
    
    // Xử lý cả 2 format: array trực tiếp hoặc {statusCode, message, data}
    if (Array.isArray(result)) {
      return result;
    }
    
    if (result && Array.isArray(result.data)) {
      return result.data;
    }
    
    console.error('Unexpected response format:', result);
    return [];
    
  } catch (error) {
    if (error instanceof TestDriveApiError) throw error;
    throw new TestDriveApiError('Khong the tai danh sach lai thu', 'NETWORK_ERROR', error);
  }
};

/**
 * GET /api/testdrives/dealer/{dealerId} - Get test drive bookings by dealer (Authentication required)
 */
export const getTestDrivesByDealer = async (dealerId: number): Promise<TestDrive[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/testdrives/dealer/${dealerId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const result = await handleResponse<any>(response);
    
    console.log('API Response for dealer:', result);
    
    // Xử lý cả 2 format: array trực tiếp hoặc {statusCode, message, data}
    if (Array.isArray(result)) {
      return result;
    }
    
    if (result && Array.isArray(result.data)) {
      return result.data;
    }
    
    console.error('Unexpected response format:', result);
    return [];
    
  } catch (error) {
    if (error instanceof TestDriveApiError) throw error;
    throw new TestDriveApiError('Khong the tai danh sach lai thu theo dealer', 'NETWORK_ERROR', error);
  }
};

/**
 * GET /api/testdrives/{id} - Get test drive detail (Authentication required)
 */
export const getTestDriveById = async (id: number): Promise<TestDrive> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/testdrives/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse<TestDrive>(response);
  } catch (error) {
    if (error instanceof TestDriveApiError) throw error;
    throw new TestDriveApiError('Khong the tai chi tiet lai thu', 'NETWORK_ERROR', error);
  }
};

/**
 * POST /api/testdrives - Create new test drive booking (Authentication required)
 * Note: If 403 error occurs, backend may require different endpoint for DEALER role
 */
export const createTestDrive = async (data: TestDriveRequest): Promise<TestDrive> => {
  try {
    console.log('📤 Creating test drive with data:', data);
    console.log('🔑 Using token:', localStorage.getItem('accessToken') ? 'EXISTS' : 'MISSING');
    
    // Try main endpoint first
    const response = await fetch(`${API_BASE_URL}/api/testdrives`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...data,
        status: data.status || 'PENDING'
      }),
    });

    console.log('📥 Response status:', response.status);
    
    // If 403 and we have dealerId, try dealer-specific endpoint
    if (response.status === 403 && data.dealerId) {
      console.log('⚠️ Got 403, trying dealer-specific endpoint...');
      console.log('🔄 Trying: POST /api/testdrives/dealer/' + data.dealerId);
      
      const dealerResponse = await fetch(`${API_BASE_URL}/api/testdrives/dealer/${data.dealerId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...data,
          status: data.status || 'PENDING'
        }),
      });
      
      console.log('📥 Dealer endpoint response status:', dealerResponse.status);
      return handleResponse<TestDrive>(dealerResponse);
    }

    return handleResponse<TestDrive>(response);
  } catch (error) {
    if (error instanceof TestDriveApiError) throw error;
    throw new TestDriveApiError('Khong the tao lich lai thu', 'NETWORK_ERROR', error);
  }
};

/**
 * PUT /api/testdrives/{id} - Update test drive booking (Authentication required)
 * Supports fallback to dealer-specific endpoint if main endpoint returns 403
 */
export const updateTestDrive = async (
  id: number,
  data: TestDriveRequest
): Promise<TestDrive> => {
  try {
    console.log('📝 Updating test drive #' + id + ' with data:', data);
    console.log('🔑 Using token:', localStorage.getItem('accessToken') ? 'EXISTS' : 'MISSING');
    
    // Try main endpoint first
    const response = await fetch(`${API_BASE_URL}/api/testdrives/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    console.log('📥 Update response status:', response.status);
    
    // If 403 and we have dealerId, try dealer-specific endpoint
    if (response.status === 403 && data.dealerId) {
      console.log('⚠️ Got 403, trying dealer-specific update endpoint...');
      console.log('🔄 Trying: PUT /api/testdrives/dealer/' + data.dealerId + '/' + id);
      
      const dealerResponse = await fetch(`${API_BASE_URL}/api/testdrives/dealer/${data.dealerId}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      console.log('📥 Dealer endpoint response status:', dealerResponse.status);
      const result = await handleResponse<any>(dealerResponse);
      
      // Handle both direct object and wrapped response
      if (result.data && typeof result.data === 'object') {
        return result.data;
      }
      return result;
    }

    const result = await handleResponse<any>(response);
    
    // Handle both direct object and wrapped response
    if (result.data && typeof result.data === 'object') {
      return result.data;
    }
    return result;
    
  } catch (error) {
    console.error('❌ Update test drive error:', error);
    if (error instanceof TestDriveApiError) throw error;
    throw new TestDriveApiError('Khong the cap nhat lich lai thu', 'NETWORK_ERROR', error);
  }
};

/**
 * DELETE /api/testdrives/{id} - Delete test drive booking (Authentication required)
 * Supports fallback to dealer-specific endpoint if main endpoint returns 403
 */
export const deleteTestDrive = async (id: number, dealerId?: number): Promise<void> => {
  try {
    console.log('🗑️ Deleting test drive #' + id);
    console.log('🔑 Using token:', localStorage.getItem('accessToken') ? 'EXISTS' : 'MISSING');
    
    // Try main endpoint first
    const response = await fetch(`${API_BASE_URL}/api/testdrives/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    console.log('📥 Delete response status:', response.status);

    // If 403 and we have dealerId, try dealer-specific endpoint
    if (response.status === 403 && dealerId) {
      console.log('⚠️ Got 403, trying dealer-specific delete endpoint...');
      console.log('🔄 Trying: DELETE /api/testdrives/dealer/' + dealerId + '/' + id);
      
      const dealerResponse = await fetch(`${API_BASE_URL}/api/testdrives/dealer/${dealerId}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      console.log('📥 Dealer endpoint response status:', dealerResponse.status);
      
      if (!dealerResponse.ok) {
        let errorMessage = 'Khong the xoa lich lai thu';
        try {
          const errorData = await dealerResponse.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = dealerResponse.statusText || errorMessage;
        }
        throw new TestDriveApiError(errorMessage, 'API_ERROR');
      }
      
      console.log('✅ Test drive deleted successfully via dealer endpoint');
      return;
    }

    if (!response.ok) {
      let errorMessage = 'Khong the xoa lich lai thu';
      try {
        const errorData = await response.json();
        console.log('❌ Delete error data:', errorData);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      
      throw new TestDriveApiError(errorMessage, 'API_ERROR');
    }
    
    console.log('✅ Test drive deleted successfully');
  } catch (error) {
    console.error('❌ Delete test drive error:', error);
    if (error instanceof TestDriveApiError) throw error;
    throw new TestDriveApiError('Khong the xoa lich lai thu', 'NETWORK_ERROR', error);
  }
};

/**
 * Confirm test drive booking (PENDING -> CONFIRMED) - Authentication required
 */
export const confirmTestDrive = async (id: number): Promise<TestDrive> => {
  const testDrive = await getTestDriveById(id);
  
  return updateTestDrive(id, {
    customerId: testDrive.customerId,
    dealerId: testDrive.dealerId,
    vehicleId: testDrive.vehicleId,
    scheduleDatetime: testDrive.scheduleDatetime,
    status: 'CONFIRMED',
    cancelReason: testDrive.cancelReason || undefined
  });
};

/**
 * Complete test drive booking (CONFIRMED -> COMPLETED) - Authentication required
 */
export const completeTestDrive = async (id: number): Promise<TestDrive> => {
  const testDrive = await getTestDriveById(id);
  
  return updateTestDrive(id, {
    customerId: testDrive.customerId,
    dealerId: testDrive.dealerId,
    vehicleId: testDrive.vehicleId,
    scheduleDatetime: testDrive.scheduleDatetime,
    status: 'COMPLETED',
    cancelReason: testDrive.cancelReason || undefined
  });
};

/**
 * Cancel test drive booking (-> CANCELLED) - Authentication required
 */
export const cancelTestDrive = async (id: number, reason: string): Promise<TestDrive> => {
  const testDrive = await getTestDriveById(id);
  
  return updateTestDrive(id, {
    customerId: testDrive.customerId,
    dealerId: testDrive.dealerId,
    vehicleId: testDrive.vehicleId,
    scheduleDatetime: testDrive.scheduleDatetime,
    status: 'CANCELLED',
    cancelReason: reason
  });
};