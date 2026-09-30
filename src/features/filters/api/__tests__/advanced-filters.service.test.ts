import { AdvancedFilterService, ClientFilterable, DEFAULT_ADVANCED_FILTERS } from '@/src/features/filters/api/advanced-filters.service';

const row = (over: Partial<ClientFilterable> & { id: number }): ClientFilterable & { id: number } => ({
  type: 'DR',
  accountId: 1,
  categoryId: 1,
  personId: null,
  note: '',
  category: { name: 'Food' },
  account: { name: 'Cash' },
  ...over,
});

const rows = [
  row({ id: 1, type: 'DR', accountId: 1, categoryId: 10, note: 'Coffee beans' }),
  row({ id: 2, type: 'CR', accountId: 2, categoryId: 20, personId: 7, category: { name: 'Salary' } }),
  row({ id: 3, type: 'TR', accountId: 3, categoryId: 30, account: { name: 'HDFC Bank' } }),
];
const ids = (items: { id: number }[]) => items.map((r) => r.id);

describe('AdvancedFilterService.applyClientSide', () => {
  it('passes rows through untouched when the DB handles every filter', () => {
    expect(ids(AdvancedFilterService.applyClientSide(rows, { ...DEFAULT_ADVANCED_FILTERS, types: ['DR'] }))).toEqual([1, 2, 3]);
  });

  it('applies multi-select filters the DB cannot', () => {
    expect(ids(AdvancedFilterService.applyClientSide(rows, { ...DEFAULT_ADVANCED_FILTERS, types: ['DR', 'CR'] }))).toEqual([1, 2]);
    expect(ids(AdvancedFilterService.applyClientSide(rows, { ...DEFAULT_ADVANCED_FILTERS, accountIds: [2, 3] }))).toEqual([2, 3]);
    expect(ids(AdvancedFilterService.applyClientSide(rows, { ...DEFAULT_ADVANCED_FILTERS, personIds: [7, 8] }))).toEqual([2]);
  });

  it('searches note, category and account names case-insensitively', () => {
    const search = (searchQuery: string) => ids(AdvancedFilterService.applyClientSide(rows, { ...DEFAULT_ADVANCED_FILTERS, searchQuery }));
    expect(search('  COFFEE ')).toEqual([1]);
    expect(search('salary')).toEqual([2]);
    expect(search('hdfc')).toEqual([3]);
  });

  it('keeps the incoming (DB) order', () => {
    const reversed = [...rows].reverse();
    expect(ids(AdvancedFilterService.applyClientSide(reversed, { ...DEFAULT_ADVANCED_FILTERS, types: ['DR', 'CR', 'TR'] }))).toEqual([3, 2, 1]);
  });
});

describe('AdvancedFilterService.isSortActive', () => {
  it('is only false for the default newest-first order', () => {
    expect(AdvancedFilterService.isSortActive(DEFAULT_ADVANCED_FILTERS)).toBe(false);
    expect(AdvancedFilterService.isSortActive({ sortBy: 'date', sortOrder: 'asc' })).toBe(true);
    expect(AdvancedFilterService.isSortActive({ sortBy: 'amount', sortOrder: 'desc' })).toBe(true);
  });
});
