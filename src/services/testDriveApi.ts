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
   * Đặt lịch lái thử xe
   */
  export const bookTestDrive = async (
    data: TestDriveBookingRequest
  ): Promise<TestDriveBookingResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/test-drive/book`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      // Parse response body
      const responseData = await response.json();
  
      // Check if response is successful
      if (!response.ok) {
        throw new TestDriveApiError(
          responseData.message || 'Đặt lịch lái thử thất bại',
          responseData.code || `HTTP_${response.status}`,
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
   * Helper function để convert form data sang format API
   */
  export const convertFormDataToApiRequest = (formData: {
    name: string;
    phone: string;
    email: string;
    citizenId: string;
    dealer: string;
    model: string;
    variant: string;
    date: string;
    time: string;
    note: string;
    confirmInfo: boolean;
  }): Partial<TestDriveBookingRequest> => {
    const [hour, minute] = formData.time.split(':').map(Number);
  
    return {
      fullName: formData.name,
      phone: formData.phone,
      email: formData.email,
      idCardNo: formData.citizenId,
      // Note: dealerId và vehicleId cần được map từ tên sang ID
      // Bạn cần implement logic để lấy ID tương ứng
      // dealerId: getDealerIdByName(formData.dealer),
      // vehicleId: getVehicleIdByModelAndVariant(formData.model, formData.variant),
      date: formData.date,
      hour,
      minute,
      note: formData.note || '',
      agreePolicy: formData.confirmInfo,
    };
  };
  
  export { TestDriveApiError };
  export type { TestDriveBookingRequest, TestDriveBookingResponse, ApiError };