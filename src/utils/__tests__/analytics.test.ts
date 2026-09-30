import { monthEndForecast, percentChange, sumBuckets, weekdayExtremes, withShares } from '@/src/utils/analytics';

describe('sumBuckets', () => {
  it('totals income and expense and derives net', () => {
    expect(sumBuckets([{ income: 100, expense: 30 }, { income: 0, expense: 20 }])).toEqual({ income: 100, expense: 50, net: 50 });
    expect(sumBuckets([])).toEqual({ income: 0, expense: 0, net: 0 });
  });
});

describe('percentChange', () => {
  it('compares against the previous period', () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
  });
  it('has no baseline for zero or missing previous values', () => {
    expect(percentChange(10, 0)).toBeNull();
    expect(percentChange(10, null)).toBeNull();
    expect(percentChange(10, undefined)).toBeNull();
  });
});

describe('monthEndForecast', () => {
  it('projects the daily rate over the days left in the month', () => {
    expect(monthEndForecast(10, new Date(2026, 8, 20))).toBe(100); // 30-day September, 10 days left
    expect(monthEndForecast(10, new Date(2024, 1, 29))).toBe(0); // leap-day end of February
  });
});

describe('weekdayExtremes', () => {
  it('finds the busiest and quietest days with spending', () => {
    expect(weekdayExtremes([{ dow: 0, total: 0 }, { dow: 1, total: 40 }, { dow: 5, total: 90 }, { dow: 6, total: 10 }])).toEqual({ peak: 5, lowest: 6 });
  });
  it('needs at least two distinct spending days', () => {
    expect(weekdayExtremes([{ dow: 1, total: 40 }])).toBeNull();
    expect(weekdayExtremes([{ dow: 1, total: 40 }, { dow: 2, total: 0 }])).toBeNull();
  });
});

describe('withShares', () => {
  it('splits the positive total and gives negative amounts no share', () => {
    const shares = withShares([{ amount: 300 }, { amount: 100 }, { amount: -50 }]).map((i) => i.share);
    expect(shares).toEqual([0.75, 0.25, 0]);
  });
  it('is all zero when nothing is positive', () => {
    expect(withShares([{ amount: 0 }, { amount: -5 }]).map((i) => i.share)).toEqual([0, 0]);
  });
});
