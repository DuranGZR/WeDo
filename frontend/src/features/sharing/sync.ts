import { authenticatedApiClient } from '@/api/client/authenticated-api-client';
import {
  markFailed,
  markPending,
  markProcessing,
  pendingEntries,
  removeEntry,
} from '@/database/outbox';

export async function syncOutbox() {
  for (const entry of pendingEntries()) {
    if (entry.type !== 'create_item' || entry.attempts >= 5) {
      if (entry.attempts >= 5) markFailed(entry.id);
      continue;
    }
    markProcessing(entry.id);
    try {
      const payload = JSON.parse(entry.payload) as {
        space_id: string;
        list_id: string;
        url?: string;
        sharedText?: string;
      };
      const originalUrl = payload.url ?? payload.sharedText;
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
        },
      });
      removeEntry(entry.id);
    } catch {
      markPending(entry.id);
    }
  }
}
