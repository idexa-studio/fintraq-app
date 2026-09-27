import { eq } from 'drizzle-orm';
import { db } from '@/src/db/client';
import { seederState } from '@/src/db/schema';
import * as transferCategorySeed from './001_add_transfer_category';
import * as migrateIconsAndColorsSeed from './002_migrate_icons_and_colors';
import * as addUncategorizedCategorySeed from './004_add_uncategorized_category';
import * as categoryMultiTypesSeed from './005_category_multi_types';
import * as dedupeCategoriesSeed from './007_dedupe_categories';
import * as mergeUncategorizedIntoOthersSeed from './008_merge_uncategorized_into_others';

type SeedModule = {
  name: string;
  seed: () => Promise<void>;
};

const seeds: readonly SeedModule[] = [
  transferCategorySeed,
  migrateIconsAndColorsSeed,
  addUncategorizedCategorySeed,
  categoryMultiTypesSeed,
  dedupeCategoriesSeed,
  mergeUncategorizedIntoOthersSeed,
] as const;

export async function runSeeds(): Promise<void> {
  for (const seedModule of seeds) {
    const [record] = await db
      .select()
      .from(seederState)
      .where(eq(seederState.name, seedModule.name))
      .limit(1);

    if (record) continue;

    await seedModule.seed();
    await db.insert(seederState).values({ name: seedModule.name });
  }
}
