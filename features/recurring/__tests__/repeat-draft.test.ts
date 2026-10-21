import type { RecurringRule } from '@/data/repositories/recurring';
import { NO_REPEAT, changedRuleOf, newRuleOf, repeatBlocker } from '@/features/recurring/repeat-draft';
import type { RulePayment } from '@/features/recurring/repeat-draft';

const payment: RulePayment = { type: 'DR', amount: 1200, accountId: 1, toAccountId: 9, categoryId: 4, personId: null, note: 'Rent' };
const monthly = { ...NO_REPEAT, cadence: 'month' as const };
const when = new Date(2026, 9, 31, 8, 5);

const rule = (over: Partial<RecurringRule> = {}): RecurringRule => ({
  id: 1, ...payment, toAccountId: null, cadence: 'month', anchorDate: '2026-08-01', time: '09:30', nextDue: '2026-09-01', mode: 'ask',
  ends: 'never', endDate: null, endTimes: null, occurrences: 1, paused: false, createdAt: '', updatedAt: '',
  ...over,
});

describe('saving a transaction with Repeat', () => {
  it('repeats from its day and time, counts it as the first time, and is next due a period on', () => {
    expect(newRuleOf(payment, monthly, when)).toEqual({
      ...payment, toAccountId: null, cadence: 'month', anchorDate: '2026-10-31', time: '08:05', nextDue: '2026-11-30', mode: 'ask',
      ends: 'never', endDate: null, endTimes: null, occurrences: 1, paused: false,
    });
  });

  it('keeps only the end that was chosen', () => {
    const rule = newRuleOf(payment, { ...monthly, ends: 'times', endTimes: 6, endDate: '2027-01-01' }, when);
    expect([rule.ends, rule.endTimes, rule.endDate]).toEqual(['times', 6, null]);
  });
});

describe('an end that is not complete', () => {
  it('asks for a last day after the first', () => {
    expect(repeatBlocker({ ...monthly, ends: 'date' }, '2026-10-31')).toBe('endDate');
    expect(repeatBlocker({ ...monthly, ends: 'date', endDate: '2026-10-31' }, '2026-10-31')).toBe('endDate');
    expect(repeatBlocker({ ...monthly, ends: 'date', endDate: '2026-11-30' }, '2026-10-31')).toBeNull();
  });

  it('asks for at least two times, whole', () => {
    expect(repeatBlocker({ ...monthly, ends: 'times', endTimes: 1 }, '2026-10-31')).toBe('endTimes');
    expect(repeatBlocker({ ...monthly, ends: 'times', endTimes: 2.5 }, '2026-10-31')).toBe('endTimes');
    expect(repeatBlocker({ ...monthly, ends: 'times', endTimes: 2 }, '2026-10-31')).toBeNull();
  });

  it('asks nothing when it does not repeat', () => {
    expect(repeatBlocker({ ...NO_REPEAT, ends: 'date' }, '2026-10-31')).toBeNull();
  });
});

describe('changing an item', () => {
  const next = new Date(2026, 8, 1, 9, 30);

  it('changes what it makes without moving its days', () => {
    const changed = changedRuleOf(rule(), { ...payment, amount: 1300 }, monthly, next, '2026-08-20');
    expect(changed).toMatchObject({ amount: 1300, anchorDate: '2026-08-01', nextDue: '2026-09-01', time: '09:30' });
  });

  it('starts again from a new day', () => {
    expect(changedRuleOf(rule(), payment, monthly, new Date(2026, 8, 5, 9, 30), '2026-08-20')).toMatchObject({ anchorDate: '2026-09-05', nextDue: '2026-09-05' });
  });

  it('carries a repaired item on from after today, letting go what fell while it was stopped', () => {
    const stopped = rule({ accountId: null, mode: 'add' });
    expect(changedRuleOf(stopped, payment, monthly, next, '2026-11-15')).toMatchObject({ accountId: 1, nextDue: '2026-12-01' });
  });

  it('leaves a waiting item waiting: only a stopped one lets days go', () => {
    expect(changedRuleOf(rule(), payment, monthly, next, '2026-11-15')).toMatchObject({ nextDue: '2026-09-01' });
  });
});
