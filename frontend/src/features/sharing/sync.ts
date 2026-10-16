import { authenticatedApiClient } from '@/api/client/authenticated-api-client';
import { ApiClientError } from '@/api/client/api-client';
import { useAuthStore } from '@/store/auth-store';
import { queryClient } from '@/api/query-client';
import {
  markFailed,
  markPending,
  markProcessing,
  pendingEntries,
  removeEntry,
} from '@/database/outbox';

let syncing = false;

export async function syncOutbox() {
  const ownerId = useAuthStore.getState().user?.id;
  if (!ownerId || syncing) return;
  syncing = true;
  try {
    for (const entry of pendingEntries(ownerId)) {
      if (useAuthStore.getState().user?.id !== ownerId) break;
      // Offline time is not a permanent failure. Retain transient failures until
      // connectivity returns; only an explicit non-retryable API error is final.
      if (entry.type !== 'create_item') continue;
      markProcessing(entry.id);
      try {
        const payload = JSON.parse(entry.payload) as {
          space_id: string;
          list_id: string;
          url?: string;
          sharedText?: string;
        };
        const originalUrl =
          payload.url ?? payload.sharedText?.match(/https?:\/\/\S+/)?.[0];
        if (!originalUrl) {
          markFailed(entry.id);
          continue;
        }
        await authenticatedApiClient('/api/v1/items', {
          method: 'POST',
          body: {
            space_id: payload.space_id,
            list_id: payload.list_id,
            original_url: originalUrl,
            title: payload.sharedText,
            client_item_id: entry.id,
          },
        });
        removeEntry(entry.id);
        void queryClient.invalidateQueries();
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 409)
          removeEntry(entry.id);
        else if (
          error instanceof ApiClientError &&
          [400, 403, 404, 410, 422].includes(error.status)
        )
          markFailed(entry.id);
        else markPending(entry.id);
      }
    }
  } finally {
    syncing = false;
  }
}
