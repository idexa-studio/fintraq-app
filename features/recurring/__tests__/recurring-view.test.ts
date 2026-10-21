import type { RecurringRule } from '@/data/repositories/recurring';
import { catchUpWork, momentOf, occurrencePayment, stateOf, stillToCome, waitingItems } from '@/features/recurring/recurring-view';

const rule = (over: Partial<RecurringRule> = {}): RecurringRule => ({
  id: 1, type: 'DR', amount: 1200, accountId: 1, toAccountId: null, categoryId: 4, personId: null, note: 'Rent',
  cadence: 'month', anchorDate: '2026-08-01', time: '09:30', nextDue: '2026-09-01', mode: 'ask',
  ends: 'never', endDate: null, endTimes: null, occurrences: 1, paused: false, createdAt: '', updatedAt: '',
  ...over,
});
const inRupees = (over: Partial<RecurringRule> = {}) => ({ ...rule(over), account: { currency: 'INR' } });

describe('what an item is doing', () => {
  it('says stopped before ended, and ended before paused', () => {
    expect(stateOf(rule())).toBe('running');
    expect(stateOf(rule({ paused: true }))).toBe('paused');
    expect(stateOf(rule({ paused: true, ends: 'times', endTimes: 1 }))).toBe('ended');
    expect(stateOf(rule({ paused: true, ends: 'times', endTimes: 1, accountId: null }))).toBe('stopped');
  });
});

describe('what an occurrence makes', () => {
  it('is dated its own day at the item’s time, on the phone’s clock', () => {
    expect(momentOf('2026-09-01', '09:30')).toEqual(new Date(2026, 8, 1, 9, 30));
  });

  it('copies the item, with the amount changed when it was changed on Add', () => {
    const payment = occurrencePayment(rule({ personId: 7 }), '2026-09-01', 1250);
    expect(payment).toEqual({ type: 'DR', amount: 1250, accountId: 1, toAccountId: null, categoryId: 4, personId: 7, note: 'Rent', datetime: new Date(2026, 8, 1, 9, 30).toISOString() });
  });

  it('keeps a destination only for a transfer', () => {
    expect(occurrencePayment(rule({ toAccountId: 2 }), '2026-09-01').toAccountId).toBeNull();
    expect(occurrencePayment(rule({ type: 'TR', toAccountId: 2 }), '2026-09-01').toAccountId).toBe(2);
  });

  it('makes nothing for a stopped item', () => {
    expect(() => occurrencePayment(rule({ categoryId: null }), '2026-09-01')).toThrow();
  });
});

describe('catching up on items added by themselves', () => {
  it('makes each missed one, oldest first, counting each', () => {
    const work = catchUpWork([rule({ mode: 'add' })], '2026-11-15');
    expect(work.map((w) => w.day)).toEqual(['2026-09-01', '2026-10-01', '2026-11-01']);
    expect(work.map((w) => w.then)).toEqual([
      { nextDue: '2026-10-01', occurrences: 2 },
      { nextDue: '2026-11-01', occurrences: 3 },
      { nextDue: '2026-12-01', occurrences: 4 },
    ]);
  });

  it('leaves asked items to Home, and makes nothing while paused', () => {
    expect(catchUpWork([rule(), rule({ id: 2, mode: 'add', paused: true })], '2026-11-15')).toEqual([]);
  });

  it('interleaves two items by day', () => {
    const weekly = rule({ id: 2, mode: 'add', cadence: 'week', anchorDate: '2026-08-25', nextDue: '2026-09-01' });
    const work = catchUpWork([rule({ mode: 'add' }), weekly], '2026-09-08');
    expect(work.map((w) => [w.day, w.rule.id])).toEqual([['2026-09-01', 1], ['2026-09-01', 2], ['2026-09-08', 2]]);
  });
});

describe('items waiting to be asked about', () => {
  it('offers only the oldest day of each, and says how many wait', () => {
    const [waiting] = waitingItems([rule()], '2026-11-15');
    expect(waiting).toMatchObject({ day: '2026-09-01', count: 3, then: { nextDue: '2026-10-01', occurrences: 2 } });
  });

  it('offers nothing before the day, nor for items added by themselves', () => {
    expect(waitingItems([rule()], '2026-08-31')).toEqual([]);
    expect(waitingItems([rule({ mode: 'add' })], '2026-11-15')).toEqual([]);
  });
});

describe('what is still to come on a budget this month', () => {
  it('adds every expense not yet made this month, in the budget’s category and currency', () => {
    const weekly = inRupees({ id: 2, amount: 100, cadence: 'week', anchorDate: '2026-09-02', nextDue: '2026-09-16' });
    // Rent on the 1st is still waiting (asked, not yet added); the weekly falls on the 16th, 23rd and 30th.
    expect(stillToCome([inRupees(), weekly], { categoryId: 4, currency: 'INR' }, '2026-09-15')).toBe(1200 + 300);
  });

  it('counts nothing made already, nothing next month, and nothing paused', () => {
    expect(stillToCome([inRupees({ nextDue: '2026-10-01' })], { categoryId: null, currency: 'INR' }, '2026-09-15')).toBe(0);
    expect(stillToCome([inRupees({ paused: true })], { categoryId: null, currency: 'INR' }, '2026-09-15')).toBe(0);
  });

  it('leaves out income, other categories and other currencies, but not for the budget over all spending', () => {
    const items = [inRupees({ type: 'CR' }), inRupees({ categoryId: 5, amount: 50 }), { ...rule(), account: { currency: 'USD' } }];
    expect(stillToCome(items, { categoryId: 4, currency: 'INR' }, '2026-09-15')).toBe(0);
    expect(stillToCome(items, { categoryId: null, currency: 'INR' }, '2026-09-15')).toBe(50);
  });
});
