import { addDays, dueOccurrences, firstDue, hasEnded, nextAfter, occurrence, pendingThrough, rescheduled, resumedNextDue, stoppedBecause, upcoming } from '@/shared/calc/recurrence';
import type { RuleTargets, RuleTiming } from '@/shared/calc/recurrence';

const rule = (over: Partial<RuleTiming & RuleTargets & { id: number }> = {}): RuleTiming & RuleTargets & { id: number } => ({
  id: 1, type: 'DR', accountId: 1, toAccountId: null, categoryId: 1,
  cadence: 'month', anchorDate: '2026-01-31', nextDue: '2026-02-28', ends: 'never', endDate: null, endTimes: null, occurrences: 0, paused: false,
  ...over,
});

describe('the days an item falls on', () => {
  it('steps weekly, every two weeks, monthly and yearly from the first day', () => {
    expect(occurrence('2026-10-21', 'week', 1)).toBe('2026-10-28');
    expect(occurrence('2026-10-21', 'twoWeeks', 2)).toBe('2026-11-18');
    expect(occurrence('2026-10-21', 'month', 3)).toBe('2027-01-21');
    expect(occurrence('2026-10-21', 'year', 1)).toBe('2027-10-21');
  });

  it('puts the 31st on the last day of a shorter month, and goes back to the 31st after', () => {
    expect([1, 2, 3, 4].map((n) => occurrence('2026-01-31', 'month', n))).toEqual(['2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31']);
    expect(occurrence('2027-12-31', 'month', 2)).toBe('2028-02-29');
  });

  it('puts 29 February on the 28th outside leap years, and back on the 29th in one', () => {
    expect([1, 2, 3, 4].map((n) => occurrence('2024-02-29', 'year', n))).toEqual(['2025-02-28', '2026-02-28', '2027-02-28', '2028-02-29']);
  });

  it('crosses years and month ends by the calendar, whatever the clock', () => {
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04');
    // A week across the European clock change is still seven days on the calendar.
    expect(addDays('2026-10-21', 7)).toBe('2026-10-28');
    expect(addDays('2026-03-26', 7)).toBe('2026-04-02');
  });

  it('is next due one period after the first transaction', () => {
    expect(firstDue('2026-10-21', 'month')).toBe('2026-11-21');
    expect(firstDue('2026-10-21', 'week')).toBe('2026-10-28');
  });

  it('finds the first day strictly after a given day, far from the first', () => {
    expect(nextAfter('2026-01-31', 'month', '2026-02-28')).toBe('2026-03-31');
    // 1 January 2020 and 21 October 2026 are both Wednesdays: the 21st is an occurrence, so the next is a week on.
    expect(nextAfter('2020-01-01', 'week', '2026-10-21')).toBe('2026-10-28');
    expect(nextAfter('2026-10-21', 'month', '2026-10-20')).toBe('2026-10-21');
  });
});

describe('catching up', () => {
  it('makes every missed occurrence, oldest first, after three months away', () => {
    expect(dueOccurrences(rule(), '2026-05-30')).toEqual(['2026-02-28', '2026-03-31', '2026-04-30']);
  });

  it('makes nothing before its day, and the day itself on the day', () => {
    expect(dueOccurrences(rule(), '2026-02-27')).toEqual([]);
    expect(dueOccurrences(rule(), '2026-02-28')).toEqual(['2026-02-28']);
  });

  it('never offers an occurrence twice: once passed, the item is due from the next', () => {
    const passed = rule({ nextDue: '2026-03-31', occurrences: 1 });
    expect(dueOccurrences(passed, '2026-03-30')).toEqual([]);
  });

  it('stops at an end date, the end date itself included', () => {
    expect(dueOccurrences(rule({ ends: 'date', endDate: '2026-03-31' }), '2026-12-31')).toEqual(['2026-02-28', '2026-03-31']);
  });

  it('stops after a number of times, counting those already passed', () => {
    expect(dueOccurrences(rule({ ends: 'times', endTimes: 3, occurrences: 1 }), '2026-12-31')).toEqual(['2026-02-28', '2026-03-31']);
  });

  it('makes nothing while paused, and lets go of what fell while paused on resume', () => {
    expect(dueOccurrences(rule({ paused: true }), '2026-12-31')).toEqual([]);
    expect(resumedNextDue(rule(), '2026-06-15')).toBe('2026-06-30');
  });
});

describe('an item that cannot run', () => {
  it('says which deleted thing stopped it', () => {
    expect(stoppedBecause({ type: 'DR', accountId: null, toAccountId: null, categoryId: 1 })).toBe('account');
    expect(stoppedBecause({ type: 'DR', accountId: 1, toAccountId: null, categoryId: null })).toBe('category');
    expect(stoppedBecause({ type: 'TR', accountId: 1, toAccountId: null, categoryId: null })).toBe('toAccount');
    // A transfer is recorded with a category like any transaction, so losing it stops a transfer too.
    expect(stoppedBecause({ type: 'TR', accountId: 1, toAccountId: 2, categoryId: null })).toBe('category');
    expect(stoppedBecause({ type: 'TR', accountId: 1, toAccountId: 2, categoryId: 3 })).toBeNull();
  });

  it('makes nothing and shows nothing upcoming while stopped', () => {
    expect(dueOccurrences(rule({ categoryId: null }), '2026-12-31')).toEqual([]);
    expect(upcoming([rule({ categoryId: null })], '2026-02-01')).toEqual([]);
  });

  it('has ended once past its end date or its number of times', () => {
    expect(hasEnded({ ends: 'date', endDate: '2026-03-31', endTimes: null, occurrences: 0, nextDue: '2026-04-30' })).toBe(true);
    expect(hasEnded({ ends: 'times', endDate: null, endTimes: 2, occurrences: 2, nextDue: '2026-04-30' })).toBe(true);
    expect(hasEnded({ ends: 'never', endDate: null, endTimes: null, occurrences: 99, nextDue: '2030-01-01' })).toBe(false);
  });
});

describe('upcoming', () => {
  it('lists the next 30 days in date order, each item as often as it falls', () => {
    const weekly = rule({ id: 2, cadence: 'week', anchorDate: '2026-02-04', nextDue: '2026-02-11' });
    expect(upcoming([rule(), weekly], '2026-02-10')).toEqual([
      { day: '2026-02-11', ruleId: 2 }, { day: '2026-02-18', ruleId: 2 }, { day: '2026-02-25', ruleId: 2 },
      { day: '2026-02-28', ruleId: 1 }, { day: '2026-03-04', ruleId: 2 }, { day: '2026-03-11', ruleId: 2 },
    ]);
  });

  it('leaves out paused items and days past their end', () => {
    expect(upcoming([rule({ paused: true })], '2026-02-01')).toEqual([]);
    expect(upcoming([rule({ ends: 'times', endTimes: 0 })], '2026-02-01')).toEqual([]);
  });
});

describe('what is still to be made', () => {
  it('lists every day up to a given one, paused or not: running is asked separately', () => {
    expect(pendingThrough(rule({ paused: true }), '2026-04-30')).toEqual(['2026-02-28', '2026-03-31', '2026-04-30']);
    expect(pendingThrough(rule({ ends: 'times', endTimes: 2, occurrences: 1 }), '2026-12-31')).toEqual(['2026-02-28']);
  });
});

describe('changing an item', () => {
  const item = { anchorDate: '2026-01-31', cadence: 'month' as const, nextDue: '2026-02-28' };

  it('leaves its days alone when only what it makes changes', () => {
    expect(rescheduled(item, { cadence: 'month', day: '2026-02-28' })).toEqual(item);
  });

  it('starts again from a new day, or with a new cadence from its next day', () => {
    expect(rescheduled(item, { cadence: 'month', day: '2026-03-05' })).toEqual({ anchorDate: '2026-03-05', cadence: 'month', nextDue: '2026-03-05' });
    expect(rescheduled(item, { cadence: 'week', day: '2026-02-28' })).toEqual({ anchorDate: '2026-02-28', cadence: 'week', nextDue: '2026-02-28' });
  });
});
