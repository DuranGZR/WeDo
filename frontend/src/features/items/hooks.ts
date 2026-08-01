import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-keys';
import { useAuthStore } from '@/store/auth-store';
import { itemsApi } from './api';
import type { Item } from './types';

const METADATA_REFRESH_INTERVAL_MS = 2_000;

export function metadataRefreshInterval(items: Item[] | undefined): number | false {
  return items?.some(
    (item) => item.metadata_status === 'pending' || item.metadata_status === 'processing',
  )
    ? METADATA_REFRESH_INTERVAL_MS
    : false;
}

export function useItems(listId: string) {
  return useQuery({
    queryKey: queryKeys.items(listId),
    queryFn: () => itemsApi.list(listId),
    enabled: Boolean(useAuthStore((state) => state.accessToken) && listId),
    refetchOnMount: 'always',
    refetchInterval: (query) => metadataRefreshInterval(query.state.data?.data),
  });
}
export function useItem(itemId: string) {
  return useQuery({
    queryKey: queryKeys.item(itemId),
    queryFn: () => itemsApi.get(itemId),
    enabled: Boolean(useAuthStore((state) => state.accessToken) && itemId),
  });
}
export function useCreateItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      space_id: string;
      list_id: string;
      original_url: string;
      title?: string;
    }) => itemsApi.create(input),
    onSuccess: (_item, input) => {
      void client.invalidateQueries({ queryKey: queryKeys.items(input.list_id) });
      void client.invalidateQueries({ queryKey: queryKeys.lists(input.space_id) });
    },
  });
}

export function useMoveItem(itemId: string, sourceListId: string, spaceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (targetListId: string) => itemsApi.move(itemId, targetListId),
    onSuccess: (_item, targetListId) => {
      void client.invalidateQueries({ queryKey: queryKeys.items(sourceListId) });
      void client.invalidateQueries({ queryKey: queryKeys.items(targetListId) });
      void client.invalidateQueries({ queryKey: queryKeys.item(itemId) });
      void client.invalidateQueries({ queryKey: queryKeys.lists(spaceId) });
    },
  });
}

export function useCompleteItem(itemId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => itemsApi.complete(itemId),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.item(itemId) });
    },
  });
}

export function useRestoreItem(itemId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => itemsApi.restore(itemId),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.item(itemId) });
    },
  });
}

export function useDeleteItem(itemId: string, listId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => itemsApi.remove(itemId),
    onSuccess: () => {
      if (listId) {
        void client.invalidateQueries({ queryKey: queryKeys.items(listId) });
      }
      void client.invalidateQueries({ queryKey: queryKeys.item(itemId) });
    },
  });
}
