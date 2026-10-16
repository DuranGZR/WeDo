import { apiClient, type ApiClientOptions } from './api-client';
import { useAuthStore } from '@/store/auth-store';

export function authenticatedApiClient<T>(
  path: string,
  options: Omit<ApiClientOptions, 'accessToken' | 'refresh'> = {},
): Promise<T> {
  const { accessToken, refresh, user } = useAuthStore.getState();
  return apiClient<T>(path, {
    ...options,
    accessToken,
    refresh: async (): Promise<string | null> => {
      if (useAuthStore.getState().user?.id !== user?.id) return null;
      const latestToken = useAuthStore.getState().accessToken;
      // Another request may already have rotated the expired access token.
      if (latestToken !== accessToken) return latestToken;
      const refreshed = await refresh();
      return refreshed ? useAuthStore.getState().accessToken : null;
    },
  });
}
