import { budgetStanding, crossingOf, limitWithRollover, monthProgress, projectedSpend } from '@/features/budgets/budget-rules';

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

describe('projectedSpend', () => {
  it('carries the pace so far to the end of the month', () => {
    expect(projectedSpend(150, 0.5)).toBe(300);
    expect(projectedSpend(150, 1)).toBe(150);
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
