// Axios API client with JWT authentication interceptor

import axios from "axios";

// Get token from localStorage dynamically
export const getAccessToken = () => {
  return localStorage.getItem('accessToken') || localStorage.getItem('token');
};

export const setAccessToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
  }
};

const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, config } = error.response;
      
      // Handle 401 - unauthorized
      if (status === 401) {
        console.error('❌ 401 Unauthorized on:', config?.url);
        
        // Clear tokens
        setAccessToken(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          console.log('🔄 Redirecting to login...');
          // Use setTimeout to avoid redirect during render
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }
      
      // Handle 403 - forbidden
      if (status === 403) {
        console.error('❌ 403 Access forbidden:', config?.url);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
