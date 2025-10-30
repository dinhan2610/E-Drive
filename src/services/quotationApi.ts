import { apiClient } from './apiClient';
import { getProfile } from './profileApi';

export interface QuotationRequest {
  vehicleId: number;
  dealerId?: number; // Optional - will be auto-filled from profile if not provided
  includeInsurancePercent: boolean;
  includeWarrantyExtension: boolean;
  includeAccessories: boolean;
  customerFullName: string;
  phone: string;
  email: string;
  street: string;
  ward: string;
  district: string;
  city: string;
  notes: string;
}

// API Response wrapper for list
export interface QuotationListApiResponse {
  statusCode: number;
  message: string;
  data: QuotationResponseData[];
}

// API Response wrapper for single item
export interface QuotationApiResponse {
  statusCode: number;
  message: string;
  data: QuotationResponseData;
}

// Actual quotation data structure from API
export interface QuotationResponseData {
  quotationId: number;
  vehicleId: number;
  vehicleModel: string;
  vehicleImageUrl: string;
  unitPrice: number;
  includeInsurancePercent: boolean;
  includeWarrantyExtension: boolean;
  includeAccessories: boolean;
  discountRate: number;
  discountAmount: number;
  vehicleSubtotal: number;
  serviceTotal: number;
  subtotalAfterDiscount: number;
  taxableBase: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  customerFullName: string;
  phone: string;
  email: string;
  fullAddress: string;
  notes: string;
}

// Legacy interface for backward compatibility (kept for existing code)
export interface QuotationResponse {
  id: number;
  quotationNumber: string;
  vehicleId: number;
  vehicleName?: string;
  vehiclePrice?: number;
  includeInsurancePercent: boolean;
  includeWarrantyExtension: boolean;
  includeAccessories: boolean;
  customerFullName: string;
  phone: string;
  email: string;
  street: string;
  ward: string;
  district: string;
  city: string;
  notes: string;
  totalPrice?: number;
  insuranceCost?: number;
  warrantyCost?: number;
  accessoriesCost?: number;
  createdAt?: string;
  status?: string;
}

export interface QuotationPreviewResponse {
  vehicleId: number;
  vehicleName: string;
  vehiclePrice: number;
  includeInsurancePercent: boolean;
  includeWarrantyExtension: boolean;
  includeAccessories: boolean;
  insuranceCost: number;
  warrantyCost: number;
  accessoriesCost: number;
  totalPrice: number;
  customerFullName: string;
  phone: string;
  email: string;
  street: string;
  ward: string;
  district: string;
  city: string;
  notes: string;
}

/**
 * Create a new quotation
 */
export const createQuotation = async (data: QuotationRequest): Promise<QuotationResponseData> => {
  try {
    // Auto-fill dealerId from profile if not provided
    let requestData = { ...data };
    if (!requestData.dealerId) {
      try {
        const profile = await getProfile();
        requestData.dealerId = profile.dealerId;
      } catch (error) {
        console.warn('⚠️ Could not fetch dealerId from profile, continuing without it:', error);
      }
    }

    const response = await apiClient.post('/quotations', requestData);
    
    if (!response.ok) {
      // Handle 401 specifically
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (response.status === 403) {
        throw new Error('Bạn không có quyền tạo báo giá.');
      }
      
      // Try to parse error message
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Lỗi ${response.status}: Không thể tạo báo giá`);
      } catch {
        throw new Error(`Lỗi ${response.status}: Không thể tạo báo giá`);
      }
    }
    
    const result: QuotationApiResponse = await response.json();
    
    // Extract and return data from wrapper
    // Accept both 200 (OK) and 201 (Created)
    if ((result.statusCode === 200 || result.statusCode === 201) && result.data) {
      return result.data;
    }
    
    throw new Error(result.message || 'Không thể tạo báo giá');
  } catch (error: any) {
    console.error('❌ Error creating quotation:', error);
    throw error;
  }
};

/**
 * Preview quotation before creating (to show calculated prices)
 */
export const previewQuotation = async (data: QuotationRequest): Promise<QuotationPreviewResponse> => {
  try {
    // Auto-fill dealerId from profile if not provided
    let requestData = { ...data };
    if (!requestData.dealerId) {
      try {
        const profile = await getProfile();
        requestData.dealerId = profile.dealerId;
      } catch (error) {
        console.warn('⚠️ Could not fetch dealerId from profile, continuing without it:', error);
      }
    }

    const response = await apiClient.post('/quotations/preview', requestData);
    
    if (!response.ok) {
      // Handle 401 specifically
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (response.status === 403) {
        throw new Error('Bạn không có quyền xem trước báo giá.');
      }
      
      // Try to parse error message
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Lỗi ${response.status}: Không thể xem trước báo giá`);
      } catch {
        throw new Error(`Lỗi ${response.status}: Không thể xem trước báo giá`);
      }
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('❌ Error previewing quotation:', error);
    throw error;
  }
};

/**
 * Get all quotations (list)
 * GET /api/quotations
 */
export const getAllQuotations = async (): Promise<QuotationResponseData[]> => {
  try {
    const response = await apiClient.get('/quotations');
    
    if (!response.ok) {
      if (response.status === 403) {
        console.warn('⚠️ 403 Forbidden - returning empty array');
        return [];
      }
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      throw new Error(`Lỗi ${response.status}: Không thể tải danh sách báo giá`);
    }
    
    const text = await response.text();
    if (!text || text.trim() === '') {
      console.warn('⚠️ Empty response');
      return [];
    }
    
    try {
      const result: QuotationListApiResponse = JSON.parse(text);
      
      if (result.statusCode === 200 && Array.isArray(result.data)) {
        return result.data;
      }
      
      return [];
    } catch (parseError) {
      console.error('❌ Failed to parse JSON');
      return [];
    }
  } catch (error: any) {
    console.error('❌ Error fetching quotations:', error);
    throw error;
  }
};

/**
 * Get quotation by ID (for preview/detail view)
 * GET /api/quotations/{id}
 */
export const getQuotationById = async (id: number): Promise<QuotationResponseData> => {
  try {
    const response = await apiClient.get(`/quotations/${id}`);
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (response.status === 403) {
        throw new Error('Bạn không có quyền xem báo giá này.');
      }
      if (response.status === 404) {
        throw new Error('Không tìm thấy báo giá.');
      }
      throw new Error(`Lỗi ${response.status}: Không thể tải báo giá`);
    }
    
    const result: QuotationApiResponse = await response.json();
    
    if (result.statusCode === 200 && result.data) {
      return result.data;
    }
    
    throw new Error(result.message || 'Không thể tải báo giá');
  } catch (error: any) {
    console.error('❌ Error fetching quotation:', error);
    throw error;
  }
};
