import { eq } from 'drizzle-orm';
import { db } from '../client';
import { seederState } from '../schema';
import * as transferCategorySeed from './001_add_transfer_category';
import * as migrateIconsAndColorsSeed from './002_migrate_icons_and_colors';

type SeedModule = {
  name: string;
  seed: () => Promise<void>;
};

const seeds: readonly SeedModule[] = [
  transferCategorySeed,
  migrateIconsAndColorsSeed,
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
