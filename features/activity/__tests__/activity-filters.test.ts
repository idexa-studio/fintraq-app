import { filtersFromLink, NO_FILTERS, activeCount, periodRange, toQuery } from '@/features/activity/activity-filters';

const NOW = new Date(2026, 9, 8, 15, 0); // 8 October 2026
const day = (d?: Date) => (d ? `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` : undefined);

describe('activity filters', () => {
  it('covers whole months, the last thirty days and the year', () => {
    expect([day(periodRange({ period: 'thisMonth' }, NOW).start), day(periodRange({ period: 'thisMonth' }, NOW).end)]).toEqual(['2026-10-1', '2026-10-31']);
    expect([day(periodRange({ period: 'lastMonth' }, NOW).start), day(periodRange({ period: 'lastMonth' }, NOW).end)]).toEqual(['2026-9-1', '2026-9-30']);
    expect([day(periodRange({ period: 'last30' }, NOW).start), day(periodRange({ period: 'last30' }, NOW).end)]).toEqual(['2026-9-9', '2026-10-8']);
    expect([day(periodRange({ period: 'thisYear' }, NOW).start), day(periodRange({ period: 'thisYear' }, NOW).end)]).toEqual(['2026-1-1', '2026-12-31']);
    expect(periodRange({ period: 'all' }, NOW)).toEqual({});
  });

  it('handles January, when last month is in last year', () => {
    const jan = periodRange({ period: 'lastMonth' }, new Date(2027, 0, 15));
    expect([day(jan.start), day(jan.end)]).toEqual(['2026-12-1', '2026-12-31']);
  });

  it('reads a custom range either way round, and lets an end stay open', () => {
    const a = new Date(2026, 8, 5);
    const b = new Date(2026, 8, 20);
    expect(periodRange({ period: 'custom', from: b, to: a }, NOW)).toEqual({ start: a, end: b });
    expect(periodRange({ period: 'custom', from: a }, NOW)).toEqual({ start: a, end: undefined });
  });

  it('counts the filters that are on', () => {
    expect(activeCount(NO_FILTERS)).toBe(0);
    expect(activeCount({ period: 'thisMonth', accountId: 1, personId: 2 })).toBe(3);
  });

  it('builds the query: kind, dates, and one account over the currency’s accounts', () => {
    expect(toQuery(NO_FILTERS, 'all', undefined, NOW)).toEqual({});
    expect(toQuery(NO_FILTERS, 'expense', [1, 2], NOW)).toEqual({ types: ['DR'], accountIds: [1, 2] });
    expect(toQuery({ period: 'thisMonth', accountId: 7, categoryId: 3, personId: 4 }, 'all', [1, 2], NOW)).toEqual({
      accountIds: [7], categoryIds: [3], personIds: [4], startDate: '2026-10-01', endDate: '2026-10-31',
    });
  });
});

describe('a link to Activity', () => {
  it('narrows to an account, a category or a person', () => {
    expect(filtersFromLink({ categoryId: '7' })).toEqual({ period: 'all', from: undefined, to: undefined, accountId: undefined, categoryId: 7, personId: undefined });
    expect(filtersFromLink({ accountId: '2', personId: '9' })).toMatchObject({ accountId: 2, personId: 9 });
  });

  it('can carry the days being looked at, as local days', () => {
    const filters = filtersFromLink({ categoryId: '7', from: '2026-07-11', to: '2026-10-08' });
    expect(filters).toMatchObject({ period: 'custom', categoryId: 7 });
    expect(filters!.from).toEqual(new Date(2026, 6, 11));
    expect(filters!.to).toEqual(new Date(2026, 9, 8));
  });

  it('asks for nothing when the link carries nothing readable', () => {
    expect(filtersFromLink({})).toBeNull();
    expect(filtersFromLink({ categoryId: 'abc', from: 'yesterday' })).toBeNull();
  });
});
