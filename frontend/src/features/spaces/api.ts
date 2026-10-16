import { authenticatedApiClient } from '@/api/client/authenticated-api-client';
import { allPages } from '@/api/client/paginated-api-client';
import type { List, Space } from './types';

export const spacesApi = {
  list: () => allPages<Space>('/api/v1/spaces'),
  create: (name: string, type: Space['type']) =>
    authenticatedApiClient<Space>('/api/v1/spaces', {
      method: 'POST',
      body: { name, type },
    }),
  lists: (spaceId: string) => allPages<List>(`/api/v1/spaces/${spaceId}/lists`),
  update: (spaceId: string, name: string) =>
    authenticatedApiClient<Space>(`/api/v1/spaces/${spaceId}`, {
      method: 'PATCH',
      body: { name },
    }),
  delete: (spaceId: string) =>
    authenticatedApiClient<void>(`/api/v1/spaces/${spaceId}`, {
      method: 'DELETE',
    }),
};
