import { AdvancedFilterService, DEFAULT_ADVANCED_FILTERS } from '@/data/repositories/filters';

describe('AdvancedFilterService.toBasicFilters', () => {
  it('passes every multi-select straight to SQL', () => {
    const basic = AdvancedFilterService.toBasicFilters({
      ...DEFAULT_ADVANCED_FILTERS,
      types: ['DR', 'CR'],
      accountIds: [2, 3],
      categoryIds: [10],
      personIds: [7, 8],
      searchQuery: '  coffee ',
    });
    expect(basic).toMatchObject({ types: ['DR', 'CR'], accountIds: [2, 3], categoryIds: [10], personIds: [7, 8], search: 'coffee' });
  });

  it('drops empty selections and blank search', () => {
    const basic = AdvancedFilterService.toBasicFilters({ ...DEFAULT_ADVANCED_FILTERS, types: [], accountIds: [], searchQuery: '   ' });
    expect(basic.types).toBeUndefined();
    expect(basic.accountIds).toBeUndefined();
    expect(basic.search).toBeUndefined();
  });

  it('uses local calendar days for the date range, not UTC', () => {
    // Just after local midnight — in any zone east of UTC this is still the previous UTC day.
    const start = new Date(2026, 9, 1, 0, 0, 0, 0);
    const end = new Date(2026, 9, 31, 23, 59, 59, 999);
    const basic = AdvancedFilterService.toBasicFilters({ ...DEFAULT_ADVANCED_FILTERS, dateRange: { startDate: start, endDate: end } });
    expect(basic.startDate).toBe('2026-10-01');
    expect(basic.endDate).toBe('2026-10-31');
  });

  it('keeps the sort', () => {
    expect(AdvancedFilterService.toBasicFilters({ sortBy: 'amount', sortOrder: 'asc' })).toMatchObject({ sortBy: 'amount', sortOrder: 'asc' });
  });
});

describe('AdvancedFilterService.countActiveFilters', () => {
  it('counts each group once', () => {
    expect(AdvancedFilterService.countActiveFilters({ ...DEFAULT_ADVANCED_FILTERS, accountIds: [1, 2, 3], types: ['DR'], amountRange: { min: 5 } })).toBe(3);
    expect(AdvancedFilterService.countActiveFilters(DEFAULT_ADVANCED_FILTERS)).toBe(0);
  });
});
