import axios from 'axios';

import { API_BASE_URL } from '@/lib/config';
import { getAccessToken } from '@/lib/api/token';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    skipAuth?: boolean;
  }
  interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  if (!config.skipAuth) {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response;
      const errData = data as { error?: { message?: string; code?: string } };
      const message = errData?.error?.message ?? error.message ?? 'Erro na API';
      const code = errData?.error?.code ?? 'ERROR';
      return Promise.reject(new ApiError(status, code, message));
    }
    return Promise.reject(error);
  },
);

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  skipAuth?: boolean;
}

export async function api<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, skipAuth = false } = options;
  const url = path.startsWith('/') ? path : `/${path}`;
  const response = await apiClient.request<T>({
    url,
    method,
    data: body,
    skipAuth,
  } as Parameters<typeof apiClient.request>[0]);
  return response.data;
}
