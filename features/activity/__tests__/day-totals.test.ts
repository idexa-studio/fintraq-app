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
