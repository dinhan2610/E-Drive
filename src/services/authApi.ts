interface RegisterRequest {
  fullName: string;
  email: string;
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
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
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

  // Login API
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('🔐 Đang gửi yêu cầu đăng nhập...', { username: credentials.username });
      
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        body: JSON.stringify(credentials),
      });

      console.log('📡 Response status:', response.status);

      // Parse JSON response
      const apiResponse: ApiResponse<LoginResponseData> = await response.json();
      console.log('📦 API Response:', apiResponse);

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
      console.log('💾 Lưu tokens...');
      tokenManager.setTokens(token, refreshToken || '');

      // Decode JWT để lấy thông tin user (nếu cần)
      // Token format: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.PAYLOAD.SIGNATURE
      let user: any = { username: credentials.username };
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        user = {
          ...payload,
          username: credentials.username,
          fullName: payload.fullName || payload.name || credentials.username
        };
        console.log('👤 User info từ token:', user);
      } catch (e) {
        console.warn('Không thể decode token, sử dụng thông tin mặc định');
      }

      console.log('✅ Đăng nhập thành công!');

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

  // Logout
  async logout(): Promise<void> {
    tokenManager.clearTokens();
    localStorage.removeItem('e-drive-user');
    localStorage.removeItem('isLoggedIn');
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
  }
};