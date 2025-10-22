// services/testDriveApi.ts

interface TestDriveBookingRequest {
    fullName: string;
    phone: string;
    email: string;
    idCardNo: string;
    dealerId: number;
    vehicleId: number;
    date: string; // Format: "YYYY-MM-DD"
    hour: number;
    minute: number;
    note: string;
    agreePolicy: boolean;
  }
  
  interface TestDriveBookingResponse {
    id: number;
    customerId: number;
    dealerId: number;
    vehicleId: number;
    scheduleDatetime: string;
    status: string;
  }
  
  interface ApiError {
    message: string;
    code?: string;
    details?: any;
  }
  
  class TestDriveApiError extends Error {
    public code?: string;
    public details?: any;
  
    constructor(message: string, code?: string, details?: any) {
      super(message);
      this.name = 'TestDriveApiError';
      this.code = code;
      this.details = details;
    }
  }
  
  const API_BASE_URL = 'http://localhost:8080';
  
  /**
   * Validate test drive booking request data
   */
  const validateBookingRequest = (data: TestDriveBookingRequest): void => {
    if (!data.fullName?.trim()) {
      throw new TestDriveApiError('Họ tên không được để trống', 'VALIDATION_ERROR');
    }
    
    if (!data.phone?.trim()) {
      throw new TestDriveApiError('Số điện thoại không được để trống', 'VALIDATION_ERROR');
    }
    
    if (!data.email?.trim()) {
      throw new TestDriveApiError('Email không được để trống', 'VALIDATION_ERROR');
    }
    
    if (!data.idCardNo?.trim()) {
      throw new TestDriveApiError('Số CCCD/CMND không được để trống', 'VALIDATION_ERROR');
    }
    
    if (!data.date) {
      throw new TestDriveApiError('Ngày đặt lịch không được để trống', 'VALIDATION_ERROR');
    }
    
    if (typeof data.hour !== 'number' || data.hour < 0 || data.hour > 23) {
      throw new TestDriveApiError('Giờ không hợp lệ (0-23)', 'VALIDATION_ERROR');
    }
    
    if (typeof data.minute !== 'number' || data.minute < 0 || data.minute > 59) {
      throw new TestDriveApiError('Phút không hợp lệ (0-59)', 'VALIDATION_ERROR');
    }
    
    if (!data.agreePolicy) {
      throw new TestDriveApiError('Bạn phải đồng ý với các điều khoản', 'VALIDATION_ERROR');
    }
  };

  /**
   * Đặt lịch lái thử xe
   */
  export const bookTestDrive = async (
    data: TestDriveBookingRequest
  ): Promise<TestDriveBookingResponse> => {
    // Format and validate request data
    const formattedData = formatBookingRequest(data);
    validateBookingRequest(formattedData);
    
    try {


      const response = await fetch(`${API_BASE_URL}/api/test-drive/book`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });
  


      let responseData: any;
      const contentType = response.headers.get('content-type');
      
      // Try to parse JSON response
      try {
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          const textResponse = await response.text();

          responseData = { message: textResponse };
        }
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        responseData = { message: 'Không thể đọc phản hồi từ server' };
      }


  
      // Check if response is successful
      if (!response.ok) {
        const errorMessage = responseData?.message || 
          (response.status === 400 ? 'Dữ liệu không hợp lệ' :
           response.status === 401 ? 'Không có quyền truy cập' :
           response.status === 404 ? 'Không tìm thấy API endpoint' :
           response.status === 409 ? 'Lịch hẹn đã tồn tại' :
           response.status === 500 ? 'Lỗi server nội bộ' :
           'Đặt lịch lái thử thất bại');
        
        throw new TestDriveApiError(
          errorMessage,
          responseData?.code || `HTTP_${response.status}`,
          responseData
        );
      }
  
      return responseData;
    } catch (error) {
      // Handle network errors or JSON parse errors
      if (error instanceof TestDriveApiError) {
        throw error;
      }
  
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new TestDriveApiError(
          'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
          'NETWORK_ERROR'
        );
      }
  
      throw new TestDriveApiError(
        'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.',
        'UNKNOWN_ERROR',
        error
      );
    }
  };
  
  /**
   * Format and sanitize request data
   */
  export const formatBookingRequest = (data: TestDriveBookingRequest): TestDriveBookingRequest => {
    return {
      fullName: data.fullName.trim(),
      phone: data.phone.replace(/\D/g, ''), // Remove non-digits
      email: data.email.trim().toLowerCase(),
      idCardNo: data.idCardNo.replace(/\D/g, ''), // Remove non-digits
      dealerId: data.dealerId,
      vehicleId: data.vehicleId,
      date: data.date,
      hour: data.hour,
      minute: data.minute,
      note: data.note?.trim() || '',
      agreePolicy: data.agreePolicy,
    };
  };
  
  /**
   * Test API connection
   */
  export const testApiConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  };

// ===== ADMIN API FUNCTIONS =====

interface TestDriveAdminResponse {
  id: number;
  customerId: number;
  dealerId: number;
  vehicleId: number;
  scheduleDatetime: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
}

interface TestDriveDetailResponse {
  statusCode: number;
  message: string;
  data: TestDriveAdminResponse;
}

interface TestDriveListResponse {
  content: TestDriveAdminResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * Get all test drive bookings (Admin)
 * GET /api/test-drive?page=0&size=10
 * Note: API returns array directly, not paginated response
 */
export const getTestDriveBookings = async (
  page: number = 0,
  size: number = 10
): Promise<TestDriveAdminResponse[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new TestDriveApiError('Unauthorized - No token found', 'AUTH_ERROR');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/test-drive?page=${page}&size=${size}`,
      {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new TestDriveApiError('Unauthorized - Invalid token', 'AUTH_ERROR');
      }
      throw new TestDriveApiError(
        `Failed to fetch test drive bookings: ${response.statusText}`,
        'API_ERROR'
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TestDriveApiError) {
      throw error;
    }
    throw new TestDriveApiError(
      'Failed to fetch test drive bookings',
      'UNKNOWN_ERROR',
      error
    );
  }
};

/**
 * Get test drive booking detail by ID (Admin)
 * GET /api/test-drive/{id}
 */
export const getTestDriveById = async (id: number): Promise<TestDriveAdminResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new TestDriveApiError('Unauthorized - No token found', 'AUTH_ERROR');
    }

    const response = await fetch(`${API_BASE_URL}/api/test-drive/${id}`, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new TestDriveApiError('Unauthorized - Invalid token', 'AUTH_ERROR');
      }
      if (response.status === 404) {
        throw new TestDriveApiError('Test drive booking not found', 'NOT_FOUND');
      }
      throw new TestDriveApiError(
        `Failed to fetch test drive detail: ${response.statusText}`,
        'API_ERROR'
      );
    }

    const result: TestDriveDetailResponse = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof TestDriveApiError) {
      throw error;
    }
    throw new TestDriveApiError(
      'Failed to fetch test drive detail',
      'UNKNOWN_ERROR',
      error
    );
  }
};

/**
 * Cancel test drive booking (Admin)
 * POST /api/test-drive/{id}/cancel?reason={reason}
 */
export const cancelTestDrive = async (
  id: number,
  reason: string
): Promise<TestDriveAdminResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new TestDriveApiError('Unauthorized - No token found', 'AUTH_ERROR');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/test-drive/${id}/cancel?reason=${encodeURIComponent(reason)}`,
      {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new TestDriveApiError('Unauthorized - Invalid token', 'AUTH_ERROR');
      }
      if (response.status === 404) {
        throw new TestDriveApiError('Test drive booking not found', 'NOT_FOUND');
      }
      if (response.status === 400) {
        const errorData = await response.json();
        throw new TestDriveApiError(
          errorData.message || 'Cannot cancel this booking',
          'BAD_REQUEST'
        );
      }
      throw new TestDriveApiError(
        `Failed to cancel test drive: ${response.statusText}`,
        'API_ERROR'
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TestDriveApiError) {
      throw error;
    }
    throw new TestDriveApiError(
      'Failed to cancel test drive booking',
      'UNKNOWN_ERROR',
      error
    );
  }
};

/**
 * Complete test drive booking (Admin)
 * POST /api/test-drive/{id}/complete
 */
export const completeTestDrive = async (id: number): Promise<TestDriveAdminResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new TestDriveApiError('Unauthorized - No token found', 'AUTH_ERROR');
    }

    const response = await fetch(`${API_BASE_URL}/api/test-drive/${id}/complete`, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new TestDriveApiError('Unauthorized - Invalid token', 'AUTH_ERROR');
      }
      if (response.status === 404) {
        throw new TestDriveApiError('Test drive booking not found', 'NOT_FOUND');
      }
      if (response.status === 400) {
        const errorData = await response.json();
        throw new TestDriveApiError(
          errorData.message || 'Cannot complete this booking',
          'BAD_REQUEST'
        );
      }
      throw new TestDriveApiError(
        `Failed to complete test drive: ${response.statusText}`,
        'API_ERROR'
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TestDriveApiError) {
      throw error;
    }
    throw new TestDriveApiError(
      'Failed to complete test drive booking',
      'UNKNOWN_ERROR',
      error
    );
  }
};

/**
 * Confirm test drive booking (Admin)
 * POST /api/test-drive/{id}/confirm
 */
export const confirmTestDrive = async (id: number): Promise<TestDriveAdminResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new TestDriveApiError('Unauthorized - No token found', 'AUTH_ERROR');
    }

    const response = await fetch(`${API_BASE_URL}/api/test-drive/${id}/confirm`, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new TestDriveApiError('Unauthorized - Invalid token', 'AUTH_ERROR');
      }
      if (response.status === 404) {
        throw new TestDriveApiError('Test drive booking not found', 'NOT_FOUND');
      }
      if (response.status === 400) {
        const errorData = await response.json();
        throw new TestDriveApiError(
          errorData.message || 'Cannot confirm this booking',
          'BAD_REQUEST'
        );
      }
      throw new TestDriveApiError(
        `Failed to confirm test drive: ${response.statusText}`,
        'API_ERROR'
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TestDriveApiError) {
      throw error;
    }
    throw new TestDriveApiError(
      'Failed to confirm test drive booking',
      'UNKNOWN_ERROR',
      error
    );
  }
};

export { TestDriveApiError };
export type { 
  TestDriveBookingRequest, 
  TestDriveBookingResponse, 
  ApiError,
  TestDriveAdminResponse,
  TestDriveDetailResponse,
  TestDriveListResponse
};