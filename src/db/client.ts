import { drizzle, ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';
import { DatabaseKeys } from '../constants/keys';

let expoDbInstance: ReturnType<typeof openDatabaseSync> | null = null;
let drizzleDbInstance: ExpoSQLiteDatabase<typeof schema> | null = null;

function getDrizzleDb(): ExpoSQLiteDatabase<typeof schema> {
  if (!drizzleDbInstance) {
    expoDbInstance = openDatabaseSync(DatabaseKeys.DB_NAME);
    drizzleDbInstance = drizzle(expoDbInstance, {
      schema,
      logger: __DEV__,
    });
  }
  return drizzleDbInstance;
}

export const db = new Proxy({} as ExpoSQLiteDatabase<typeof schema>, {
  get(target, prop, receiver) {
    const underlying = getDrizzleDb();
    return Reflect.get(underlying, prop, receiver);
  },
});

