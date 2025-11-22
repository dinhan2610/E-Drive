import api from '../lib/apiClient';

// ==========================================
// NEW API INTERFACES (matching backend)
// ==========================================

export interface QuotationCreateRequest {
  vehicleId: number;
  customerId: number;
  selectedServiceIds: number[];
  selectedPromotionIds: number[];
}

export interface QuotationResponse {
  quotationId: number;
  dealerId: number;
  dealerName?: string;
  createdByUserName?: string;
  vehicleId: number;
  modelName?: string;
  version?: string;
  batteryCapacityKwh?: number;
  rangeKm?: number;
  maxSpeedKmh?: number;
  chargingTimeHours?: number;
  seatingCapacity?: number;
  motorPowerKw?: number;
  weightKg?: number;
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  imageUrl?: string;
  manufactureYear?: number;
  vehicleStatus?: string;
  customerId: number;
  customerFullName?: string;
  customerDob?: string;
  customerGender?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerIdCardNo?: string;
  paymentMethod: string;
  quotationStatus?: string;
  additionalServices: {
    hasTintFilm: boolean;
    tintFilmPrice?: number;
    hasWallboxCharger: boolean;
    wallboxChargerPrice?: number;
    hasWarrantyExtension: boolean;
    warrantyExtensionPrice?: number;
    hasPPF: boolean;
    ppfPrice?: number;
    hasCeramicCoating: boolean;
    ceramicCoatingPrice?: number;
    has360Camera: boolean;
    camera360Price?: number;
    totalServicesPrice?: number;
  };
  unitPrice?: number;
  promotionDiscountAmount?: number;
  additionalServicesTotal?: number;
  vatAmount?: number | null;
  grandTotal?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

/**
 * Create new quotation
 */
export async function createQuotation(request: QuotationCreateRequest): Promise<QuotationResponse> {
  console.log('📝 Creating quotation:', request);
  
  try {
    const { data } = await api.post<ApiResponse<QuotationResponse>>('/api/quotations/create', request);
    
    console.log('✅ Quotation created:', data);
    return data.data;
  } catch (error: any) {
    console.error('❌ Create quotation error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get all quotations
 */
export async function listQuotations(): Promise<QuotationResponse[]> {
  console.log('📋 Fetching quotations list');
  
  try {
    const { data } = await api.get<ApiResponse<QuotationResponse[]>>('/api/quotations');
    
    console.log('✅ Quotations fetched:', data);
    return data.data;
  } catch (error: any) {
    console.error('❌ List quotations error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get quotation by ID
 */
export async function getQuotation(id: number): Promise<QuotationResponse> {
  console.log('🔍 Fetching quotation:', id);
  
  try {
    const { data } = await api.get<ApiResponse<QuotationResponse>>(`/api/quotations/${id}`);
    
    console.log('✅ Quotation fetched:', data);
    return data.data;
  } catch (error: any) {
    console.error('❌ Get quotation error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Preview quotation PDF
 */
export async function previewQuotationPDF(id: number): Promise<Blob> {
  console.log('👁️ Previewing quotation PDF:', id);
  
  try {
    const { data } = await api.get<Blob>(`/api/quotations/${id}/preview-pdf`, {
      responseType: 'blob'
    });
    
    console.log('✅ PDF preview fetched');
    return data;
  } catch (error: any) {
    console.error('❌ Preview PDF error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Export quotation PDF
 */
export async function exportQuotationPDF(id: number): Promise<Blob> {
  console.log('📥 Exporting quotation PDF:', id);
  
  try {
    const { data } = await api.get<Blob>(`/api/quotations/${id}/export-pdf`, {
      responseType: 'blob'
    });
    
    console.log('✅ PDF exported');
    return data;
  } catch (error: any) {
    console.error('❌ Export PDF error:', error.response?.data || error.message);
    throw error;
  }
}
