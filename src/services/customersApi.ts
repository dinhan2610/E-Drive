import type {
  Customer,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  ListCustomersParams,
  ListCustomersResponse
} from '../types/customer';

// Mock data for demo
const mockCustomersData: Customer[] = [
  {
    customerId: 1,
    fullName: 'Nguyễn Minh Hòa',
    dob: '1998-05-12',
    gender: 'Nam',
    email: 'hoa.nguyen@example.com',
    phone: '0909123456',
    address: '12 Lê Lợi, Q1, TP.HCM',
    idCardNo: '079123456789'
  },
  {
    customerId: 2,
    fullName: 'Trần Thị Bình',
    dob: '1995-08-15',
    gender: 'Nữ', 
    email: 'binh.tran@example.com',
    phone: '0908234567',
    address: '45 Nguyễn Huệ, Q1, TP.HCM',
    idCardNo: '079234567890'
  },
  {
    customerId: 3,
    fullName: 'Lê Văn Cường',
    dob: '1990-03-21',
    gender: 'Nam',
    email: 'cuong.le@example.com', 
    phone: '0907345678',
    address: '78 Võ Văn Tần, Q3, TP.HCM',
    idCardNo: '079345678901'
  }
];

// Store for managing customers (simulating database)
let customersStore: Customer[] = [...mockCustomersData];

/**
 * List customers with pagination, search, and filters
 */
export async function listCustomers(params: ListCustomersParams = {}): Promise<ListCustomersResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const {
    page = 1,
    pageSize = 20,
    q = '',
    sort = 'newest'
  } = params;

  // Filter customers
  let filtered = [...customersStore];

  // Search by name, phone, or email
  if (q) {
    const query = q.toLowerCase();
    filtered = filtered.filter((c: Customer) =>
      c.fullName.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      (c.email && c.email.toLowerCase().includes(query))
    );
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sort) {
      case 'newest':
        return b.customerId - a.customerId;
      case 'oldest':
        return a.customerId - b.customerId;
      case 'name_asc':
        return a.fullName.localeCompare(b.fullName);
      case 'name_desc':
        return b.fullName.localeCompare(a.fullName);
      default:
        return 0;
    }
  });

  // Paginate
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = filtered.slice(start, end);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages
  };
}

/**
 * Get customer by ID
 */
export async function getCustomer(id: number): Promise<Customer> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const customer = customersStore.find((c: Customer) => c.customerId === id);
  if (!customer) {
    throw new Error('Customer not found');
  }

  return customer;
}

/**
 * Create new customer
 */
export async function createCustomer(payload: CreateCustomerPayload): Promise<Customer> {
  await new Promise(resolve => setTimeout(resolve, 500));

  const newCustomer: Customer = {
    customerId: customersStore.length + 1,
    ...payload
  };

  customersStore.push(newCustomer);
  return newCustomer;
}

/**
 * Update customer
 */
export async function updateCustomer(id: number, payload: UpdateCustomerPayload): Promise<Customer> {
  await new Promise(resolve => setTimeout(resolve, 500));

  const index = customersStore.findIndex((c: Customer) => c.customerId === id);
  if (index === -1) {
    throw new Error('Customer not found');
  }

  const updatedCustomer: Customer = {
    ...customersStore[index],
    ...payload
  };

  customersStore[index] = updatedCustomer;
  return updatedCustomer;
}

/**
 * Delete customer
 */
export async function deleteCustomer(id: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500));

  const index = customersStore.findIndex((c: Customer) => c.customerId === id);
  if (index === -1) {
    throw new Error('Customer not found');
  }

  customersStore.splice(index, 1);
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
