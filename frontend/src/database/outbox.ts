import { database } from './client';

const webOutbox = new Map<string, OutboxEntry>();

export type OutboxEntry = {
  id: string;
  type: string;
  payload: string;
  status: 'pending' | 'processing' | 'failed';
  attempts: number;
  created_at: string;
};
export function enqueue(type: string, payload: unknown) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  if (!database) {
    webOutbox.set(id, {
      id,
      type,
      payload: JSON.stringify(payload),
      status: 'pending',
      attempts: 0,
      created_at: new Date().toISOString(),
    });
    return id;
  }
  database.runSync(
    'INSERT INTO outbox (id, type, payload, status, created_at) VALUES (?, ?, ?, ?, ?)',
    id,
    type,
    JSON.stringify(payload),
    'pending',
    new Date().toISOString(),
  );
  return id;
}
export function pendingEntries() {
  if (!database) {
    return [...webOutbox.values()]
      .filter((entry) => entry.status === 'pending')
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
  return database.getAllSync<OutboxEntry>(
    'SELECT id, type, payload, status, attempts, created_at FROM outbox WHERE status = ? ORDER BY created_at ASC',
    'pending',
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
