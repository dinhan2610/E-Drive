// Axios API client with JWT authentication interceptor

import axios from "axios";

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
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
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
        // Clear token and redirect to login
        setAccessToken(null);
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
      
      // Handle 403 - forbidden
      if (status === 403) {
        console.error('Access forbidden');
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
