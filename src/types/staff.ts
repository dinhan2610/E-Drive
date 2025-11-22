export interface Staff {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  roles: string[];
  dealerId?: number;
  dealerName?: string;
  verified?: boolean;
  active?: boolean;
}

export interface CreateStaffPayload {
  username: string;
  password: string;
  email: string;
  phone: string;
  fullName: string;
}

export interface UpdateStaffPayload {
  email?: string;
  phone?: string;
  fullName?: string;
}

export interface StaffFormData {
  username: string;
  password: string;
  email: string;
  phone: string;
  fullName: string;
}

export interface ListStaffResponse {
  statusCode: number;
  message: string;
  data: Staff[];
}

export interface StaffResponse {
  statusCode: number;
  message: string;
  data: Staff;
}

export const STAFF_ROLES = [
  { value: 'DEALER_STAFF', label: 'Nhân viên' },
  { value: 'DEALER_MANAGER', label: 'Quản lý' }
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
];
