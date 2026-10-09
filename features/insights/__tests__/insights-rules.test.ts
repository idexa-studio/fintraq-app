import { allowedPeriod, chartRuns, findingsToShow, heatValues, pace, peakIndex, weekFromMonday } from '@/features/insights/insights-rules';
import { analyticsWindow } from '@/shared/calc/analytics';
import type { HeatCell } from '@/shared/calc/month';

const NOW = new Date(2026, 9, 8);

describe('Insights periods', () => {
  it('keeps a free period for anyone and a longer one only with Pro', () => {
    expect(allowedPeriod(7, false)).toBe(7);
    expect(allowedPeriod(30, false)).toBe(7);
    expect(allowedPeriod(30, true)).toBe(30);
    expect(allowedPeriod(90, true)).toBe(90);
    expect(allowedPeriod(365, false)).toBe(7);
  });
});

describe('the period chart', () => {
  it('draws a bar a day for a week, with zero where nothing was spent', () => {
    const runs = chartRuns(analyticsWindow(7, NOW), [{ slot: '2026-10-08', expense: 12 }, { slot: '2026-10-05', expense: 30 }]);
    expect(runs).toHaveLength(7);
    expect(runs[0]).toEqual({ start: '2026-10-02', end: '2026-10-02', value: 0 });
    expect(runs.map((run) => run.value)).toEqual([0, 0, 0, 30, 0, 0, 12]);
  });

  it('draws a bar a week for a month, the last one always the latest seven days', () => {
    const runs = chartRuns(analyticsWindow(30, NOW), [{ slot: '2026-10-08', expense: 10 }, { slot: '2026-10-02', expense: 5 }, { slot: '2026-10-01', expense: 99 }]);
    expect(runs).toHaveLength(5);
    expect(runs.at(-1)).toEqual({ start: '2026-10-02', end: '2026-10-08', value: 15 });
    // The oldest bar holds the two days left over.
    expect(runs[0]).toEqual({ start: '2026-09-09', end: '2026-09-10', value: 0 });
  });

  it('draws thirteen weekly bars for three months and twelve monthly ones for a year', () => {
    expect(chartRuns(analyticsWindow(90, NOW), [])).toHaveLength(13);
    const year = chartRuns(analyticsWindow(365, NOW), [{ slot: '2026-10', expense: 400 }]);
    expect(year).toHaveLength(12);
    expect(year.at(-1)).toEqual({ start: '2026-10', end: '2026-10', value: 400 });
  });

  it('marks the tallest bar, or none when nothing was spent', () => {
    expect(peakIndex([0, 30, 12, 30])).toBe(1);
    expect(peakIndex([0, 0])).toBeUndefined();
  });
});

describe('rhythm', () => {
  it('lays the week out from Monday, with zero for a quiet day', () => {
    expect(weekFromMonday([{ dow: 0, total: 70 }, { dow: 6, total: 118 }, { dow: 1, total: 48 }])).toEqual([
      { dow: 1, total: 48 }, { dow: 2, total: 0 }, { dow: 3, total: 0 }, { dow: 4, total: 0 }, { dow: 5, total: 0 }, { dow: 6, total: 118 }, { dow: 0, total: 70 },
    ]);
  });

  it('shades the calendar up to today and says where today is', () => {
    const cell = (level: 0 | 1 | 2 | 3 | 4, over: Partial<HeatCell> = {}): HeatCell => ({ date: '', amount: 0, level, isToday: false, isFuture: false, ...over });
    expect(heatValues([[cell(0), cell(2), cell(4, { isToday: true }), cell(0, { isFuture: true })]])).toEqual({ values: [0, 0.5, 1], today: 2 });
  });
});

describe('where the month is heading', () => {
  it('measures spending and its course against last month', () => {
    expect(pace({ expense: 860, projected: 1070, lastMonthTotal: 1000, monthProgress: 0.29 })).toEqual({ spent: 0.86, projected: 1.07, today: 0.29 });
  });

  it('has nothing to measure against without a last month', () => {
    expect(pace({ expense: 860, projected: 1070, lastMonthTotal: 0, monthProgress: 0.29 })).toBeNull();
  });
});

describe('findingsToShow', () => {
  const findings = [{ id: 'weekly-spend' }, { id: 'savings-rate' }, { id: 'cat-3' }, { id: 'weekly-summary' }, { id: 'monthly-net' }];

  it('leaves out what the 7-day summary already says', () => {
    expect(findingsToShow(findings, 7, new Set()).map((f) => f.id)).toEqual(['savings-rate', 'cat-3', 'monthly-net']);
    expect(findingsToShow(findings, 30, new Set())).toHaveLength(5);
  });

  it('leaves out a category that has a budget with room', () => {
    expect(findingsToShow(findings, 30, new Set([3])).some((f) => f.id === 'cat-3')).toBe(false);
    expect(findingsToShow(findings, 30, new Set([4])).some((f) => f.id === 'cat-3')).toBe(true);
  });
});
