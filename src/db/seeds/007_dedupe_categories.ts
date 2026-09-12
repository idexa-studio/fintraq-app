import { eq, sql } from 'drizzle-orm';
import { db } from '../client';
import { categories, loans, payments } from '../schema';

export const name = '007_dedupe_categories';

// Fixes a race where DatabaseProvider's unawaited runSeeds() and onboarding's
// seedCategories() could both see "no Uncategorized/Transfer yet" and each insert
// one. Scoped to just these two names — both are always isSystem, so this never
// touches a user's own custom categories even if they happen to share a name.
const RACE_AFFECTED_NAMES = ['uncategorized', 'transfer'];

export async function seed(): Promise<void> {
  for (const lowerName of RACE_AFFECTED_NAMES) {
    const group = await db
      .select()
      .from(categories)
      .where(sql`LOWER(${categories.name}) = ${lowerName}`);

    if (group.length < 2) continue;

    group.sort((a, b) => a.id - b.id);
    const [canonical, ...duplicates] = group;

    for (const dup of duplicates) {
      await db.update(payments).set({ categoryId: canonical.id }).where(eq(payments.categoryId, dup.id));
      await db.update(loans).set({ categoryId: canonical.id }).where(eq(loans.categoryId, dup.id));
      await db.delete(categories).where(eq(categories.id, dup.id));
    }

    if (!canonical.isSystem) {
      await db.update(categories).set({ isSystem: true }).where(eq(categories.id, canonical.id));
    }
  }
}
