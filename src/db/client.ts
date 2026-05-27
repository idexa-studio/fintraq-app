import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const expoDb = openDatabaseSync('luno.db');

export const db = drizzle(expoDb, {
  schema,
  logger: __DEV__,
});
