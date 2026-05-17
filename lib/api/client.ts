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

type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface ApiRequestOptions {
  method?: ApiMethod;
  body?: unknown;
  skipAuth?: boolean;
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const json = (await res.json()) as { error?: { message?: string } };
    return json.error?.message ?? res.statusText;
  } catch {
    return res.statusText || 'Erro na API';
  }
}

export async function api<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, skipAuth = false } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const message = await parseErrorMessage(res);
    let code = 'ERROR';
    try {
      const clone = res.clone();
      const json = (await clone.json()) as { error?: { code?: string } };
      code = json.error?.code ?? code;
    } catch {
      //
    }
    throw new ApiError(res.status, code, message);
  }
  return res.json() as Promise<T>;
}
