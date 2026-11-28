import { database } from './client';

const webOutbox = new Map<string, OutboxEntry>();
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // Never let a listener failure break database persistence.
    }
  }
}

export function subscribeOutbox(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export type OutboxEntry = {
  id: string;
  type: string;
  payload: string;
  status: 'pending' | 'processing' | 'failed';
  attempts: number;
  created_at: string;
  owner_id: string;
};

export function enqueue(type: string, payload: unknown, ownerId: string) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  if (!database) {
    webOutbox.set(id, {
      id,
      type,
      payload: JSON.stringify(payload),
      status: 'pending',
      attempts: 0,
      created_at: new Date().toISOString(),
      owner_id: ownerId,
    });
    notifyListeners();
    return id;
  }
  database.runSync(
    'INSERT INTO outbox (id, type, payload, status, created_at, owner_id) VALUES (?, ?, ?, ?, ?, ?)',
    id,
    type,
    JSON.stringify(payload),
    'pending',
    new Date().toISOString(),
    ownerId,
  );
  notifyListeners();
  return id;
}

export function pendingEntries(ownerId: string) {
  if (!database) {
    return [...webOutbox.values()]
      .filter((entry) => entry.status === 'pending' && entry.owner_id === ownerId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
  return database.getAllSync<OutboxEntry>(
    'SELECT id, type, payload, status, attempts, created_at, owner_id FROM outbox WHERE status = ? AND owner_id = ? ORDER BY created_at ASC',
    'pending',
    ownerId,
  );
}

export function outboxSummary(ownerId: string): { pending: number; failed: number } {
  if (!ownerId) return { pending: 0, failed: 0 };
  if (!database) {
    let pending = 0;
    let failed = 0;
    for (const entry of webOutbox.values()) {
      if (entry.owner_id !== ownerId) continue;
      if (entry.status === 'pending' || entry.status === 'processing') pending += 1;
      else if (entry.status === 'failed') failed += 1;
    }
    return { pending, failed };
  }
  const rows = database.getAllSync<{ status: string }>(
    'SELECT status FROM outbox WHERE owner_id = ?',
    ownerId,
  );
  let pending = 0;
  let failed = 0;
  for (const row of rows) {
    if (row.status === 'pending' || row.status === 'processing') pending += 1;
    else if (row.status === 'failed') failed += 1;
  }
  return { pending, failed };
}

export function retryFailedEntries(ownerId: string): void {
  if (!ownerId) return;
  if (!database) {
    for (const entry of webOutbox.values()) {
      if (entry.owner_id === ownerId && entry.status === 'failed') {
        webOutbox.set(entry.id, { ...entry, status: 'pending' });
      }
    }
    notifyListeners();
    return;
  }
  database.runSync(
    'UPDATE outbox SET status = ? WHERE owner_id = ? AND status = ?',
    'pending',
    ownerId,
    'failed',
  );
  notifyListeners();
}

export function removeEntry(id: string) {
  if (!database) {
    webOutbox.delete(id);
    notifyListeners();
    return;
  }
  database.runSync('DELETE FROM outbox WHERE id = ?', id);
  notifyListeners();
}

export function markProcessing(id: string) {
  if (!database) {
    const entry = webOutbox.get(id);
    if (entry)
      webOutbox.set(id, { ...entry, status: 'processing', attempts: entry.attempts + 1 });
    notifyListeners();
    return;
  }
  database.runSync(
    'UPDATE outbox SET status = ?, attempts = attempts + 1 WHERE id = ?',
    'processing',
    id,
  );
  notifyListeners();
}

export function markPending(id: string) {
  if (!database) {
    const entry = webOutbox.get(id);
    if (entry) webOutbox.set(id, { ...entry, status: 'pending' });
    notifyListeners();
    return;
  }
  database.runSync('UPDATE outbox SET status = ? WHERE id = ?', 'pending', id);
  notifyListeners();
}

export function markFailed(id: string) {
  if (!database) {
    const entry = webOutbox.get(id);
    if (entry) webOutbox.set(id, { ...entry, status: 'failed' });
    notifyListeners();
    return;
  }
  database.runSync('UPDATE outbox SET status = ? WHERE id = ?', 'failed', id);
  notifyListeners();
}
