import { enqueue } from '@/database/outbox';
import type { SharePayload } from './types';

export function queueShare(payload: SharePayload, spaceId: string, listId: string) {
  return enqueue('create_item', { ...payload, space_id: spaceId, list_id: listId });
}
