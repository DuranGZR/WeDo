import { env } from '@/lib/env';

export type ApiError = {
  error?: { code?: string; message?: string; request_id?: string; details?: unknown };
};

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public payload: ApiError,
  ) {
    super(payload.error?.message ?? 'İstek tamamlanamadı.');
  }
}

export type ApiClientOptions = Omit<RequestInit, 'body'> & {
  accessToken?: string | null;
  body?: unknown;
  refresh?: () => Promise<string | null>;
};

export async function apiClient<T>(
  path: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const { accessToken, headers, body, refresh, ...request } = options;
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 15_000);
  let response: Response;

  try {
    response = await fetch(`${env.apiUrl}${path}`, {
      ...request,
      signal: request.signal ?? timeoutController.signal,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      headers: {
        Accept: 'application/json',
        ...(body && !(body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
    });
  } catch (error) {
    if (timeoutController.signal.aborted) {
      throw new Error('Sunucuya bağlanma zaman aşımına uğradı. Lütfen tekrar dene.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let payload: ApiError = {};
    try {
      payload = (await response.json()) as ApiError;
    } catch {
      /* empty error body */
    }
    if (response.status === 401 && accessToken && refresh) {
      const refreshedToken = await refresh();
      if (refreshedToken) {
        return apiClient<T>(path, {
          ...options,
          accessToken: refreshedToken,
          refresh: undefined,
        });
      }
    }
    throw new ApiClientError(response.status, payload);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
