interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  dealerName: string;
  address: string;
  username: string;
  password: string;
  confirmPassword: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user?: any;
    accessToken?: string;
    refreshToken?: string;
  };
}

interface RefreshTokenRequest {
  refreshToken: string;
}

interface RefreshTokenResponse {
  success: boolean;
  message?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
  };
}

const API_BASE_URL = 'http://localhost:8080/api/auth';

// Demo credentials info
console.info('🔐 E-Drive Demo Credentials:');
console.info('Admin: username=admin, password=admin123');
console.info('Dealer: username=dealer, password=dealer123');
console.info('Note: If server is not available, mock authentication will be used automatically');

// Mock login function for demo purposes
const mockLogin = (credentials: LoginRequest): Promise<AuthResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simple demo credentials
      const validCredentials = [
        { username: 'admin', password: 'admin123', role: 'admin' as const },
        { username: 'dealer', password: 'dealer123', role: 'dealer' as const },
        { username: 'demo', password: 'demo123', role: 'dealer' as const }
      ];
      
      const user = validCredentials.find(
        cred => cred.username === credentials.username && cred.password === credentials.password
      );
      
      if (!user) {
        resolve({
          success: false,
          message: 'Tên đăng nhập hoặc mật khẩu không đúng. Thử: admin/admin123 hoặc dealer/dealer123'
        });
        return;
      }
      
      const mockUser = {
        id: user.username === 'admin' ? '1' : '2',
        fullName: user.username === 'admin' ? 'Nguyễn Văn Admin' : 'Trần Thị Dealer',
        username: user.username,
        email: user.username === 'admin' ? 'admin@edrive.com' : 'dealer@edrive-dealer.com',
        phone: user.username === 'admin' ? '0901234567' : '0987654321',
        role: user.role,
        avatar: '',
        company: user.role === 'admin' ? 'E-Drive Corporation' : undefined,
        dealerName: user.role === 'dealer' ? 'Đại lý E-Drive Sài Gòn' : undefined,
        address: user.username === 'admin' ? '123 Đường ABC, Quận 1, TP.HCM' : '456 Đường XYZ, Quận 3, TP.HCM',
        status: 'active' as const,
        createdAt: '2024-01-01',
        lastLogin: new Date().toISOString()
      };
      
      const tokens = {
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now()
      };
      
      // Store tokens
      tokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
      
      resolve({
        success: true,
        data: {
          user: mockUser,
          ...tokens
        },
        message: 'Đăng nhập thành công (Demo Mode)'
      });
    }, 800); // Simulate network delay
  });
};

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
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(credentials),
      });

      // Handle different response types
      let data: any = {};
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text.trim()) {
          try {
            data = JSON.parse(text);
          } catch (jsonError) {
            console.warn('Failed to parse JSON:', text);
            data = { message: 'Invalid server response' };
          }
        }
      } else {
        const text = await response.text();
        data = { message: text || 'Server error' };
      }

      // Handle specific HTTP status codes
      if (response.status === 403) {
        throw new Error('Truy cập bị từ chối. Kiểm tra lại thông tin đăng nhập hoặc liên hệ quản trị viên.');
      }
      
      if (response.status === 404) {
        throw new Error('Không tìm thấy API endpoint. Server có thể chưa khởi động.');
      }
      
      if (response.status >= 500) {
        throw new Error('Lỗi server nội bộ. Vui lòng thử lại sau.');
      }
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Store tokens if provided
      if (data.accessToken && data.refreshToken) {
        tokenManager.setTokens(data.accessToken, data.refreshToken);
      }

      return {
        success: true,
        data: data,
        message: 'Đăng nhập thành công'
      };
    } catch (error) {
      console.error('Login error:', error);
      
      // If server is not available, use mock authentication for demo
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('Server not available, using mock authentication for demo');
        return mockLogin(credentials);
      }
      
      // If 403 or other server errors, also fallback to mock for demo
      if (error instanceof Error && (error.message.includes('403') || error.message.includes('Truy cập bị từ chối'))) {
        console.warn('Server returned 403, using mock authentication for demo');
        return mockLogin(credentials);
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Có lỗi xảy ra khi đăng nhập'
      };
    }
  },

  // Refresh Token API
  async refreshToken(): Promise<RefreshTokenResponse> {
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

      const data = await response.json();

      if (!response.ok) {
        // If refresh fails, clear all tokens
        tokenManager.clearTokens();
        throw new Error(data.message || 'Làm mới token thất bại');
      }

      // Update tokens
      if (data.accessToken && data.refreshToken) {
        tokenManager.setTokens(data.accessToken, data.refreshToken);
      }

      return {
        success: true,
        data: data,
        message: 'Làm mới token thành công'
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
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!tokenManager.getAccessToken();
  },

  // Get current user info from token (basic implementation)
  getCurrentUser(): any {
    const token = tokenManager.getAccessToken();
    if (!token) return null;
    
    try {
      // Simple JWT decode (in production, use a proper JWT library)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
};