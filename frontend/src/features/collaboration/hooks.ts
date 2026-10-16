import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { haptic } from '@/lib/haptics';
import { useLanguageStore } from '@/store/language-store';
import { collaborationApi } from './api';

export function useSpaceMembers(spaceId: string) {
  return useQuery({
    queryKey: ['spaces', spaceId, 'members'],
    queryFn: () => collaborationApi.members(spaceId),
    enabled: Boolean(spaceId),
  });
}

export function useSpaceActivities(spaceId: string) {
  const language = useLanguageStore((state) => state.language);
  return useQuery({
    queryKey: ['spaces', spaceId, 'activities', language],
    queryFn: () => collaborationApi.activities(spaceId),
    enabled: Boolean(spaceId),
  });
}

export function useItemActivities(itemId: string) {
  const language = useLanguageStore((state) => state.language);
  return useQuery({
    queryKey: ['items', itemId, 'activities', language],
    queryFn: () => collaborationApi.activitiesForItem(itemId),
    enabled: Boolean(itemId),
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
    onSuccess: () => {
      haptic.success();
      void client.invalidateQueries({ queryKey: ['items', itemId, 'comments'] });
    },
  });
}

export function useSpacePlans(spaceId: string) {
  return useQuery({
    queryKey: ['spaces', spaceId, 'plans'],
    queryFn: () => collaborationApi.plans(spaceId),
    enabled: Boolean(spaceId),
  });
}

export function useNotifications() {
  const language = useLanguageStore((state) => state.language);
  return useQuery({
    queryKey: ['notifications', language],
    queryFn: () => collaborationApi.notifications(),
  });
}

export function useMarkNotificationRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => collaborationApi.readNotification(id),
    onSuccess: () => {
      haptic.light();
      void client.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
