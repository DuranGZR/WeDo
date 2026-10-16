import { database } from './client';

const webOutbox = new Map<string, OutboxEntry>();

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
export function removeEntry(id: string) {
  if (!database) {
    webOutbox.delete(id);
    return;
  }
  database.runSync('DELETE FROM outbox WHERE id = ?', id);
}
export function markProcessing(id: string) {
  if (!database) {
    const entry = webOutbox.get(id);
    if (entry)
      webOutbox.set(id, { ...entry, status: 'processing', attempts: entry.attempts + 1 });
    return;
  }
  database.runSync(
    'UPDATE outbox SET status = ?, attempts = attempts + 1 WHERE id = ?',
    'processing',
    id,
  );
}
export function markPending(id: string) {
  if (!database) {
    const entry = webOutbox.get(id);
    if (entry) webOutbox.set(id, { ...entry, status: 'pending' });
    return;
  }
  database.runSync('UPDATE outbox SET status = ? WHERE id = ?', 'pending', id);
}
export function markFailed(id: string) {
  if (!database) {
    const entry = webOutbox.get(id);
    if (entry) webOutbox.set(id, { ...entry, status: 'failed' });
    return;
  }
  database.runSync('UPDATE outbox SET status = ? WHERE id = ?', 'failed', id);
}
