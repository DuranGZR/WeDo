import { apiClient, type ApiClientOptions } from './api-client';
import { useAuthStore } from '@/store/auth-store';

export function authenticatedApiClient<T>(
  path: string,
  options: Omit<ApiClientOptions, 'accessToken' | 'refresh'> = {},
) {
  const { accessToken, refresh } = useAuthStore.getState();
  return apiClient<T>(path, {
    ...options,
    accessToken,
    refresh: async () => {
      const refreshed = await refresh();
      return refreshed ? useAuthStore.getState().accessToken : null;
    },
  });
}
