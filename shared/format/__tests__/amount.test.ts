import { parseAmountInput } from '@/shared/format/amount';

describe('parseAmountInput', () => {
  it('reads plain and comma decimals', () => {
    expect(parseAmountInput('12.5')).toBe(12.5);
    expect(parseAmountInput('12,50')).toBe(12.5);
    expect(parseAmountInput(' $ 1000 ')).toBe(1000);
  });

  it('reads grouped amounts in full instead of stopping at the first separator', () => {
    expect(parseAmountInput('1,234.56')).toBe(1234.56);
    expect(parseAmountInput('1.234,56')).toBe(1234.56);
    expect(parseAmountInput('1,234,567')).toBe(1234567);
    expect(parseAmountInput('1.234.567')).toBe(1234567);
    expect(parseAmountInput('₹ 12,34,567.50')).toBe(1234567.5);
  });

  it('keeps a single separator as the decimal point', () => {
    expect(parseAmountInput('1,234')).toBe(1.234);
    expect(parseAmountInput('.5')).toBe(0.5);
    expect(parseAmountInput('5.')).toBe(5);
  });

  it('returns null for empty or unreadable input, never NaN', () => {
    expect(parseAmountInput('')).toBeNull();
    expect(parseAmountInput('   ')).toBeNull();
    expect(parseAmountInput('abc')).toBeNull();
    expect(parseAmountInput('.')).toBeNull();
  });
});
