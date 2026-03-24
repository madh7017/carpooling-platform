import axios from 'axios';

// Local development can use Vite proxy (/api). Production should use VITE_API_BASE_URL.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

console.log('API Base URL:', API_BASE_URL);

export const getApiUrl = (path = '') => {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (/^https?:\/\//i.test(API_BASE_URL)) {
    return `${API_BASE_URL.replace(/\/+$/, '')}${normalizedPath}`;
  }

  return `${API_BASE_URL.replace(/\/+$/, '')}${normalizedPath}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Optional: dispatch logout action or redirect to login
      window.location.href = '/login';
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
    }

    return Promise.reject(error);
  }
);

export default api;
