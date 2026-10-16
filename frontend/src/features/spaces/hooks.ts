import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-keys';
import { useAuthStore } from '@/store/auth-store';
import { useSpaceStore } from '@/store/space-store';
import { spacesApi } from './api';

export function useSpaces() {
  return useQuery({
    queryKey: queryKeys.spaces,
    queryFn: () => spacesApi.list(),
    enabled: Boolean(useAuthStore((state) => state.accessToken)),
  });
}
export function useCreateSpace() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      type,
    }: {
      name: string;
      type:
        'personal' | 'couple' | 'family' | 'friends' | 'roommates' | 'group' | 'other';
    }) => spacesApi.create(name, type),
    onSuccess: (space) => {
      useSpaceStore.getState().setSelectedSpaceId(space.id);
      client.setQueryData(queryKeys.spaces, (old: any) => {
        if (!old || !old.data) {
          return {
            data: [space],
            pagination: { page: 1, page_size: 20, has_more: false },
          };
        }
        const exists = old.data.some((s: any) => s.id === space.id);
        if (exists) return old;
        return { ...old, data: [space, ...old.data] };
      });
      return client.invalidateQueries({ queryKey: queryKeys.spaces });
    },
  });
}
export function useUpdateSpace() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ spaceId, name }: { spaceId: string; name: string }) =>
      spacesApi.update(spaceId, name),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.spaces }),
  });
}
export function useDeleteSpace() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (spaceId: string) => spacesApi.delete(spaceId),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.spaces }),
  });
}
