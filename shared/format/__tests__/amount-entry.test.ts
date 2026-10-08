import { amountValue, pressAmountKey } from '@/shared/format/amount-entry';
import type { AmountKey } from '@/shared/format/amount-entry';

const type = (keys: string, start = '') => [...keys].reduce((text, key) => pressAmountKey(text, (key === '<' ? 'delete' : key) as AmountKey), start);

describe('amount entry', () => {
  it('builds a plain amount', () => {
    expect(type('42.10')).toBe('42.10');
    expect(amountValue('42.10')).toBe(42.1);
  });

  it('allows one decimal point and two decimal places per number', () => {
    expect(type('1.2.345')).toBe('1.23');
    expect(type('1.25+3.999')).toBe('1.25+3.99');
  });

  it('starts a decimal with a zero, and drops a leading zero', () => {
    expect(type('.5')).toBe('0.5');
    expect(type('05')).toBe('5');
    expect(type('0.5')).toBe('0.5');
  });

  it('never starts with an operator, and lets the last operator pressed win', () => {
    expect(type('+')).toBe('');
    expect(type('12+×3')).toBe('12×3');
    expect(type('12.+3')).toBe('12+3');
  });

  it('deletes one character at a time', () => {
    expect(type('12+3<<')).toBe('12');
    expect(type('<')).toBe('');
  });

  it('works out sums, and has no value while one is unfinished', () => {
    expect(amountValue(type('12.50+3×4'))).toBe(24.5);
    expect(amountValue('12+')).toBeUndefined();
    expect(amountValue('')).toBeUndefined();
  });

  it('stops at a sensible length', () => {
    expect(type('1234567890123456')).toBe('123456789012');
  });
});
