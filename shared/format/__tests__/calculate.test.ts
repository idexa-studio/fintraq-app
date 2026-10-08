import { calculate, isExpression } from '@/shared/format/calculate';

describe('calculate', () => {
  it('returns a plain number unchanged', () => {
    expect(calculate('42.10')).toBe(42.1);
    expect(calculate('.5')).toBe(0.5);
  });

  it('adds and subtracts left to right', () => {
    expect(calculate('10+5−3')).toBe(12);
  });

  it('multiplies and divides before adding', () => {
    expect(calculate('12.5+3×4')).toBe(24.5);
    expect(calculate('100−90÷3')).toBe(70);
  });

  it('rounds to two decimal places without floating-point dust', () => {
    expect(calculate('0.1+0.2')).toBe(0.3);
    expect(calculate('10÷3')).toBe(3.33);
  });

  it('has no answer for an unfinished or meaningless sum', () => {
    expect(calculate('')).toBeUndefined();
    expect(calculate('12+')).toBeUndefined();
    expect(calculate('+12')).toBeUndefined();
    expect(calculate('12++3')).toBeUndefined();
    expect(calculate('5÷0')).toBeUndefined();
    expect(calculate('1.2.3')).toBeUndefined();
    expect(calculate('abc')).toBeUndefined();
  });

  it('has no answer below zero: an amount is never negative', () => {
    expect(calculate('5−9')).toBeUndefined();
  });

  it('tells a sum from a number', () => {
    expect(isExpression('12+3')).toBe(true);
    expect(isExpression('12.30')).toBe(false);
  });
});
