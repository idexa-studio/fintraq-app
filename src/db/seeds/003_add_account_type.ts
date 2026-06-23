import { sql } from 'drizzle-orm';
import { db } from '../client';

export const name = '003_add_account_type';

export async function seed(): Promise<void> {
  db.run(sql`ALTER TABLE accounts ADD COLUMN account_type TEXT DEFAULT 'cash'`);
}
