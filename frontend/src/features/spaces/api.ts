import { authenticatedApiClient } from '@/api/client/authenticated-api-client';
import type { List, Space } from './types';

type Page<T> = {
  data: T[];
  pagination: { page: number; page_size: number; has_more: boolean };
};
export const spacesApi = {
  list: () => authenticatedApiClient<Page<Space>>('/api/v1/spaces?page=1&page_size=50'),
  create: (name: string, type: Space['type']) =>
    authenticatedApiClient<Space>('/api/v1/spaces', {
      method: 'POST',
      body: { name, type },
    }),
  lists: (spaceId: string) =>
    authenticatedApiClient<Page<List>>(
      `/api/v1/spaces/${spaceId}/lists?page=1&page_size=50`,
    ),
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
