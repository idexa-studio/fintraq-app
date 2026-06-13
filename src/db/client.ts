import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';
import { DatabaseKeys } from '../constants/keys';

let expoDbInstance: any = null;
let drizzleDbInstance: any = null;

function getDrizzleDb() {
  if (!drizzleDbInstance) {
    expoDbInstance = openDatabaseSync(DatabaseKeys.DB_NAME);
    drizzleDbInstance = drizzle(expoDbInstance, {
      schema,
      logger: __DEV__,
    });
  }
  return drizzleDbInstance;
}

export const db = new Proxy({} as any, {
  get(target, prop, receiver) {
    const underlying = getDrizzleDb();
    return Reflect.get(underlying, prop, receiver);
  },
});

