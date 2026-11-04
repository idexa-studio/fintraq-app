import { budgetPeriod, budgetStartDayOf, budgetStanding, crossingOf, limitWithRollover, monthProgress, perDayLeft } from '@/features/budgets/budget-rules';

describe('budgetStanding', () => {
  it('has room below four fifths of the limit', () => {
    expect(budgetStanding(320, 500)).toEqual({ share: 0.64, state: 'under', left: 180, over: 0 });
  });

  it('is near from four fifths, and over from the limit itself', () => {
    expect(budgetStanding(400, 500).state).toBe('near');
    expect(budgetStanding(499.99, 500).state).toBe('near');
    expect(budgetStanding(500, 500)).toMatchObject({ state: 'over', left: 0, over: 0 });
    expect(budgetStanding(540, 500)).toMatchObject({ state: 'over', left: 0, over: 40 });
  });

  it('treats refunds past zero as nothing spent, and a zero limit as already reached', () => {
    expect(budgetStanding(-20, 500)).toMatchObject({ share: 0, state: 'under', left: 500 });
    expect(budgetStanding(0, 0).state).toBe('under');
    expect(budgetStanding(10, 0)).toMatchObject({ state: 'over', over: 10 });
  });
});

describe('monthProgress', () => {
  it('counts the calendar month, short and leap months included', () => {
    expect(monthProgress(new Date(2026, 9, 9))).toEqual({ elapsed: 9 / 31, daysLeft: 22 });
    expect(monthProgress(new Date(2027, 1, 28))).toEqual({ elapsed: 1, daysLeft: 0 });
    expect(monthProgress(new Date(2028, 1, 28)).daysLeft).toBe(1);
  });
});

describe('perDayLeft', () => {
  it('shares what is left over today and the days still to come', () => {
    expect(perDayLeft(150, 2)).toBe(50);
    expect(perDayLeft(150, 0)).toBe(150);
    expect(perDayLeft(-20, 5)).toBe(0);
  });
});

describe('limitWithRollover', () => {
  it('adds what was left last month, and never carries an overspend', () => {
    expect(limitWithRollover(500, 380, true)).toBe(620);
    expect(limitWithRollover(500, 700, true)).toBe(500);
    expect(limitWithRollover(500, 380, false)).toBe(500);
  });
});

describe('crossingOf', () => {
  it('reports the expense that takes a budget into its last fifth, or to its limit', () => {
    expect(crossingOf(300, 420, 500)).toBe('near');
    expect(crossingOf(420, 500, 500)).toBe('over');
    expect(crossingOf(300, 620, 500)).toBe('over');
  });

  it('is quiet for an expense that changes nothing, so each warning is given once', () => {
    expect(crossingOf(100, 200, 500)).toBeNull();
    expect(crossingOf(420, 460, 500)).toBeNull();
    expect(crossingOf(520, 600, 500)).toBeNull();
  });
});

describe('a budget month that starts on another day', () => {
  it('is the calendar month when budgets start on the 1st', () => {
    expect(budgetPeriod(new Date(2026, 10, 2), 1)).toEqual({ start: '2026-11-01', end: '2026-11-30', previousStart: '2026-10-01', previousEnd: '2026-10-31' });
  });

  it('runs from the 28th to the 27th, so the 1st does not reset it', () => {
    // The customer's case: a budget set on 28 October is still running on 1 November.
    expect(budgetPeriod(new Date(2026, 10, 1), 28)).toEqual({ start: '2026-10-28', end: '2026-11-27', previousStart: '2026-09-28', previousEnd: '2026-10-27' });
    expect(budgetPeriod(new Date(2026, 10, 28), 28).start).toBe('2026-11-28');
    expect(budgetPeriod(new Date(2026, 10, 27), 28).end).toBe('2026-11-27');
  });

  it('crosses a year, and February', () => {
    expect(budgetPeriod(new Date(2027, 0, 5), 15)).toMatchObject({ start: '2026-12-15', end: '2027-01-14' });
    expect(budgetPeriod(new Date(2027, 1, 20), 28)).toMatchObject({ start: '2027-01-28', end: '2027-02-27' });
  });

  it('counts the days left in the budget month, not the calendar month', () => {
    expect(monthProgress(new Date(2026, 10, 1), 28)).toEqual({ elapsed: 5 / 31, daysLeft: 26 });
    expect(monthProgress(new Date(2026, 10, 27), 28).daysLeft).toBe(0);
  });

  it('reads anything but a day from 1 to 28 as the 1st', () => {
    expect([28, 1, 0, 29, 31, 2.5, '5', undefined].map(budgetStartDayOf)).toEqual([28, 1, 1, 1, 1, 1, 1, 1]);
  });
});
