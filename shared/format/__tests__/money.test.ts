import { getCurrencySymbol } from '@/shared/currency/currencies';
import { formatCurrency } from '@/shared/format/money';

jest.mock('@/shared/i18n', () => ({
  __esModule: true,
  default: { language: 'en', resolvedLanguage: 'en' },
  getIntlLocale: () => 'en-US',
}));

describe('currency symbols', () => {
  it('come from the currency table, falling back to the code', () => {
    expect(getCurrencySymbol('INR')).toBe('₹');
    expect(getCurrencySymbol('aud')).toBe('A$');
    expect(getCurrencySymbol('XYZ')).toBe('XYZ');
  });

  it('formatCurrency uses the same symbol as the table, never an Intl variant', () => {
    expect(formatCurrency(1234.5, 'INR')).toBe('₹1,234.50');
    expect(formatCurrency(10, 'AUD')).toBe('A$10.00');
    // Intl (en-US) would write "CA$" and "MX$"; the app writes its own symbol.
    expect(formatCurrency(10, 'CAD')).toBe(`${getCurrencySymbol('CAD')}10.00`);
    expect(formatCurrency(-5, 'USD')).toBe('-$5.00');
  });

  it('compact amounts carry the same symbol', () => {
    expect(formatCurrency(61254, 'INR', true)).toBe('₹61.3K');
    expect(formatCurrency(950, 'EUR', true)).toBe('€950');
  });
});
