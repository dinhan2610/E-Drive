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
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại');
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