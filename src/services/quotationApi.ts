import api from '../lib/apiClient';

// ==========================================
// NEW API INTERFACES (matching backend)
// ==========================================

export interface QuotationCreateRequest {
  vehicleId: number;
  customerId: number;
  paymentMethod: 'TRẢ_THẲNG' | 'TRẢ_GÓP';
  additionalServices: {
    hasTintFilm: boolean;
    hasWallboxCharger: boolean;
    hasWarrantyExtension: boolean;
    hasPPF: boolean;
    hasCeramicCoating: boolean;
    has360Camera: boolean;
  };
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
 * Map service IDs to boolean fields for API
 */
export function mapServicesToBoolean(serviceIds: string[]): QuotationCreateRequest['additionalServices'] {
  return {
    hasTintFilm: serviceIds.includes('tint-film'),
    hasWallboxCharger: serviceIds.includes('wallbox-7kw'),
    hasWarrantyExtension: serviceIds.includes('extended-warranty'),
    hasPPF: serviceIds.includes('ppf-full'),
    hasCeramicCoating: serviceIds.includes('ceramic-coating'),
    has360Camera: serviceIds.includes('dashcam-360'),
  };
}
