import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/src/db/client';
import { categories, loans, payments } from '@/src/db/schema';
import { OTHERS_CATEGORY } from '@/src/constants/defaultCategories';

export const name = '008_merge_uncategorized_into_others';

// "Uncategorized" (system fallback) and "Other" (a default expense category)
// meant the same thing to users. Collapse them — plus any "Others" — into one
// system category, "Others", valid for every transaction type.
//
// Runs on existing installs and again after restoring a pre-merge backup
// (restore replays runSeeds with the backup's seeder_state). Every step is
// idempotent, so a crash midway is finished by the next launch: the seed is
// only marked done after it returns.
const MERGED_NAMES = ['uncategorized', 'other', 'others'];

export async function seed(): Promise<void> {
  const group = await db
    .select()
    .from(categories)
    .where(inArray(sql`LOWER(TRIM(${categories.name}))`, MERGED_NAMES));

  if (group.length === 0) {
    await db.insert(categories).values({ ...OTHERS_CATEGORY });
    return;
  }

  // Keep the system row when there is one (it's what fallbacks already point
  // at), otherwise the oldest. Its id survives, so nothing referencing it moves.
  group.sort((a, b) => Number(b.isSystem) - Number(a.isSystem) || a.id - b.id);
  const [canonical, ...duplicates] = group;

  for (const dup of duplicates) {
    await db.update(payments).set({ categoryId: canonical.id }).where(eq(payments.categoryId, dup.id));
    await db.update(loans).set({ categoryId: canonical.id }).where(eq(loans.categoryId, dup.id));
    await db.delete(categories).where(eq(categories.id, dup.id));
  }

  await db
    .update(categories)
    .set({ ...OTHERS_CATEGORY, updatedAt: sql`(CURRENT_TIMESTAMP)` })
    .where(eq(categories.id, canonical.id));
}
