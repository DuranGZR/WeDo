import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-keys';
import { useAuthStore } from '@/store/auth-store';
import { listsApi } from './api';

export function useLists(spaceId: string) {
  return useQuery({
    queryKey: queryKeys.lists(spaceId),
    queryFn: () => listsApi.list(spaceId),
    enabled: Boolean(useAuthStore((state) => state.accessToken) && spaceId),
  });
}
export function useCreateList(spaceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => listsApi.create(spaceId, name),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.lists(spaceId) }),
  });
}

export function useList(listId: string) {
  return useQuery({
    queryKey: ['lists', listId],
    queryFn: () => listsApi.get(listId),
    enabled: Boolean(listId),
  });
}
