import axios from 'axios';
import type {
  Customer,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  ListCustomersParams,
  ListCustomersResponse
} from '../types/customer';

// API base configuration
const baseURL = (import.meta as any).env?.VITE_API_BASE_URL || '';
const http = axios.create({ 
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Mock data for development
const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001',
    fullName: 'Nguyễn Văn An',
    phone: '0901234567',
    email: 'nguyen.van.an@email.com',
    city: 'Hà Nội',
    source: 'Website',
    status: 'POTENTIAL',
    interestedModel: 'Tesla Model S',
    notes: 'Quan tâm đến xe điện cao cấp, có khả năng tài chính tốt.',
    createdAt: '2024-01-15T09:30:00Z',
    updatedAt: '2024-01-20T14:45:00Z',
    testDrives: [
      { id: 'td-001', date: '2024-01-18T10:00:00Z', model: 'Tesla Model S', result: 'Positive' }
    ],
    orders: []
  },
  {
    id: 'cust-002',
    fullName: 'Trần Thị Bình',
    phone: '0912345678',
    email: 'tran.thi.binh@gmail.com',
    city: 'TP. Hồ Chí Minh',
    source: 'Dealer',
    status: 'TEST_DRIVE',
    interestedModel: 'BMW iX',
    notes: 'Đã test drive, đang cân nhắc giữa BMW iX và Mercedes EQS.',
    createdAt: '2024-01-10T14:20:00Z',
    updatedAt: '2024-01-22T11:30:00Z',
    testDrives: [
      { id: 'td-002', date: '2024-01-20T15:30:00Z', model: 'BMW iX', result: 'Interested' }
    ],
    orders: []
  },
  {
    id: 'cust-003',
    fullName: 'Lê Minh Cường',
    phone: '0923456789',
    email: 'le.minh.cuong@company.vn',
    city: 'Đà Nẵng',
    source: 'Facebook',
    status: 'PURCHASED',
    interestedModel: 'Audi e-tron GT',
    notes: 'Đã mua Audi e-tron GT, khách hàng VIP.',
    createdAt: '2023-12-05T08:15:00Z',
    updatedAt: '2024-01-25T16:20:00Z',
    testDrives: [
      { id: 'td-003', date: '2023-12-10T14:00:00Z', model: 'Audi e-tron GT', result: 'Excellent' }
    ],
    orders: [
      { id: 'ord-001', date: '2024-01-05T10:30:00Z', model: 'Audi e-tron GT', amount: 5200000000, status: 'Delivered' }
    ]
  },
  {
    id: 'cust-004',
    fullName: 'Phạm Thu Hằng',
    phone: '0934567890',
    email: 'pham.thu.hang@outlook.com',
    city: 'Hải Phòng',
    source: 'Google Ads',
    status: 'NEED_CONSULTING',
    interestedModel: 'Porsche Taycan',
    notes: 'Mới liên hệ, chưa có lịch hẹn cụ thể.',
    createdAt: '2024-01-28T16:45:00Z',
    updatedAt: '2024-01-28T16:45:00Z',
    testDrives: [],
    orders: []
  },
  {
    id: 'cust-005',
    fullName: 'Hoàng Đức Minh',
    phone: '0945678901',
    email: 'hoang.duc.minh@tech.vn',
    city: 'Cần Thơ',
    source: 'Referral',
    status: 'POTENTIAL',
    interestedModel: 'Mercedes EQS',
    notes: 'Không mua do giá cao, chuyển sang xe hybrid.',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-15T09:20:00Z',
    testDrives: [
      { id: 'td-004', date: '2024-01-08T11:00:00Z', model: 'Mercedes EQS', result: 'Price concern' }
    ],
    orders: []
  },
  {
    id: 'cust-006',
    fullName: 'Đỗ Thị Lan',
    phone: '0956789012',
    city: 'Hà Nội',
    source: 'Exhibition',
    status: 'POTENTIAL',
    interestedModel: 'Tesla Model Y',
    notes: 'Gặp tại triển lãm ô tô 2024, quan tâm Tesla Model Y.',
    createdAt: '2024-01-20T13:30:00Z',
    updatedAt: '2024-01-26T10:15:00Z',
    testDrives: [],
    orders: []
  },
  {
    id: 'cust-007',
    fullName: 'Vũ Quang Huy',
    phone: '0967890123',
    email: 'vu.quang.huy@business.com',
    city: 'TP. Hồ Chí Minh',
    source: 'Cold Call',
    status: 'TEST_DRIVE',
    interestedModel: 'Jaguar I-PACE',
    notes: 'Đã book lịch test drive Jaguar I-PACE vào tuần tới.',
    createdAt: '2024-01-22T09:45:00Z',
    updatedAt: '2024-01-29T14:30:00Z',
    testDrives: [],
    orders: []
  },
  {
    id: 'cust-008',
    fullName: 'Bùi Thị Mai',
    phone: '0978901234',
    email: 'bui.thi.mai@email.com',
    city: 'Bình Dương',
    source: 'Website',
    status: 'NEED_CONSULTING',
    interestedModel: 'Volvo XC40 Recharge',
    notes: 'Đăng ký nhận thông tin qua website.',
    createdAt: '2024-01-30T11:20:00Z',
    updatedAt: '2024-01-30T11:20:00Z',
    testDrives: [],
    orders: []
  }
];

// Helper function to check if we should use mock data
const shouldUseMockData = (): boolean => {
  return !baseURL || baseURL.trim() === '';
};

// Helper function to simulate API delay
const simulateDelay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Helper function to filter and sort customers
const filterAndSortCustomers = (
  customers: Customer[],
  params: ListCustomersParams
): Customer[] => {
  let filtered = [...customers];

  // Search by name, phone, email
  if (params.q) {
    const query = params.q.toLowerCase();
    filtered = filtered.filter(customer =>
      customer.fullName.toLowerCase().includes(query) ||
      customer.phone.includes(query) ||
      customer.email?.toLowerCase().includes(query)
    );
  }

  // Filter by status
  if (params.status && params.status.length > 0) {
    filtered = filtered.filter(customer =>
      params.status!.includes(customer.status)
    );
  }

  // Filter by city
  if (params.city && params.city.length > 0) {
    filtered = filtered.filter(customer =>
      customer.city && params.city!.includes(customer.city)
    );
  }

  // Filter by source
  if (params.source && params.source.length > 0) {
    filtered = filtered.filter(customer =>
      customer.source && params.source!.includes(customer.source)
    );
  }

  // Sort
  if (params.sort) {
    filtered.sort((a, b) => {
      switch (params.sort) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name_asc':
          return a.fullName.localeCompare(b.fullName, 'vi');
        case 'name_desc':
          return b.fullName.localeCompare(a.fullName, 'vi');
        default:
          return 0;
      }
    });
  }

  return filtered;
};

// Helper function to paginate results
const paginateResults = (
  items: Customer[],
  page: number = 1,
  pageSize: number = 10
): { paginatedItems: Customer[]; totalPages: number } => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = items.slice(startIndex, endIndex);
  const totalPages = Math.ceil(items.length / pageSize);

  return { paginatedItems, totalPages };
};

// API Functions
export async function listCustomers(params: ListCustomersParams = {}): Promise<ListCustomersResponse> {
  if (shouldUseMockData()) {
    await simulateDelay();

    const {
      page = 1,
      pageSize = 10
    } = params;

    const filtered = filterAndSortCustomers(MOCK_CUSTOMERS, params);
    const { paginatedItems, totalPages } = paginateResults(filtered, page, pageSize);

    return {
      items: paginatedItems,
      total: filtered.length,
      page,
      pageSize,
      totalPages
    };
  }

  // Real API call
  const response = await http.get<ListCustomersResponse>('/customers', { params });
  return response.data;
}

export async function getCustomer(id: string): Promise<Customer> {
  if (shouldUseMockData()) {
    await simulateDelay();
    
    const customer = MOCK_CUSTOMERS.find(c => c.id === id);
    if (!customer) {
      throw new Error(`Customer with id ${id} not found`);
    }
    return customer;
  }

  // Real API call
  const response = await http.get<Customer>(`/customers/${id}`);
  return response.data;
}

export async function createCustomer(payload: CreateCustomerPayload): Promise<Customer> {
  if (shouldUseMockData()) {
    await simulateDelay();

    const newCustomer: Customer = {
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      testDrives: [],
      orders: []
    };

    // In a real app, this would be managed by a state management solution
    MOCK_CUSTOMERS.unshift(newCustomer);
    
    return newCustomer;
  }

  // Real API call
  const response = await http.post<Customer>('/customers', payload);
  return response.data;
}

export async function updateCustomer(id: string, payload: UpdateCustomerPayload): Promise<Customer> {
  if (shouldUseMockData()) {
    await simulateDelay();

    const customerIndex = MOCK_CUSTOMERS.findIndex(c => c.id === id);
    if (customerIndex === -1) {
      throw new Error(`Customer with id ${id} not found`);
    }

    const updatedCustomer = {
      ...MOCK_CUSTOMERS[customerIndex],
      ...payload,
      updatedAt: new Date().toISOString()
    };

    MOCK_CUSTOMERS[customerIndex] = updatedCustomer;
    
    return updatedCustomer;
  }

  // Real API call
  const response = await http.put<Customer>(`/customers/${id}`, payload);
  return response.data;
}

export async function deleteCustomer(id: string): Promise<void> {
  if (shouldUseMockData()) {
    await simulateDelay();

    const customerIndex = MOCK_CUSTOMERS.findIndex(c => c.id === id);
    if (customerIndex === -1) {
      throw new Error(`Customer with id ${id} not found`);
    }

    MOCK_CUSTOMERS.splice(customerIndex, 1);
    return;
  }

  // Real API call
  await http.delete(`/customers/${id}`);
}

// Additional utility functions
export function generateCustomerId(): string {
  return `cust-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function validatePhone(phone: string): boolean {
  // Vietnamese phone number pattern: starts with 0 or +84, followed by 9-10 digits
  const phoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function formatPhoneNumber(phone: string): string {
  // Format phone number for display: 0901 234 567
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Vài giây trước';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút trước`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ trước`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ngày trước`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} tháng trước`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} năm trước`;
  }
}

// Validation function
export function validateCustomerData(data: any): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Full name validation
  if (!data.fullName?.trim()) {
    errors.fullName = 'Họ và tên là bắt buộc';
  } else if (data.fullName.trim().length < 2) {
    errors.fullName = 'Họ và tên phải có ít nhất 2 ký tự';
  }

  // Email validation
  if (!data.email?.trim()) {
    errors.email = 'Email là bắt buộc';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.email = 'Email không hợp lệ';
    }
  }

  // Phone validation
  if (!data.phoneNumber?.trim()) {
    errors.phoneNumber = 'Số điện thoại là bắt buộc';
  } else {
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    const cleanPhone = data.phoneNumber.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      errors.phoneNumber = 'Số điện thoại không hợp lệ';
    }
  }

  // City validation (optional)
  // City is now optional

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Export mock data for development/testing purposes
export { MOCK_CUSTOMERS };