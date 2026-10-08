import type { Category, InsertCategory } from '@/data/repositories/categories';
import { CATEGORY_ICONS } from '@/shared/contracts/pickers';
import { colorNumberToHex, toDbColor } from '@/shared/format/color';
import type { TransactionType } from '@/shared/types';

/** The kinds of entry a category can be offered for, in the order they are shown and stored. */
export const CATEGORY_KINDS: readonly TransactionType[] = ['DR', 'CR', 'TR'];

export const NAME_MIN = 2;
export const NAME_MAX = 50;

/** The kinds a category is offered for. They are stored together, as "DR,CR". */
export const kindsOf = (category: Pick<Category, 'type'>): TransactionType[] => {
  const stored = category.type.split(',');
  return CATEGORY_KINDS.filter((kind) => stored.includes(kind));
};

export type CategoryDraft = {
  name: string;
  kinds: TransactionType[];
  icon: string;
  /** Hex, from the saved palette. */
  color: string;
};

/** Why the form cannot be saved yet. */
export type CategoryBlocker = 'name' | 'kind';

export const newDraft = (kind: TransactionType, color: string): CategoryDraft => ({ name: '', kinds: [kind], icon: CATEGORY_ICONS[0], color });

export const draftOf = (category: Category): CategoryDraft => {
  const kinds = kindsOf(category);
  return { name: category.name, kinds: kinds.length > 0 ? kinds : ['DR'], icon: category.icon, color: colorNumberToHex(category.color).toUpperCase() };
};

/** Adds the kind, or takes it away; always in the stored order. */
export const toggleKind = (kinds: readonly TransactionType[], kind: TransactionType): TransactionType[] =>
  CATEGORY_KINDS.filter((k) => (k === kind ? !kinds.includes(k) : kinds.includes(k)));

export function blockerOf(draft: CategoryDraft): CategoryBlocker | null {
  if (draft.name.trim().length < NAME_MIN) return 'name';
  if (draft.kinds.length === 0) return 'kind';
  return null;
}

export const payloadOf = (draft: CategoryDraft): Pick<InsertCategory, 'name' | 'type' | 'icon' | 'color'> => ({
  name: draft.name.trim(),
  type: CATEGORY_KINDS.filter((kind) => draft.kinds.includes(kind)).join(','),
  icon: draft.icon,
  color: toDbColor(draft.color),
});

export const isChanged = (draft: CategoryDraft, from: CategoryDraft): boolean =>
  draft.name !== from.name || draft.icon !== from.icon || draft.color !== from.color || draft.kinds.join() !== from.kinds.join();

/** A kind's categories for the list: the user's own by name, and the built-in ones apart. */
export function categoriesOfKind(categories: readonly Category[], kind: TransactionType): { own: Category[]; builtIn: Category[] } {
  // The oldest built-in category was written as "ALL" rather than as a list of kinds.
  const offered = categories.filter((category) => category.type === 'ALL' || category.type.split(',').includes(kind)).sort((a, b) => a.name.localeCompare(b.name));
  return { own: offered.filter((c) => !c.isSystem), builtIn: offered.filter((c) => c.isSystem) };
}
