import { dayNet } from '@/features/activity/day-totals';

jest.mock('@/shared/i18n', () => ({ __esModule: true, default: { language: 'en', resolvedLanguage: 'en' }, getIntlLocale: () => 'en-US' }));

const entry = (type: string, amount: number, currency = 'USD') => ({ type, amount, account: { currency } });

describe('a day’s net', () => {
  it('is money in less money out', () => {
    expect(dayNet([entry('DR', 40), entry('CR', 100)])).toBe('+$60.00');
    expect(dayNet([entry('DR', 40), entry('DR', 6.6)])).toBe('-$46.60');
  });

  it('ignores transfers, and shows nothing for a day of transfers only', () => {
    expect(dayNet([entry('TR', 500), entry('DR', 10)])).toBe('-$10.00');
    expect(dayNet([entry('TR', 500)])).toBeUndefined();
  });

  it('shows nothing when the day mixes currencies', () => {
    expect(dayNet([entry('DR', 10, 'USD'), entry('DR', 10, 'EUR')])).toBeUndefined();
  });
});

describe('the list as flat lines', () => {
  const { activityItems } = jest.requireActual<typeof import('@/features/activity/activity-list')>('@/features/activity/activity-list');
  const tx = (id: number, datetime: string) => ({ id, datetime, type: 'DR', amount: 10, account: { currency: 'USD' } }) as never;

  it('puts a heading before each day and marks where a day’s card opens and closes', () => {
    const items = activityItems([tx(3, '2026-10-04T18:00:00'), tx(2, '2026-10-04T09:00:00'), tx(1, '2026-10-03T12:00:00')], new Date('2026-10-08T00:00:00'));
    expect(items.map((i) => (i.kind === 'day' ? 'day' : `${i.transaction.id}:${i.first ? 'first' : ''}${i.last ? 'last' : ''}`))).toEqual(['day', '3:first', '2:last', 'day', '1:firstlast']);
    expect(items[0]).toMatchObject({ kind: 'day', net: '-$20.00' });
  });

  it('is empty for no transactions', () => {
    expect(activityItems([])).toEqual([]);
  });
});
