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
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED'; // Dealer confirmation
  statusForStaff?: 'PENDING' | 'COMPLETED' | 'CANCELLED'; // Staff processing status
  cancelReason: string | null;
}

export interface TestDriveRequest {
  customerId: number;
  staffUserId?: number; // Staff assigned to this test drive (auto-filled from profile)
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
 * Get userId from JWT token
 * Returns the 'sub' field from token payload which contains userId
 */
const getUserIdFromToken = (): number | undefined => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  if (!token) return undefined;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub || payload.userId || payload.id || payload.user_id;
    
    if (userId) {
      return typeof userId === 'string' ? parseInt(userId, 10) : userId;
    }
    
    return undefined;
  } catch (error) {
    console.error('❌ Error decoding token:', error);
    return undefined;
  }
};

/**
 * Get userId from user data stored in localStorage/sessionStorage
 */
const getUserIdFromStorage = (): number | undefined => {
  try {
    let userData = sessionStorage.getItem('e-drive-user');
    if (!userData) {
      userData = localStorage.getItem('e-drive-user');
    }
    
    if (userData) {
      const user = JSON.parse(userData);
      const userId = user.userId || user.id || user.profileId;
      if (userId) {
        return typeof userId === 'string' ? parseInt(userId, 10) : userId;
      }
    }
  } catch (error) {
    console.error('❌ Error reading user from storage:', error);
  }
  return undefined;
};

/**
 * Get userId from API profile (fallback)
 */
const getUserIdFromAPI = async (): Promise<number | undefined> => {
  try {
    const { getProfile } = await import('./profileApi');
    const profile = await getProfile();
    return profile.profileId;
  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    return undefined;
  }
};

/**
 * Get userId with multiple fallback strategies
 * 1. Try JWT token
 * 2. Try localStorage/sessionStorage
 * 3. Try API call
 */
const getUserId = async (): Promise<number | undefined> => {
  let userId = getUserIdFromToken();
  if (userId) return userId;
  
  userId = getUserIdFromStorage();
  if (userId) return userId;
  
  userId = await getUserIdFromAPI();
  return userId;
};

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

    const filteredTestDrives = rawTestDrives.filter(td => {
      const testDriveDealerId = Number(td.dealerId);
      return testDriveDealerId === Number(dealerId);
    });
    
    // Normalize the response - backend uses statusForManager and statusForStaff
    const normalizedTestDrives = filteredTestDrives.map(td => ({
      ...td,
      status: td.status || td.statusForManager || 'PENDING', // Map statusForManager to status
      statusForStaff: td.statusForStaff || 'PENDING', // Keep staff status separate
    }));
    
    return normalizedTestDrives;
    
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
/**
 * Create a new test drive booking
 * Automatically fetches staffUserId from user profile if not provided
 */
export const createTestDrive = async (data: TestDriveRequest): Promise<TestDrive> => {
  try {
    let staffUserId = data.staffUserId;
    if (!staffUserId) {
      staffUserId = await getUserId();
    }

    const payload: any = {
      customerId: data.customerId,
      dealerId: data.dealerId,
      vehicleId: data.vehicleId,
      scheduleDatetime: data.scheduleDatetime,
      status: data.status || 'PENDING',
    };
    
    if (staffUserId) {
      payload.staffUserId = staffUserId;
    }
    
    if (data.cancelReason) {
      payload.cancelReason = data.cancelReason;
    }
    if (data.note) {
      payload.note = data.note;
    }

    if (data.dealerId) {
      const dealerResponse = await fetch(`${API_BASE_URL}/api/testdrives/dealer/${data.dealerId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      
      const result = await handleResponse<any>(dealerResponse);
      return result.data || result;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/testdrives`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const result = await handleResponse<any>(response);
    return result.data || result;
  } catch (error) {
    if (error instanceof TestDriveApiError) throw error;
    throw new TestDriveApiError('Khong the tao lich lai thu', 'NETWORK_ERROR', error);
  }
};

/**
 * PATCH /api/testdrives/dealer/{dealerId}/{testdriveId}/manager/status
 * Update test drive status by Manager (DEALER_MANAGER role)
 * Automatically fetches staffUserId from user profile if not provided
 */
export const updateManagerStatus = async (
  dealerId: number,
  testdriveId: number,
  statusData: { 
    staffUserId?: number;
    statusOfManager: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
    cancelReason?: string;
  }
): Promise<TestDrive> => {
  try {
    let staffUserId = statusData.staffUserId;
    if (!staffUserId) {
      staffUserId = await getUserId();
      if (!staffUserId) {
        throw new TestDriveApiError('Không thể xác định thông tin người dùng. Vui lòng đăng nhập lại.', 'AUTH_ERROR');
      }
    }

    const payload: any = {
      statusOfManager: statusData.statusOfManager,
      staffUserId: staffUserId,
    };
    
    if (statusData.cancelReason && statusData.cancelReason.trim() !== '') {
      payload.cancelReason = statusData.cancelReason;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/testdrives/dealer/${dealerId}/${testdriveId}/manager/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const result = await handleResponse<any>(response);
    const testDriveData = result.data && typeof result.data === 'object' ? result.data : result;
    
    const normalized = {
      ...testDriveData,
      status: testDriveData.status || testDriveData.statusForManager || 'PENDING',
      statusForStaff: testDriveData.statusForStaff || 'PENDING',
    };
    
    return normalized;
  } catch (error) {
    console.error('❌ Update manager status error:', error);
    if (error instanceof TestDriveApiError) throw error;
    throw new TestDriveApiError('Không thể cập nhật trạng thái Manager', 'NETWORK_ERROR', error);
  }
};

/**
 * PATCH /api/testdrives/dealer/{dealerId}/{testdriveId}/staff/status
 * Update test drive status by Staff (DEALER_STAFF role)
 * Automatically fetches staffUserId from user profile if not provided
 */
export const updateStaffStatus = async (
  dealerId: number,
  testdriveId: number,
  statusData: { 
    staffUserId?: number;
    statusOfStaff: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    cancelReason?: string;
  }
): Promise<TestDrive> => {
  try {
    let staffUserId = statusData.staffUserId;
    if (!staffUserId) {
      staffUserId = await getUserId();
      if (!staffUserId) {
        throw new TestDriveApiError('Không thể xác định thông tin người dùng. Vui lòng đăng nhập lại.', 'AUTH_ERROR');
      }
    }

    const payload: any = {
      statusOfStaff: statusData.statusOfStaff,
      staffUserId: staffUserId,
    };
    
    if (statusData.cancelReason && statusData.cancelReason.trim() !== '') {
      payload.cancelReason = statusData.cancelReason;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/testdrives/dealer/${dealerId}/${testdriveId}/staff/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const result = await handleResponse<any>(response);
    const testDriveData = result.data && typeof result.data === 'object' ? result.data : result;
    
    const normalized = {
      ...testDriveData,
      status: testDriveData.status || testDriveData.statusForManager || 'PENDING',
      statusForStaff: testDriveData.statusForStaff || 'PENDING',
    };
    
    return normalized;
  } catch (error) {
    console.error('❌ Update staff status error:', error);
    if (error instanceof TestDriveApiError) throw error;
    throw new TestDriveApiError('Không thể cập nhật trạng thái Staff', 'NETWORK_ERROR', error);
  }
};

/**
 * @deprecated Use updateManagerStatus or updateStaffStatus instead
 * PATCH /api/testdrives/dealer/{dealerId}/{testdriveId}/status - Update test drive status
 * Supports both dealer confirmation status and staff processing status
 */
export const updateTestDriveStatus = async (
  dealerId: number,
  testdriveId: number,
  statusData: { 
    status?: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED'; // Dealer confirmation
    statusForStaff?: 'PENDING' | 'COMPLETED' | 'CANCELLED'; // Staff processing
    cancelReason?: string;
  }
): Promise<TestDrive> => {
  try {
    const payload: any = {};
    
    // Include dealer status if provided
    if (statusData.status) {
      payload.status = statusData.status;
    }
    
    // Include staff status if provided
    if (statusData.statusForStaff) {
      payload.statusForStaff = statusData.statusForStaff;
    }
    
    // Only include cancelReason if it has a value
    if (statusData.cancelReason && statusData.cancelReason.trim() !== '') {
      payload.cancelReason = statusData.cancelReason;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/testdrives/dealer/${dealerId}/${testdriveId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const result = await handleResponse<any>(response);
    
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