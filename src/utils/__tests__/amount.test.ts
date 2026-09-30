import { parseAmountInput } from '@/src/utils/amount';

describe('parseAmountInput', () => {
  it('reads plain and comma decimals', () => {
    expect(parseAmountInput('12.5')).toBe(12.5);
    expect(parseAmountInput('12,50')).toBe(12.5);
    expect(parseAmountInput(' $ 1000 ')).toBe(1000);
  });

  it('returns null for empty or unreadable input, never NaN', () => {
    expect(parseAmountInput('')).toBeNull();
    expect(parseAmountInput('   ')).toBeNull();
    expect(parseAmountInput('abc')).toBeNull();
    expect(parseAmountInput('.')).toBeNull();
  });
});
