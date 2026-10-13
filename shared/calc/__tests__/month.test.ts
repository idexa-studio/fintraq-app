import { buildHeatmap, buildMonthPulse, heatLevel, heatmapStart } from '@/shared/calc/month';

describe('buildMonthPulse', () => {
  const now = new Date(2026, 8, 10); // 10 September, 30-day month

  it('derives pace, projection and comparison with last month', () => {
    const pulse = buildMonthPulse({ income: 5000, expense: 300, lastMonthToDate: 200, lastMonthTotal: 900 }, now);
    expect(pulse.dayOfMonth).toBe(10);
    expect(pulse.daysInMonth).toBe(30);
    expect(pulse.monthProgress).toBeCloseTo(1 / 3);
    expect(pulse.dailyAverage).toBe(30);
    // 300 so far, plus the 700 the rest of last month cost.
    expect(pulse.projected).toBe(1000);
    expect(pulse.basis).toBe('lastMonth');
    expect(pulse.deltaVsLastMonth).toBe(50);
    expect(pulse.shareOfLastMonth).toBeCloseTo(1 / 3);
  });

  it('has no comparison without last-month spending', () => {
    const pulse = buildMonthPulse({ income: 0, expense: 100, lastMonthToDate: 0, lastMonthTotal: 0 }, now);
    expect(pulse.deltaVsLastMonth).toBeNull();
    expect(pulse.shareOfLastMonth).toBeNull();
    // Nothing to go by, so the daily rate so far is carried to the end: 10 a day for 30 days.
    expect(pulse.projected).toBe(300);
    expect(pulse.basis).toBe('pace');
  });

  it('counts a bill paid once only once: rent on the 1st does not repeat every day', () => {
    const pulse = buildMonthPulse({ income: 0, expense: 2000, lastMonthToDate: 2000, lastMonthTotal: 3000 }, now);
    expect(pulse.projected).toBe(3000);
  });
});

describe('heatLevel', () => {
  it('buckets relative to the busiest day', () => {
    expect(heatLevel(0, 100)).toBe(0);
    expect(heatLevel(10, 100)).toBe(1);
    expect(heatLevel(30, 100)).toBe(2);
    expect(heatLevel(50, 100)).toBe(3);
    expect(heatLevel(100, 100)).toBe(4);
    expect(heatLevel(10, 0)).toBe(0);
  });
});

describe('buildHeatmap', () => {
  const today = new Date(2026, 8, 30); // Wednesday 30 September 2026

  it('builds Monday-first weeks ending with the current week', () => {
    const grid = buildHeatmap(new Map(), today, 5);
    expect(grid).toHaveLength(5);
    expect(grid.every((row) => row.length === 7)).toBe(true);
    expect(grid[0]![0]!.date).toBe('2026-08-31');
    expect(grid[4]![0]!.date).toBe('2026-09-28');
    expect(heatmapStart(today, 5)).toBe('2026-08-31');
  });

  it('marks today, future slots and spend levels', () => {
    const spend = new Map([
      ['2026-09-30', 100],
      ['2026-09-29', 20],
      ['2026-10-01', 999], // future: ignored
    ]);
    const lastWeek = buildHeatmap(spend, today, 5)[4]!;
    expect(lastWeek[2]).toMatchObject({ date: '2026-09-30', isToday: true, level: 4 });
    expect(lastWeek[1]).toMatchObject({ date: '2026-09-29', level: 2 });
    expect(lastWeek[3]).toMatchObject({ date: '2026-10-01', isFuture: true, amount: 0, level: 0 });
  });

  it('crosses month and year boundaries on local dates', () => {
    const grid = buildHeatmap(new Map(), new Date(2026, 0, 1), 2); // Thursday 1 January 2026
    expect(grid[0]![0]!.date).toBe('2025-12-22');
    expect(grid[1]![3]!.date).toBe('2026-01-01');
  });
});
