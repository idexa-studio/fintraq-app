import { db } from '@/data/db/client';
import { accounts, categories } from '@/data/db/schema';
import type { InsertAccount } from '@/data/repositories/accounts';
import { openingBalance } from '@/features/onboarding/first-run-rules';
import type { SetupDraft } from '@/features/onboarding/first-run-rules';
import { DEFAULT_CATEGORIES } from '@/shared/contracts/default-categories';
import { toDbColor } from '@/shared/format/color';

/** Adds the default categories that are not there yet, by name, so running it twice adds nothing twice. */
export async function seedDefaultCategories(): Promise<void> {
  const existing = new Set((await db.select({ name: categories.name }).from(categories)).map((category) => category.name));
  const missing = DEFAULT_CATEGORIES.filter((category) => !existing.has(category.name));
  if (missing.length === 0) return;
  await db.insert(categories).values(missing.map((category) => ({ name: category.name, icon: category.icon, color: category.color, type: category.type, isSystem: category.isSystem ?? false })));
}

/** The first account as it is saved: the default one, in the chosen currency. */
export const firstAccountOf = (draft: SetupDraft, colorHex: string): InsertAccount => ({
  name: draft.accountName.trim(),
  // The shipped app wrote "Personal" when no name was given; kept so both read the same.
  holderName: draft.name.trim() || 'Personal',
  accountNumber: '',
  accountType: draft.kind,
  // Accounts are drawn by their kind; the column keeps the value every version has written.
  icon: 'building',
  color: toDbColor(colorHex),
  isDefault: true,
  currency: draft.currency,
  balance: openingBalance(draft.balance) ?? 0,
});

/**
 * Makes what the app cannot work without: the categories, then the first account. Safe to run
 * again after a failure part-way: categories are matched by name, and an account is only made
 * when there is none, since two accounts may share a name and a second run would duplicate it.
 * Throws when either cannot be made, so setup is never marked done over a half-made workspace.
 */
export async function createWorkspace(draft: SetupDraft, colorHex: string, createAccount: (account: InsertAccount) => Promise<unknown>): Promise<void> {
  await seedDefaultCategories();
  const [existing] = await db.select({ id: accounts.id }).from(accounts).limit(1);
  if (!existing) await createAccount(firstAccountOf(draft, colorHex));
}
