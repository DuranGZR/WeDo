import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// expo-sqlite's synchronous web implementation requires SharedArrayBuffer.
// Keep SQLite native-only and let the outbox provide an in-memory web fallback.
export const database = Platform.OS === 'web' ? null : SQLite.openDatabaseSync('wedo.db');
export function initializeDatabase() {
  if (!database) return;
  database.execSync(
    `CREATE TABLE IF NOT EXISTS outbox (id TEXT PRIMARY KEY NOT NULL, type TEXT NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);`,
  );
  const columns = database.getAllSync<{ name: string }>('PRAGMA table_info(outbox)');
  if (!columns.some((column) => column.name === 'owner_id')) {
    database.execSync('ALTER TABLE outbox ADD COLUMN owner_id TEXT;');
    // Legacy entries cannot safely be attributed to the current signed-in user.
    database.execSync('DELETE FROM outbox WHERE owner_id IS NULL;');
  }
  database.execSync("UPDATE outbox SET status = 'pending' WHERE status = 'processing';");
}
