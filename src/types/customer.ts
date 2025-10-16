export type CustomerStatus = "POTENTIAL" | "TEST_DRIVE" | "NEED_CONSULTING" | "PURCHASED";

export interface Customer {
  id?: string;
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  source?: string;        // kênh: Website, Dealer, Referral...
  status: CustomerStatus; // NEW/QUALIFIED/TEST_DRIVE/WON/LOST
  interestedModel?: string;
  notes?: string;
  createdAt: string;      // ISO
  updatedAt: string;      // ISO
  // optional relations for detail view:
  testDrives?: Array<{ id: string; date: string; model: string; result?: string }>;
  orders?: Array<{ id: string; date: string; model: string; amount: number; status: string }>;
}

export interface CreateCustomerPayload {
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  source?: string;
  status: CustomerStatus;
  interestedModel?: string;
  notes?: string;
}

export interface UpdateCustomerPayload extends Partial<CreateCustomerPayload> {}

export interface CustomerFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  address?: string;
  interestedModel?: string;
  notes?: string;
  status: CustomerStatus;
}

export interface ListCustomersParams {
  q?: string;           // search query
  page?: number;        // page number (1-based)
  pageSize?: number;    // items per page
  status?: CustomerStatus[];   // filter by status
  city?: string[];      // filter by city
  source?: string[];    // filter by source
  sort?: "newest" | "oldest" | "name_asc" | "name_desc";
}

export interface ListCustomersResponse {
  items: Customer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Status badge configurations
export const CUSTOMER_STATUS_CONFIG = {
  POTENTIAL: {
    label: 'Tiềm năng',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#DBEAFE'
  },
  TEST_DRIVE: {
    label: 'Lái thử',
    color: '#7C3AED',
    bgColor: '#F3E8FF',
    borderColor: '#E9D5FF'
  },
  NEED_CONSULTING: {
    label: 'Cần tư vấn',
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FED7AA'
  },
  PURCHASED: {
    label: 'Đã mua',
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#D1FAE5'
  }
} as const;

// Source options
export const CUSTOMER_SOURCES = [
  'Website',
  'Dealer',
  'Referral',
  'Facebook',
  'Google Ads',
  'Exhibition',
  'Cold Call',
  'Other'
] as const;

// Cities in Vietnam
export const VIETNAM_CITIES = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'An Giang',
  'Bà Rịa - Vũng Tàu',
  'Bắc Giang',
  'Bắc Kạn',
  'Bạc Liêu',
  'Bắc Ninh',
  'Bến Tre',
  'Bình Định',
  'Bình Dương',
  'Bình Phước',
  'Bình Thuận',
  'Cà Mau',
  'Cao Bằng',
  'Đắk Lắk',
  'Đắk Nông',
  'Điện Biên',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Giang',
  'Hà Nam',
  'Hà Tĩnh',
  'Hải Dương',
  'Hậu Giang',
  'Hòa Bình',
  'Hưng Yên',
  'Khánh Hòa',
  'Kiên Giang',
  'Kon Tum',
  'Lai Châu',
  'Lâm Đồng',
  'Lạng Sơn',
  'Lào Cai',
  'Long An',
  'Nam Định',
  'Nghệ An',
  'Ninh Bình',
  'Ninh Thuận',
  'Phú Thọ',
  'Phú Yên',
  'Quảng Bình',
  'Quảng Nam',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quảng Trị',
  'Sóc Trăng',
  'Sơn La',
  'Tây Ninh',
  'Thái Bình',
  'Thái Nguyên',
  'Thanh Hóa',
  'Thừa Thiên Huế',
  'Tiền Giang',
  'Trà Vinh',
  'Tuyên Quang',
  'Vĩnh Long',
  'Vĩnh Phúc',
  'Yên Bái'
] as const;