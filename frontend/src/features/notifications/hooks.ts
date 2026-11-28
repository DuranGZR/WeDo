import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-keys';
import { collaborationApi } from '@/features/collaboration/api';
import { useAuthStore } from '@/store/auth-store';

export function useUnreadNotificationCount() {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: () => collaborationApi.unreadCount(),
    enabled: Boolean(accessToken),
    refetchInterval: 45_000,
    select: (res) => res.count,
  });
}
