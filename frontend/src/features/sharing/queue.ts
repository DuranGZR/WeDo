import { enqueue } from '@/database/outbox';
import type { SharePayload } from './types';
import { useAuthStore } from '@/store/auth-store';
import { t } from '@/i18n';

export function queueShare(payload: SharePayload, spaceId: string, listId: string) {
  const ownerId = useAuthStore.getState().user?.id;
  if (!ownerId) throw new Error(t('common.noActiveSession'));
  return enqueue(
    'create_item',
    { ...payload, space_id: spaceId, list_id: listId },
    ownerId,
  );
}
