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

  it('a sign stands against the digits; a symbol made of letters keeps its space', () => {
    expect(formatCurrency(1234.5, 'CHF')).toBe('CHF\u00A01,234.50');
    expect(formatCurrency(1234.5, 'SEK')).toBe('kr\u00A01,234.50');
    expect(formatCurrency(-48.31, 'INR')).toBe('-₹48.31');
    expect(formatCurrency(-61254, 'INR', true)).toBe('-₹61.3K');
  });

  it('does not need formatToParts, which Hermes on iOS lacks for numbers', () => {
    const real = Intl.NumberFormat.prototype.formatToParts;
    // @ts-expect-error: taken away as on an iPhone
    delete Intl.NumberFormat.prototype.formatToParts;
    try {
      expect(formatCurrency(35939.88, 'INR')).toBe('₹35,939.88');
      expect(formatCurrency(61254, 'INR', true)).toBe('₹61.3K');
    } finally {
      Intl.NumberFormat.prototype.formatToParts = real;
    }
  });
});
