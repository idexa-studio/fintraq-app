import { analyticsWindow, averageByWeekday, monthEndForecast, percentChange, sumBuckets, toTrendBars, weekdayExtremes, weekdayOccurrences, windowSlots, withShares } from '@/shared/calc/analytics';

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

describe('toTrendBars', () => {
  const series = (n: number) => Array.from({ length: n }, (_, i) => ({ label: `d${i + 1}`, expense: 1 }));

  it('keeps short series as one bar per bucket', () => {
    expect(toTrendBars(series(7))).toEqual(series(7).map((b) => ({ label: b.label, amount: 1 })));
  });

  it('sums long series into weekly bars ending on the latest day', () => {
    const bars = toTrendBars(series(90));
    expect(bars).toHaveLength(13);
    expect(bars[bars.length - 1]).toEqual({ label: 'd84 – d90', amount: 7 });
    expect(bars[0]).toEqual({ label: 'd1 – d6', amount: 6 });
    expect(bars.reduce((s, b) => s + b.amount, 0)).toBe(90);
  });
});

describe('analyticsWindow', () => {
  const now = new Date(2026, 8, 30, 15, 0); // Wed 30 Sep 2026

  it('covers exactly N days ending today', () => {
    const w = analyticsWindow(7, now);
    expect(w).toMatchObject({ start: '2026-09-24', end: '2026-09-30', days: 7, byMonth: false });
    expect(windowSlots(w)).toHaveLength(7);
  });

  it('compares with the same number of days just before', () => {
    const w = analyticsWindow(30, now);
    expect(w).toMatchObject({ start: '2026-09-01', end: '2026-09-30', days: 30, previousStart: '2026-08-02', previousEnd: '2026-08-31' });
  });

  it('runs 12 calendar months for the year view, current month included', () => {
    const w = analyticsWindow(365, now);
    expect(w).toMatchObject({ start: '2025-10-01', end: '2026-09-30', byMonth: true });
    expect(windowSlots(w)).toEqual(['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']);
    expect(w.previousEnd).toBe('2025-09-30');
  });
});

describe('weekday averages', () => {
  it('counts each weekday in the window', () => {
    // 1-30 Sep 2026: starts Tuesday, so Tue and Wed occur 5 times, the rest 4.
    const counts = weekdayOccurrences(analyticsWindow(30, new Date(2026, 8, 30)));
    expect(counts).toEqual([4, 4, 5, 5, 4, 4, 4]);
  });

  it('divides by occurrences, so a weekday seen five times is not inflated', () => {
    const w = analyticsWindow(30, new Date(2026, 8, 30));
    expect(averageByWeekday([{ dow: 2, total: 100 }, { dow: 1, total: 80 }], w)).toEqual([{ dow: 2, total: 20 }, { dow: 1, total: 20 }]);
  });
});

describe('withShares against a whole', () => {
  it('uses the given total so shares match the period, not just the listed items', () => {
    expect(withShares([{ amount: 25 }, { amount: 25 }], 100).map((i) => i.share)).toEqual([0.25, 0.25]);
  });
});
