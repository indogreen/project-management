// src/lib/axiosClient.ts
import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { API_BASE_URL } from './config';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { clearUser } from './stores/user';

// ─── Axios instance ───────────────────────────────────────────────
const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// ─── Request interceptor: sematkan JWT di setiap request ──────────
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (browser) {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        config.headers.set?.('Authorization', `Bearer ${token}`);
      } else {
        config.headers.delete?.('Authorization');
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: silent refresh on 401 ─────────────────
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

/**
 * Setelah token baru didapat, resolve semua request yang sedang antri.
 */
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Hanya handle 401 di browser, bukan dari endpoint /refresh (hindari loop),
    // dan belum pernah di-retry.
    if (
      browser &&
      localStorage.getItem('jwt_token') &&
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      // Jika refresh sedang berjalan, antri request ini
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.set?.('Authorization', `Bearer ${newToken}`);
          return axiosClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Coba refresh token ke backend
        const { data } = await axiosClient.post('/auth/refresh');
        const newToken: string = data.access_token;

        // Simpan token baru
        localStorage.setItem('jwt_token', newToken);

        // Selesaikan semua request yang antri
        processQueue(null, newToken);

        // Retry request awal dengan token baru
        originalRequest.headers.set?.('Authorization', `Bearer ${newToken}`);
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Refresh gagal → bersihkan state & redirect ke login
        processQueue(refreshError, null);
        clearUser();
        const currentPath = window.location.pathname;
        const currentUrl = currentPath + window.location.search;
        const redirectParam =
          currentPath && currentPath !== '/' && !currentPath.startsWith('/auth')
            ? `?redirect=${encodeURIComponent(currentUrl)}`
            : '';
        goto(`/auth/login${redirectParam}`);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
