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
  // No authentication required - backend has disabled auth
  return {
    'accept': '*/*',
    'Content-Type': 'application/json'
  };
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

  return response.json();
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

    const data = await handleResponse<any>(response);
    
    // Backend may wrap data in different formats
    // Handle: direct array, {data: array}, {content: array}, etc.
    console.log('API Response:', data);
    
    if (Array.isArray(data)) {
      return data;
    }
    
    if (data && Array.isArray(data.data)) {
      return data.data;
    }
    
    if (data && Array.isArray(data.content)) {
      return data.content;
    }
    
    console.error('Unexpected response format:', data);
    return [];
    
  } catch (error) {
    if (error instanceof TestDriveApiError) throw error;
    throw new TestDriveApiError('Khong the tai danh sach lai thu', 'NETWORK_ERROR', error);
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

    return handleResponse<TestDrive>(response);
  } catch (error) {
    if (error instanceof TestDriveApiError) throw error;
    throw new TestDriveApiError('Khong the tao lich lai thu', 'NETWORK_ERROR', error);
  }
};

/**
 * PUT /api/testdrives/{id} - Update test drive booking (Authentication required)
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

    return handleResponse<TestDrive>(response);
  } catch (error) {
    if (error instanceof TestDriveApiError) throw error;
    throw new TestDriveApiError('Khong the cap nhat lich lai thu', 'NETWORK_ERROR', error);
  }
};

/**
 * DELETE /api/testdrives/{id} - Delete test drive booking (Authentication required)
 */
export const deleteTestDrive = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/testdrives/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new TestDriveApiError('Khong the xoa lich lai thu', 'API_ERROR');
    }
  } catch (error) {
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