import { eq } from 'drizzle-orm';
import { db } from '../client';
import { categories, accounts, persons } from '../schema';
import { LEGACY_ICON_MAP } from '../../utils/icons';
import { colorNumberToHex, toDbColor } from '../../utils/format';
import { PALETTE_COLOR_OPTIONS } from '../../constants/picker';

export const name = 'migrate_icons_and_colors' as const;

function parseHexToRgb(hex: string) {
  const cleanHex = hex.replace('#', '');
  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16),
  };
}

function getClosestPaletteColor(dbColor: number): number {
  const hex = colorNumberToHex(dbColor);
  const { r, g, b } = parseHexToRgb(hex);

  let closestHex = PALETTE_COLOR_OPTIONS[0].hex;
  let minDistance = Infinity;

  for (const option of PALETTE_COLOR_OPTIONS) {
    const oHex = option.hex;
    const { r: or, g: og, b: ob } = parseHexToRgb(oHex);

    const distance = Math.pow(r - or, 2) + Math.pow(g - og, 2) + Math.pow(b - ob, 2);
    if (distance < minDistance) {
      minDistance = distance;
      closestHex = oHex;
    }
  }

  return toDbColor(closestHex);
}

export async function seed(): Promise<void> {
  await db.transaction(async (tx) => {
    // 1. Migrate Categories
    const allCategories = await tx.select().from(categories);
    for (const cat of allCategories) {
      let updatedIcon = cat.icon;
      if (cat.icon in LEGACY_ICON_MAP) {
        updatedIcon = LEGACY_ICON_MAP[cat.icon];
      }

      const updatedColor = getClosestPaletteColor(cat.color);

      if (updatedIcon !== cat.icon || updatedColor !== cat.color) {
        await tx.update(categories)
          .set({ icon: updatedIcon, color: updatedColor })
          .where(eq(categories.id, cat.id));
      }
    }

    // 2. Migrate Accounts
    const allAccounts = await tx.select().from(accounts);
    for (const acc of allAccounts) {
      let updatedIcon = acc.icon;
      if (acc.icon in LEGACY_ICON_MAP) {
        updatedIcon = LEGACY_ICON_MAP[acc.icon];
      }

      const updatedColor = getClosestPaletteColor(acc.color);

      if (updatedIcon !== acc.icon || updatedColor !== acc.color) {
        await tx.update(accounts)
          .set({ icon: updatedIcon, color: updatedColor })
          .where(eq(accounts.id, acc.id));
      }
    }

    // 3. Migrate Persons
    const allPersons = await tx.select().from(persons);
    for (const per of allPersons) {
      const updatedColor = getClosestPaletteColor(per.color);

      if (updatedColor !== per.color) {
        await tx.update(persons)
          .set({ color: updatedColor })
          .where(eq(persons.id, per.id));
      }
    }
  });
}
