import { setAccessToken } from '../lib/apiClient';
import { clearAuthData } from '../utils/authUtils';

interface RegisterRequest {
  fullName: string;
  dealerEmail: string; // Backend field name (changed from email)
  phone: string;
  dealerName: string;
  houseNumberAndStreet: string;
  wardOrCommune: string;
  district: string;
  provinceOrCity: string;
  username: string;
  password: string;
  confirmPassword: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// API Response format từ backend
interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
}

interface LoginResponseData {
  token: string;
  refreshToken: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user?: any;
    token?: string;
    refreshToken?: string;
  };
}

const API_BASE_URL = 'http://localhost:8080/api/auth';

// Token management
const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const tokenManager = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  setAccessToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  
  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  
  setRefreshToken: (token: string): void => {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  
  clearTokens: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  
  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const authApi = {
  // Register API
  async register(userData: RegisterRequest | FormData): Promise<AuthResponse> {
    try {
      const isFormData = userData instanceof FormData;
      
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: isFormData ? {} : {
          'Content-Type': 'application/json',
        },
        body: isFormData ? userData : JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng ký thất bại');
      }

      return {
        success: true,
        data: data,
        message: 'Đăng ký thành công'
      };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Có lỗi xảy ra khi đăng ký'
      };
    }
  },

  // Register API with file upload (multipart/form-data with URL params)
  async registerWithFile(formData: FormData, queryParams: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/register?${queryParams}`, {
        method: 'POST',
        headers: {
          'Accept': '*/*',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng ký thất bại');
      }

      return {
        success: true,
        data: data,
        message: 'Đăng ký thành công'
      };
    } catch (error) {
      console.error('Register with file error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Có lỗi xảy ra khi đăng ký'
      };
    }
  },

  // Login API
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        body: JSON.stringify(credentials),
      });

      // Parse JSON response
      const apiResponse: ApiResponse<LoginResponseData> = await response.json();

      // Kiểm tra response status
      if (response.status !== 200 || apiResponse.statusCode !== 200) {
        throw new Error(apiResponse.message || 'Đăng nhập thất bại');
      }

      // Lấy token từ response
      const { token, refreshToken } = apiResponse.data || {};

      if (!token) {
        throw new Error('Không nhận được token từ server');
      }

      // Lưu tokens vào localStorage
      tokenManager.setTokens(token, refreshToken || '');

      // Decode JWT để lấy thông tin user (bao gồm role)
      let user: any = { username: credentials.username };
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Parse role từ JWT - có thể là 'role', 'roles', hoặc 'authorities'
        let role = payload.role || payload.roles?.[0] || payload.authorities?.[0] || 'dealer';
        
        // Chuẩn hóa role: "ROLE_DEALER_MANAGER" -> "dealer_manager"
        // Frontend sẽ normalize thêm: "dealer_manager" -> "dealer"
        if (role && typeof role === 'string') {
          role = role.replace('ROLE_', '').toLowerCase();
        }
        
        user = {
          ...payload,
          username: credentials.username,
          fullName: payload.fullName || payload.name || credentials.username,
          role: role
        };
      } catch (e) {
        console.warn('Không thể decode token, sử dụng thông tin mặc định');
      }

      return {
        success: true,
        message: apiResponse.message || 'Đăng nhập thành công',
        data: {
          user,
          token,
          refreshToken: refreshToken || ''
        }
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Có lỗi xảy ra khi đăng nhập'
      };
    }
  },

  // Refresh Token API
  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('Không tìm thấy refresh token');
      }

      const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const apiResponse: ApiResponse<LoginResponseData> = await response.json();

      if (!response.ok || apiResponse.statusCode !== 200) {
        tokenManager.clearTokens();
        throw new Error(apiResponse.message || 'Làm mới token thất bại');
      }

      const { token, refreshToken: newRefreshToken } = apiResponse.data || {};

      if (token && newRefreshToken) {
        tokenManager.setTokens(token, newRefreshToken);
      }

      return {
        success: true,
        data: {
          token,
          refreshToken: newRefreshToken
        },
        message: apiResponse.message || 'Làm mới token thành công'
      };
    } catch (error) {
      console.error('Refresh token error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Có lỗi xảy ra khi làm mới token'
      };
    }
  },

  // Logout - Call server API and clear local data
  async logout(): Promise<void> {
    try {
      const token = tokenManager.getAccessToken();
      
      if (token) {
        // Call logout API to invalidate token on server
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ Logout API failed (continuing anyway):', error);
      // Continue with local cleanup even if API fails
    } finally {
      // Always clear local data
      clearAuthData();
      setAccessToken(null);
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!tokenManager.getAccessToken();
  },

  // Get current user info from token
  getCurrentUser(): any {
    const token = tokenManager.getAccessToken();
    if (!token) return null;
    
    try {
      // Decode JWT payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  },

  // Change Password API
  async changePassword(passwordData: ChangePasswordRequest): Promise<AuthResponse> {
    try {
      const token = tokenManager.getAccessToken();
      
      if (!token) {
        throw new Error('Bạn chưa đăng nhập');
      }


      const response = await fetch(`${API_BASE_URL}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*'
        },
        body: JSON.stringify(passwordData),
      });


      const apiResponse: ApiResponse = await response.json();

      if (!response.ok || apiResponse.statusCode !== 200) {
        throw new Error(apiResponse.message || 'Đổi mật khẩu thất bại');
      }

      return {
        success: true,
        message: apiResponse.message || 'Đổi mật khẩu thành công'
      };
    } catch (error) {
      console.error('❌ Change password error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Có lỗi xảy ra khi đổi mật khẩu'
      };
    }
  }
};