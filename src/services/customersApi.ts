import api from '../lib/apiClient';
import type {
  Customer,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  ListCustomersParams,
  ListCustomersResponse
} from '../types/customer';

/**
 * List customers with pagination, search, and filters
 */
export async function listCustomers(dealerId: number, params: ListCustomersParams = {}): Promise<ListCustomersResponse> {
  try {
    const response = await api.get<ListCustomersResponse>(`/api/dealer/${dealerId}/customers`, { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    throw error;
  }
}

/**
 * Get customer by ID
 */
export async function getCustomer(dealerId: number, id: number): Promise<Customer> {
  try {
    const response = await api.get<Customer>(`/api/dealer/${dealerId}/customers/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch customer ${id}:`, error);
    throw error;
  }
}

/**
 * Create new customer
 */
export async function createCustomer(dealerId: number, payload: CreateCustomerPayload): Promise<Customer> {
  try {
    const response = await api.post<any>(`/api/dealer/${dealerId}/customers`, payload);
    
    // Backend có thể trả về {statusCode, message, data} hoặc trực tiếp Customer object
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Failed to create customer:', error.response?.data?.message || error.message);
    throw error;
  }
}

/**
 * Update customer
 */
export async function updateCustomer(dealerId: number, id: number, payload: UpdateCustomerPayload): Promise<Customer> {
  try {
    const response = await api.put<Customer>(`/api/dealer/${dealerId}/customers/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error(`Failed to update customer ${id}:`, error);
    throw error;
  }
}

/**
 * Delete customer
 */
export async function deleteCustomer(dealerId: number, id: number): Promise<void> {
  try {
    console.log(`🗑️ Attempting to delete customer ${id} for dealer ${dealerId}`);
    await api.delete(`/api/dealer/${dealerId}/customers/${id}`);
    console.log(`✅ Successfully deleted customer ${id}`);
  } catch (error: any) {
    console.error(`❌ Failed to delete customer ${id}:`, error);
    
    // Log chi tiết lỗi từ backend
    if (error.response) {
      console.error('Backend response:', {
        status: error.response.status,
        data: error.response.data,
        message: error.response.data?.message || error.message
      });
      
      // Throw error message từ backend nếu có
      const backendMessage = error.response.data?.message || error.response.data?.error || error.message;
      throw new Error(backendMessage);
    }
    throw error;
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
