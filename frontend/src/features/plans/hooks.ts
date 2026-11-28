import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-keys';
import { collaborationApi } from '@/features/collaboration/api';
import { haptic } from '@/lib/haptics';
import { useAuthStore } from '@/store/auth-store';

export function useSpacePlans(spaceId: string) {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: queryKeys.plans(spaceId),
    queryFn: () => collaborationApi.plans(spaceId),
    enabled: Boolean(accessToken && spaceId),
  });
}

export function useCreatePlan(spaceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      space_id: string;
      item_id: string;
      scheduled_at: string;
      timezone?: string;
      note?: string;
      reminder_minutes_before?: number;
    }) => collaborationApi.createPlan(body),
    onSuccess: (_plan, input) => {
      haptic.success();
      void client.invalidateQueries({ queryKey: queryKeys.plans(spaceId) });
      void client.invalidateQueries({ queryKey: queryKeys.item(input.item_id) });
      void client.invalidateQueries({ queryKey: ['items'] });
      void client.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function useUpdatePlan(spaceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      planId,
      body,
    }: {
      planId: string;
      body: {
        scheduled_at?: string;
        timezone?: string;
        reminder_minutes_before?: number | null;
      };
    }) => collaborationApi.updatePlan(planId, body),
    onSuccess: (updated) => {
      haptic.success();
      void client.invalidateQueries({ queryKey: queryKeys.plans(spaceId) });
      void client.invalidateQueries({ queryKey: queryKeys.item(updated.item_id) });
      void client.invalidateQueries({ queryKey: ['items'] });
      void client.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function usePlanAction(spaceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      planId,
      action,
    }: {
      planId: string;
      action: 'approve' | 'reject' | 'cancel' | 'complete';
    }) => collaborationApi.planAction(planId, action),
    onSuccess: (updated, input) => {
      if (input.action === 'reject' || input.action === 'cancel') {
        haptic.warning();
      } else {
        haptic.success();
      }
      void client.invalidateQueries({ queryKey: queryKeys.plans(spaceId) });
      if (updated?.item_id) {
        void client.invalidateQueries({ queryKey: queryKeys.item(updated.item_id) });
      }
      void client.invalidateQueries({ queryKey: ['items'] });
      void client.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}
