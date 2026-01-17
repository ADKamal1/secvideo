import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { deviceFingerprintService } from '../security/deviceFingerprint';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Custom Axios instance with authentication and device fingerprint headers
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    const token = localStorage.getItem('auth-storage');
    if (token) {
      try {
        const parsed = JSON.parse(token);
        if (parsed.state?.token) {
          config.headers.Authorization = `Bearer ${parsed.state.token}`;
        }
      } catch {
        // Invalid stored data
      }
    }

    // Add device fingerprint hash to all requests
    try {
      const deviceHash = await deviceFingerprintService.getDeviceHash();
      config.headers['X-Device-Hash'] = deviceHash;
    } catch (error) {
      console.error('Failed to get device hash:', error);
    }

    // Add timestamp to prevent replay attacks
    config.headers['X-Request-Time'] = Date.now().toString();

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;

    // Handle specific error codes
    if (status === 401) {
      // Unauthorized - clear auth and redirect to login
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    } else if (status === 403) {
      // Forbidden - might be device mismatch or session issue
      const data = error.response?.data as { code?: string };
      if (data?.code === 'DEVICE_MISMATCH') {
        window.location.href = '/device-verify';
      } else if (data?.code === 'SESSION_EXPIRED') {
        localStorage.removeItem('auth-storage');
        window.location.href = '/login?expired=true';
      }
    } else if (status === 429) {
      // Rate limited
      console.warn('Rate limited. Please slow down.');
    }

    return Promise.reject(error);
  }
);

export { apiClient };

// Type-safe API methods
export const api = {
  get: <T>(url: string, config?: Parameters<typeof apiClient.get>[1]) =>
    apiClient.get<T>(url, config).then((res) => res.data),
  
  post: <T>(url: string, data?: unknown, config?: Parameters<typeof apiClient.post>[2]) =>
    apiClient.post<T>(url, data, config).then((res) => res.data),
  
  put: <T>(url: string, data?: unknown, config?: Parameters<typeof apiClient.put>[2]) =>
    apiClient.put<T>(url, data, config).then((res) => res.data),
  
  patch: <T>(url: string, data?: unknown, config?: Parameters<typeof apiClient.patch>[2]) =>
    apiClient.patch<T>(url, data, config).then((res) => res.data),
  
  delete: <T>(url: string, config?: Parameters<typeof apiClient.delete>[1]) =>
    apiClient.delete<T>(url, config).then((res) => res.data),
};

