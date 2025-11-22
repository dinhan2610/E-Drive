// Axios API client with JWT authentication interceptor

import axios from "axios";
import { clearAuthData } from "../utils/authUtils";

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config) => {
    // Try to get token from multiple sources
    const token = accessToken || 
                  localStorage.getItem('accessToken') || 
                  localStorage.getItem('token');
    
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
      const { status } = error.response;
      
      // Handle 401 - unauthorized
      if (status === 401) {
        // Clear token and redirect to home (login modal will appear)
        setAccessToken(null);
        clearAuthData();
        window.location.href = '/';
      }
      
      // Handle 403 - forbidden (silently, handled by caller)
      if (status === 403) {
        // Don't log here - let the calling code decide if this is an error
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
