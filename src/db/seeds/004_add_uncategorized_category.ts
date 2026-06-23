import { sql } from 'drizzle-orm';
import { db } from '../client';
import { categories } from '../schema';

export const name = '004_add_uncategorized_category';

export async function seed(): Promise<void> {
  // Update or insert Uncategorized category
  const [existingUncategorized] = await db
    .select()
    .from(categories)
    .where(sql`LOWER(${categories.name}) = 'uncategorized'`)
    .limit(1);

  if (existingUncategorized) {
    await db
      .update(categories)
      .set({ isSystem: true, type: 'ALL' })
      .where(sql`LOWER(${categories.name}) = 'uncategorized'`);
  } else {
    await db.insert(categories).values({
      name: 'Uncategorized',
      icon: 'grid',
      color: 4672089, // dec for #475569
      type: 'ALL',
      isSystem: true,
    });
  }

  // Update or insert Transfer category
  const [existingTransfer] = await db
    .select()
    .from(categories)
    .where(sql`LOWER(${categories.name}) = 'transfer'`)
    .limit(1);

  if (existingTransfer) {
    await db
      .update(categories)
      .set({ isSystem: true })
      .where(sql`LOWER(${categories.name}) = 'transfer'`);
  } else {
    await db.insert(categories).values({
      name: 'Transfer',
      icon: 'repeat',
      color: 2450411, // dec for #2563EB
      type: 'TR',
      isSystem: true,
    });
  }
}
