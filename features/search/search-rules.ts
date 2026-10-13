import type { Account } from '@/data/repositories/accounts';
import type { Category } from '@/data/repositories/categories';
import type { Person } from '@/data/repositories/people';
import type { GlobalSearchResults } from '@/data/repositories/search';
import type { TransactionListItem } from '@/data/repositories/transactions';

/** Fewer letters than this match nearly everything, so nothing is looked up yet. */
export const MIN_QUERY = 2;
/** How many past searches are kept, newest first. */
export const RECENT_LIMIT = 5;

/** What a search can find, in the order the results are shown. */
export const SEARCH_KINDS = ['transactions', 'accounts', 'people', 'categories'] as const;
export type SearchKind = (typeof SEARCH_KINDS)[number];

export type SearchGroup =
  | { kind: 'transactions'; items: TransactionListItem[] }
  | { kind: 'accounts'; items: Account[] }
  | { kind: 'people'; items: Person[] }
  | { kind: 'categories'; items: Category[] };

export const isSearchable = (query: string): boolean => query.trim().length >= MIN_QUERY;

/** The kinds that found something, in display order. */
export function groupsOf(results: GlobalSearchResults | undefined): SearchGroup[] {
  if (!results) return [];
  const all: SearchGroup[] = [
    { kind: 'transactions', items: results.transactions },
    { kind: 'accounts', items: results.accounts },
    { kind: 'people', items: results.persons },
    { kind: 'categories', items: results.categories },
  ];
  return all.filter((group) => group.items.length > 0);
}

export const totalOf = (groups: readonly SearchGroup[]): number => groups.reduce((sum, group) => sum + group.items.length, 0);

/** What the shipped app saved: a JSON list of strings. Anything else reads as none. */
export function parseRecents(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const saved: unknown = JSON.parse(raw);
    return Array.isArray(saved) ? saved.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, RECENT_LIMIT) : [];
  } catch {
    return [];
  }
}

/** The search goes to the front; an earlier copy of it, in any letter case, is dropped. */
export function withRecent(recents: readonly string[], query: string): string[] {
  const added = query.trim();
  if (!isSearchable(added)) return [...recents];
  return [added, ...recents.filter((item) => item.toLowerCase() !== added.toLowerCase())].slice(0, RECENT_LIMIT);
}

export const withoutRecent = (recents: readonly string[], query: string): string[] => recents.filter((item) => item !== query);

/** A person's second line: what they do and where, or else how to reach them. */
export const personLine = (person: Pick<Person, 'designation' | 'company' | 'email'>): string | undefined =>
  [person.designation, person.company].filter(Boolean).join(' · ') || person.email || undefined;
