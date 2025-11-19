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
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
  cancelReason: string | null;
}

export interface TestDriveRequest {
  customerId: number;
  dealerId: number;
  vehicleId: number;
  scheduleDatetime: string; // ISO 8601 format: "2025-10-24T18:29:34.064Z"
  status?: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
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
  if (!response.ok) {
    let errorMessage = 'Đã xảy ra lỗi';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    switch (response.status) {
      case 401:
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

  return await response.json();
};

// ===== API FUNCTIONS =====

/**
 * GET /api/testdrives - Get all test drive bookings
 */
export const getTestDriveBookings = async (): Promise<TestDrive[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/testdrives`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const result = await handleResponse<any>(response);
    
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
 * GET /api/testdrives/dealer/{dealerId} - Get test drive bookings by dealer
 * Includes strict filtering to ensure only correct dealer test drives are returned
 */
export const getTestDrivesByDealer = async (dealerId: number): Promise<TestDrive[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/testdrives/dealer/${dealerId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const result = await handleResponse<any>(response);
    
    // Extract test drives array from response
    const rawTestDrives: any[] = Array.isArray(result) 
      ? result 
      : (result?.data || result?.content || []);

    if (!Array.isArray(rawTestDrives)) {
      console.error('Invalid response format');
      return [];
    }

    // CRITICAL: Filter to ensure ONLY test drives for this dealer
    const filteredTestDrives = rawTestDrives.filter(td => {
      const testDriveDealerId = Number(td.dealerId);
      const isMatch = testDriveDealerId === Number(dealerId);
      
      if (!isMatch) {
        console.warn(`⚠️ Filtered out test drive ${td.testdriveId} - belongs to dealer ${testDriveDealerId}, not ${dealerId}`);
      }
      
      return isMatch;
    });
    
    return filteredTestDrives;
    
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
 * POST /api/testdrives - Create new test drive booking
 */
export const createTestDrive = async (data: TestDriveRequest): Promise<TestDrive> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/testdrives`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...data,
        status: data.status || 'PENDING'
      }),
    });
    
    // If 403 and we have dealerId, try dealer-specific endpoint
    if (response.status === 403 && data.dealerId) {
      const dealerResponse = await fetch(`${API_BASE_URL}/api/testdrives/dealer/${data.dealerId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...data,
          status: data.status || 'PENDING'
        }),
      });
      
      return handleResponse<TestDrive>(dealerResponse);
    }

    return handleResponse<TestDrive>(response);
  } catch (error) {
    if (error instanceof TestDriveApiError) throw error;
    throw new TestDriveApiError('Khong the tao lich lai thu', 'NETWORK_ERROR', error);
  }
};

/**
 * PATCH /api/testdrives/dealer/{dealerId}/{testdriveId}/status - Update test drive status
 */
export const updateTestDriveStatus = async (
  dealerId: number,
  testdriveId: number,
  statusData: { status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED'; cancelReason?: string }
): Promise<TestDrive> => {
  try {
    const payload: any = {
      status: statusData.status
    };
    
    // Only include cancelReason if it has a value
    if (statusData.cancelReason && statusData.cancelReason.trim() !== '') {
      payload.cancelReason = statusData.cancelReason;
    }
    
    console.log(`🔄 PATCH /api/testdrives/dealer/${dealerId}/${testdriveId}/status`);
    console.log('📤 Payload:', payload);
    
    const response = await fetch(`${API_BASE_URL}/api/testdrives/dealer/${dealerId}/${testdriveId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const result = await handleResponse<any>(response);
    console.log('✅ Status updated:', result);
    
    if (result.data && typeof result.data === 'object') {
      return result.data;
    }
    return result;
  } catch (error) {
    console.error('❌ Update status error:', error);
    if (error instanceof TestDriveApiError) throw error;
    throw new TestDriveApiError('Không thể cập nhật trạng thái', 'NETWORK_ERROR', error);
  }
};

/**
 * PUT /api/testdrives/{id} - Update test drive booking
 */
export const updateTestDrive = async (
  id: number,
  data: TestDriveRequest
): Promise<TestDrive> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/testdrives/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    // If 403 and we have dealerId, try dealer-specific endpoint
    if (response.status === 403 && data.dealerId) {
      const dealerResponse = await fetch(`${API_BASE_URL}/api/testdrives/dealer/${data.dealerId}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      const result = await handleResponse<any>(dealerResponse);
      if (result.data && typeof result.data === 'object') {
        return result.data;
      }
      return result;
    }

    const result = await handleResponse<any>(response);
    if (result.data && typeof result.data === 'object') {
      return result.data;
    }
    return result;
    
  } catch (error) {
    console.error('Update test drive error:', error);
    if (error instanceof TestDriveApiError) throw error;
    throw new TestDriveApiError('Khong the cap nhat lich lai thu', 'NETWORK_ERROR', error);
  }
};

/**
 * DELETE /api/testdrives/{id} - Delete test drive booking
 */
export const deleteTestDrive = async (id: number, dealerId?: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/testdrives/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    // If 403 and we have dealerId, try dealer-specific endpoint
    if (response.status === 403 && dealerId) {
      const dealerResponse = await fetch(`${API_BASE_URL}/api/testdrives/dealer/${dealerId}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
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
      return;
    }

    if (!response.ok) {
      let errorMessage = 'Khong the xoa lich lai thu';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new TestDriveApiError(errorMessage, 'API_ERROR');
    }
  } catch (error) {
    console.error('Delete test drive error:', error);
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
    status: 'APPROVED',
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