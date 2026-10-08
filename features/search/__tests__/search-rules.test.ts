import type { GlobalSearchResults } from '@/data/repositories/search';
import { RECENT_LIMIT, groupsOf, isSearchable, parseRecents, personLine, totalOf, withRecent, withoutRecent } from '@/features/search/search-rules';

const results = (counts: { transactions?: number; accounts?: number; persons?: number; categories?: number }): GlobalSearchResults =>
  ({
    query: 'x',
    transactions: Array.from({ length: counts.transactions ?? 0 }, (_, id) => ({ id })),
    accounts: Array.from({ length: counts.accounts ?? 0 }, (_, id) => ({ id })),
    persons: Array.from({ length: counts.persons ?? 0 }, (_, id) => ({ id })),
    categories: Array.from({ length: counts.categories ?? 0 }, (_, id) => ({ id })),
  }) as unknown as GlobalSearchResults;

describe('search rules', () => {
  it('waits for two letters', () => {
    expect(isSearchable(' a ')).toBe(false);
    expect(isSearchable('ab')).toBe(true);
  });

  it('groups what was found in display order and leaves out empty kinds', () => {
    const groups = groupsOf(results({ categories: 2, persons: 1, transactions: 3 }));
    expect(groups.map((group) => group.kind)).toEqual(['transactions', 'people', 'categories']);
    expect(totalOf(groups)).toBe(6);
    expect(groupsOf(undefined)).toEqual([]);
  });

  it('reads the recent searches the shipped app saved', () => {
    expect(parseRecents('["rent","coffee"]')).toEqual(['rent', 'coffee']);
  });

  it('reads anything unexpected as no recent searches', () => {
    expect(parseRecents(null)).toEqual([]);
    expect(parseRecents('not json')).toEqual([]);
    expect(parseRecents('{"a":1}')).toEqual([]);
    expect(parseRecents('["rent", 4, "", null]')).toEqual(['rent']);
  });

  it('puts a search first, once, and keeps only the newest few', () => {
    expect(withRecent(['rent', 'coffee'], ' Coffee ')).toEqual(['Coffee', 'rent']);
    const full = ['a1', 'a2', 'a3', 'a4', 'a5'];
    const next = withRecent(full, 'new');
    expect(next).toHaveLength(RECENT_LIMIT);
    expect(next[0]).toBe('new');
    expect(next).not.toContain('a5');
  });

  it('does not remember a search too short to run', () => {
    expect(withRecent(['rent'], 'a')).toEqual(['rent']);
  });

  it('forgets one search', () => {
    expect(withoutRecent(['rent', 'coffee'], 'rent')).toEqual(['coffee']);
  });

  it('describes a person by their work, else their email', () => {
    expect(personLine({ designation: 'Landlord', company: 'Acme', email: 'a@b.c' })).toBe('Landlord · Acme');
    expect(personLine({ designation: null, company: null, email: 'a@b.c' })).toBe('a@b.c');
    expect(personLine({ designation: null, company: null, email: null })).toBeUndefined();
  });
});
