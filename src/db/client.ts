import { drizzle, ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';
import { DatabaseKeys } from '../constants/keys';

let expoDbInstance: ReturnType<typeof openDatabaseSync> | null = null;
let drizzleDbInstance: ExpoSQLiteDatabase<typeof schema> | null = null;

function getDrizzleDb(): ExpoSQLiteDatabase<typeof schema> {
  if (!drizzleDbInstance) {
    expoDbInstance = openDatabaseSync(DatabaseKeys.DB_NAME);
    // Configure production SQLite WAL mode, 30s busy timeout, and foreign keys
    try {
      expoDbInstance.execSync('PRAGMA journal_mode = WAL;');
      expoDbInstance.execSync('PRAGMA busy_timeout = 30000;');
      expoDbInstance.execSync('PRAGMA synchronous = NORMAL;');
      expoDbInstance.execSync('PRAGMA foreign_keys = ON;');
    } catch (e) {
      console.warn('[DB] Connection PRAGMA initialization warning:', e);
    }
    drizzleDbInstance = drizzle(expoDbInstance, {
      schema,
      logger: false,
    });
  }
  return drizzleDbInstance;
}

export function unlockDatabaseIfLocked(): void {
  try {
    const rawDb = getExpoDb();
    rawDb.execSync('PRAGMA journal_mode = WAL;');
    rawDb.execSync('PRAGMA busy_timeout = 30000;');
    rawDb.execSync('PRAGMA synchronous = NORMAL;');
    rawDb.execSync('PRAGMA wal_checkpoint(PASSIVE);');
  } catch {
    // Non-blocking passive checkpoint
  }
}

export function resetDbConnections(): void {
  if (expoDbInstance) {
    try {
      expoDbInstance.closeSync();
    } catch (e) {
      console.warn('[DB] Connection closeSync warning:', e);
    }
    expoDbInstance = null;
    drizzleDbInstance = null;
  }
}

export function getExpoDb(): ReturnType<typeof openDatabaseSync> {
  getDrizzleDb();
  return expoDbInstance!;
}

export const db = new Proxy({} as ExpoSQLiteDatabase<typeof schema>, {
  get(target, prop, receiver) {
    const underlying = getDrizzleDb();
    return Reflect.get(underlying, prop, receiver);
  },
});

