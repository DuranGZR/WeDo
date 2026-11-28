import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { haptic } from '@/lib/haptics';
import { useAuthStore } from '@/store/auth-store';
import { useLanguageStore } from '@/store/language-store';
import { collaborationApi } from './api';

export function useSpaceMembers(spaceId: string) {
  const isSignedIn = useAuthStore((state) =>
    Boolean(state.user?.id || state.accessToken),
  );
  return useQuery({
    queryKey: ['spaces', spaceId, 'members'],
    queryFn: () => collaborationApi.members(spaceId),
    enabled: Boolean(isSignedIn && spaceId),
  });
}

export function useSpaceActivities(spaceId: string) {
  const language = useLanguageStore((state) => state.language);
  const isSignedIn = useAuthStore((state) =>
    Boolean(state.user?.id || state.accessToken),
  );
  return useQuery({
    queryKey: ['spaces', spaceId, 'activities', language],
    queryFn: () => collaborationApi.activities(spaceId),
    enabled: Boolean(isSignedIn && spaceId),
  });
}

export function useItemActivities(itemId: string) {
  const language = useLanguageStore((state) => state.language);
  const isSignedIn = useAuthStore((state) =>
    Boolean(state.user?.id || state.accessToken),
  );
  return useQuery({
    queryKey: ['items', itemId, 'activities', language],
    queryFn: () => collaborationApi.activitiesForItem(itemId),
    enabled: Boolean(isSignedIn && itemId),
  });
}

export function useItemComments(itemId: string) {
  const isSignedIn = useAuthStore((state) =>
    Boolean(state.user?.id || state.accessToken),
  );
  return useQuery({
    queryKey: ['items', itemId, 'comments'],
    queryFn: () => collaborationApi.comments(itemId),
    enabled: Boolean(isSignedIn && itemId),
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

export function useUpdateComment(itemId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      collaborationApi.updateComment(commentId, body),
    onSuccess: () => {
      haptic.success();
      void client.invalidateQueries({ queryKey: ['items', itemId, 'comments'] });
    },
  });
}

export function useDeleteComment(itemId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => collaborationApi.deleteComment(commentId),
    onSuccess: () => {
      haptic.success();
      void client.invalidateQueries({ queryKey: ['items', itemId, 'comments'] });
    },
  });
}

export function useSpacePlans(spaceId: string) {
  const isSignedIn = useAuthStore((state) =>
    Boolean(state.user?.id || state.accessToken),
  );
  return useQuery({
    queryKey: ['spaces', spaceId, 'plans'],
    queryFn: () => collaborationApi.plans(spaceId),
    enabled: Boolean(isSignedIn && spaceId),
  });
}

export function useNotifications() {
  const language = useLanguageStore((state) => state.language);
  const isSignedIn = useAuthStore((state) =>
    Boolean(state.user?.id || state.accessToken),
  );
  return useQuery({
    queryKey: ['notifications', language],
    queryFn: () => collaborationApi.notifications(),
    enabled: isSignedIn,
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
