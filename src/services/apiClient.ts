import { authApi, tokenManager } from './authApi';

// HTTP request interceptor with automatic token refresh
export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:8080/api') {
    this.baseURL = baseURL;
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Add authorization header if token exists
    // Support both 'accessToken' (new) and 'token' (old) keys for backward compatibility
    const accessToken = localStorage.getItem('accessToken');
    const legacyToken = localStorage.getItem('token');
    const managerToken = tokenManager.getAccessToken();
    const token = managerToken || accessToken || legacyToken;
    
    // Check if token is required (all endpoints except public ones)
    const publicEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
    const isPublicEndpoint = publicEndpoints.some(pe => endpoint.includes(pe));
    
    if (!token && !isPublicEndpoint) {
      console.error('❌ No token found! Cannot make authenticated request.');
      throw new Error('Vui lòng đăng nhập để sử dụng tính năng này.');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` })
    };

    try {
      // Make the initial request
      let response = await fetch(url, {
        ...options,
        headers
      });

      // If unauthorized and we have a refresh token, try to refresh
      if (response.status === 401 && tokenManager.getRefreshToken()) {
        const refreshResult = await authApi.refreshToken();
        
        if (refreshResult.success) {
          // Retry the original request with new token
          const newToken = tokenManager.getAccessToken();
          response = await fetch(url, {
            ...options,
            headers: {
              ...headers,
              ...(newToken && { Authorization: `Bearer ${newToken}` })
            }
          });
        } else {
          // Refresh failed, redirect to login
          throw new Error('Session expired. Please login again.');
        }
      }

      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Convenience methods
  async get(endpoint: string, options?: RequestInit): Promise<Response> {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint: string, data?: any, options?: RequestInit): Promise<Response> {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put(endpoint: string, data?: any, options?: RequestInit): Promise<Response> {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete(endpoint: string, options?: RequestInit): Promise<Response> {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create a default instance
export const apiClient = new ApiClient();

// Helper function for handling API responses
export const handleApiResponse = async <T>(response: Response): Promise<{
  success: boolean;
  data?: T;
  message?: string;
}> => {
  try {
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    return {
      success: true,
      data: data,
      message: 'Success'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to parse response'
    };
  }
};