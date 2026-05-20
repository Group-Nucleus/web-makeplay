import axios from 'axios';

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

export const apiClient = axios.create({
  baseURL: '/v1',
  headers: { Accept: 'application/json' },
  withCredentials: true,
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
