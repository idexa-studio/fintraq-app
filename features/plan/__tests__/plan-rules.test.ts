import { daysUntil, dueWording, loanTotals, planLoans } from '@/features/plan/plan-rules';

const loan = (id: number, over = {}) => ({ id, type: 'lend' as const, currency: 'USD', outstanding: 100, dueDate: null as string | null, computedStatus: 'active' as const, ...over });
const TODAY = new Date(2026, 9, 8);

describe('the Plan tab', () => {
  it('puts loans in the order they need attention', () => {
    const { dated, undated, settled } = planLoans([
      loan(1, { dueDate: '2026-11-02' }),
      loan(2, { dueDate: '2026-09-30', computedStatus: 'overdue' }),
      loan(3, { outstanding: 50 }),
      loan(4, { outstanding: 900 }),
      loan(5, { computedStatus: 'repaid', dueDate: '2026-08-01' }),
      loan(6, { currency: 'EUR', dueDate: '2026-10-09' }),
    ], 'USD');
    expect(dated.map((l) => l.id)).toEqual([2, 1]);
    expect(undated.map((l) => l.id)).toEqual([4, 3]);
    expect(settled.map((l) => l.id)).toEqual([5]);
  });

  it('adds up what is owed each way, open loans in the one currency only', () => {
    expect(loanTotals([loan(1), loan(2, { type: 'borrow', outstanding: 40 }), loan(3, { computedStatus: 'repaid' }), loan(4, { currency: 'EUR' })], 'USD')).toEqual({ owed: 100, owe: 40 });
  });

  it('counts whole calendar days to the due day', () => {
    expect(daysUntil('2026-10-08', TODAY)).toBe(0);
    expect(daysUntil('2026-11-02', TODAY)).toBe(25);
    expect(daysUntil('2026-10-05', TODAY)).toBe(-3);
    // Late in the evening, tomorrow is still one day off.
    expect(daysUntil('2026-10-09', new Date(2026, 9, 8, 23, 59))).toBe(1);
  });

  it('words a due day by how far off it is', () => {
    expect(dueWording('2026-10-05', TODAY)).toEqual({ key: 'overdue', count: 3 });
    expect(dueWording('2026-10-08', TODAY)).toEqual({ key: 'today', count: 0 });
    expect(dueWording('2026-10-09', TODAY)).toEqual({ key: 'tomorrow', count: 1 });
    expect(dueWording('2026-11-02', TODAY)).toEqual({ key: 'inDays', count: 25 });
  });
});
