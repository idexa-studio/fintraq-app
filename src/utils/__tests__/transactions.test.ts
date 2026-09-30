import { format } from 'date-fns';
import { groupByDay, sumByCurrency } from '@/src/utils/transactions';

// A fixed English formatter keeps the assertions independent of the device locale.
const title = (d: Date, withYear: boolean) => format(d, withYear ? 'EEE, d MMM yyyy' : 'EEE, d MMM');

const tx = (type: string, amount: number, currency = 'INR', datetime = '2026-09-30T10:00:00') => ({
  type,
  amount,
  datetime,
  account: { currency },
});

describe('sumByCurrency', () => {
  it('totals income and expense per currency and ignores transfers', () => {
    expect(sumByCurrency([tx('CR', 100), tx('DR', 40), tx('TR', 999), tx('DR', 5, 'USD')])).toEqual({
      INR: { income: 100, expense: 40 },
      USD: { income: 0, expense: 5 },
    });
  });

  it('is empty for no items', () => {
    expect(sumByCurrency([])).toEqual({});
  });
});

describe('groupByDay', () => {
  it('groups by calendar day and keeps the incoming order', () => {
    const items = [
      tx('DR', 1, 'INR', '2026-09-30T20:00:00'),
      tx('DR', 2, 'INR', '2026-09-30T08:00:00'),
      tx('DR', 3, 'INR', '2026-09-28T12:00:00'),
    ];
    const sections = groupByDay(items, new Date('2026-10-02T00:00:00'), title);
    expect(sections.map((s) => s.key)).toEqual(['2026-09-30', '2026-09-28']);
    expect(sections[0].data.map((t) => t.amount)).toEqual([1, 2]);
    expect(sections[0].title).toBe('Wed, 30 Sep');
  });

  it('does not merge the same weekday/day-of-month from different years', () => {
    // 1 Oct 2025 and 1 Oct 2031 are both Wednesdays: same old label, different days.
    const sections = groupByDay(
      [tx('DR', 1, 'INR', '2031-10-01T10:00:00'), tx('DR', 2, 'INR', '2025-10-01T10:00:00')],
      new Date('2026-10-02T00:00:00'),
      title,
    );
    expect(sections).toHaveLength(2);
    expect(sections.map((s) => s.title)).toEqual(['Wed, 1 Oct 2031', 'Wed, 1 Oct 2025']);
  });
});
