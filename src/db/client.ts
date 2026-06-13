import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';
import { DatabaseKeys } from '../constants/keys';

const expoDb = openDatabaseSync(DatabaseKeys.DB_NAME);

export const db = drizzle(expoDb, {
  schema,
  logger: __DEV__,
});
