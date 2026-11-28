import { authenticatedApiClient } from '@/api/client/authenticated-api-client';
import { allPages } from '@/api/client/paginated-api-client';
import type { List } from './types';

export const listsApi = {
  list: (spaceId: string) => allPages<List>(`/api/v1/spaces/${spaceId}/lists`),
  create: (spaceId: string, name: string, icon?: string) =>
    authenticatedApiClient<List>(`/api/v1/spaces/${spaceId}/lists`, {
      method: 'POST',
      body: icon ? { name, icon } : { name },
    }),
  get: (listId: string) => authenticatedApiClient<List>(`/api/v1/lists/${listId}`),
};
