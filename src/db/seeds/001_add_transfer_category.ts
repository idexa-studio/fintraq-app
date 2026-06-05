import { eq } from 'drizzle-orm';
import { db } from '../client';
import { categories } from '../schema';

export const name = 'add_transfer_category' as const;

export async function seed(): Promise<void> {
  const [existing] = await db
    .select()
    .from(categories)
    .where(eq(categories.type, 'TR'))
    .limit(1);

  if (existing) return;

  await db.insert(categories).values({
    name: 'Transfer',
    icon: 'swap-horizontal',
    color: 0x2563eb,
    type: 'TR',
  });
}
