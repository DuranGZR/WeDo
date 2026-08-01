import { authenticatedApiClient } from '@/api/client/authenticated-api-client';
import type { Item } from './types';

type Page<T> = {
  data: T[];
  pagination: { page: number; page_size: number; has_more: boolean };
};
export const itemsApi = {
  list: (listId: string) =>
    authenticatedApiClient<Page<Item>>(
      `/api/v1/lists/${listId}/items?page=1&page_size=50`,
    ),
  get: (itemId: string) => authenticatedApiClient<Item>(`/api/v1/items/${itemId}`),
  create: (input: {
    space_id: string;
    list_id: string;
    original_url: string;
    title?: string;
  }) => authenticatedApiClient<Item>('/api/v1/items', { method: 'POST', body: input }),
  move: (itemId: string, listId: string) =>
    authenticatedApiClient<Item>(`/api/v1/items/${itemId}/move`, {
      method: 'POST',
      body: { list_id: listId },
    }),
  complete: (itemId: string) =>
    authenticatedApiClient<Item>(`/api/v1/items/${itemId}/complete`, {
      method: 'POST',
    }),
  restore: (itemId: string) =>
    authenticatedApiClient<Item>(`/api/v1/items/${itemId}/restore`, {
      method: 'POST',
    }),
  remove: (itemId: string) =>
    authenticatedApiClient<void>(`/api/v1/items/${itemId}`, {
      method: 'DELETE',
    }),
};
