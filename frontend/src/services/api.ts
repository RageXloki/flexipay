import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Access Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('flexipay_access_token') || localStorage.getItem('payflow_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to catch 401 and handle token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && !currentPath.startsWith('/pay/')) {
        localStorage.removeItem('flexipay_access_token');
        localStorage.removeItem('flexipay_refresh_token');
        localStorage.removeItem('flexipay_user');
        localStorage.removeItem('payflow_access_token');
        localStorage.removeItem('payflow_refresh_token');
        localStorage.removeItem('payflow_user');
      }
    }
    return Promise.reject(error);
  }
);

// Helper for generating idempotent transaction keys
export const generateIdempotencyKey = () => {
  return 'idemp_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};
