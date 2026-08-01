import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collaborationApi } from './api';

export function useSpaceMembers(spaceId: string) {
  return useQuery({
    queryKey: ['spaces', spaceId, 'members'],
    queryFn: () => collaborationApi.members(spaceId),
    enabled: Boolean(spaceId),
  });
}

export function useSpaceActivities(spaceId: string) {
  return useQuery({
    queryKey: ['spaces', spaceId, 'activities'],
    queryFn: () => collaborationApi.activities(spaceId),
    enabled: Boolean(spaceId),
  });
}

export function useItemComments(itemId: string) {
  return useQuery({
    queryKey: ['items', itemId, 'comments'],
    queryFn: () => collaborationApi.comments(itemId),
    enabled: Boolean(itemId),
  });
}

export function useCreateComment(itemId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => collaborationApi.createComment(itemId, body),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ['items', itemId, 'comments'] }),
  });
}

export function useSpacePlans(spaceId: string) {
  return useQuery({
    queryKey: ['spaces', spaceId, 'plans'],
    queryFn: () => collaborationApi.plans(spaceId),
    enabled: Boolean(spaceId),
  });
}

export function useSpaceMemories(spaceId: string) {
  return useQuery({
    queryKey: ['spaces', spaceId, 'memories'],
    queryFn: () => collaborationApi.memories(spaceId),
    enabled: Boolean(spaceId),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => collaborationApi.notifications(),
  });
}

export function useMarkNotificationRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => collaborationApi.readNotification(id),
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
