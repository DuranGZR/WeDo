import { authenticatedApiClient } from '@/api/client/authenticated-api-client';
import type { List } from './types';

type Page<T> = {
  data: T[];
  pagination: { page: number; page_size: number; has_more: boolean };
};
export const listsApi = {
  list: (spaceId: string) =>
    authenticatedApiClient<Page<List>>(
      `/api/v1/spaces/${spaceId}/lists?page=1&page_size=50`,
    ),
  create: (spaceId: string, name: string) =>
    authenticatedApiClient<List>(`/api/v1/spaces/${spaceId}/lists`, {
      method: 'POST',
      body: { name },
    }),
  get: (listId: string) => authenticatedApiClient<List>(`/api/v1/lists/${listId}`),
};
