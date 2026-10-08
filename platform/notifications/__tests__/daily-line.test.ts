import { dailyLineFor, factsWindowStart } from '@/platform/notifications/daily-line';
import type { DailyFacts, LoanDue } from '@/platform/notifications/daily-line';

// October 2026: the 1st is a Thursday, the 4th a Sunday, the 31st a Saturday.
const day = (date: number, month = 9) => new Date(2026, month, date, 20, 0);
const key = (date: number, month = 10) => `2026-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
const facts = (entryDays: string[], loans: LoanDue[] = []): DailyFacts => ({ entryDays, lastEntryDay: [...entryDays].sort().pop() ?? null, loans });
const loan = (over: Partial<LoanDue> = {}): LoanDue => ({ type: 'lend', personName: 'Priya', dueDate: key(15), outstanding: 300, currency: 'USD', hasOwnReminder: false, ...over });

describe('dailyLineFor', () => {
  it('asks for a first entry when nothing was ever recorded', () => {
    expect(dailyLineFor(day(14), facts([]))).toEqual({ kind: 'first' });
  });

  it('gives the plain line of the weekday when yesterday was recorded', () => {
    expect(dailyLineFor(day(14), facts([key(13)]))).toEqual({ kind: 'weekday', day: 'wed' });
    expect(dailyLineFor(day(16), facts([key(15)]))).toEqual({ kind: 'weekday', day: 'fri' });
  });

  it('names the missing day after one day without an entry', () => {
    expect(dailyLineFor(day(14), facts([key(12)]))).toEqual({ kind: 'missedYesterday' });
  });

  it('names the day of the last entry after a few days, then stops counting after a week', () => {
    expect(dailyLineFor(day(14), facts([key(10)]))).toEqual({ kind: 'quietSince', since: new Date(2026, 9, 10) });
    expect(dailyLineFor(day(14), facts([key(8)]))).toEqual({ kind: 'quietSince', since: new Date(2026, 9, 8) });
    expect(dailyLineFor(day(14), facts([key(7)]))).toEqual({ kind: 'quiet' });
  });

  it('says so once a week while it stays quiet, and gives the ordinary line between', () => {
    expect(dailyLineFor(day(15), facts([key(7)]))).toEqual({ kind: 'weekday', day: 'thu' });
    expect(dailyLineFor(day(18), facts([key(7)]))).toEqual({ kind: 'weekday', day: 'sun' });
    expect(dailyLineFor(day(21), facts([key(7)]))).toEqual({ kind: 'quiet' });
    expect(dailyLineFor(day(1, 10), facts([key(7)]))).toEqual({ kind: 'monthStart', month: new Date(2026, 10, 1) });
  });

  it('counts the week on Sunday, Monday to Saturday', () => {
    // Sunday the 11th: its week began on Monday the 5th.
    expect(dailyLineFor(day(11), facts([key(4), key(5), key(7), key(7), key(10)]))).toEqual({ kind: 'weekEnd', count: 4 });
  });

  it('marks the first and the last day of a month', () => {
    expect(dailyLineFor(day(1), facts([key(30, 9)]))).toEqual({ kind: 'monthStart', month: new Date(2026, 9, 1) });
    expect(dailyLineFor(day(31), facts([key(3), key(20), key(30)]))).toEqual({ kind: 'monthEnd', month: new Date(2026, 9, 1), count: 3 });
  });

  it('puts money due tomorrow first, unless the loan reminds by itself', () => {
    const recorded = [key(13)];
    expect(dailyLineFor(day(14), facts(recorded, [loan()]))).toEqual({ kind: 'loanTomorrow', loanType: 'lend', personName: 'Priya', outstanding: 300, currency: 'USD' });
    expect(dailyLineFor(day(14), facts(recorded, [loan({ hasOwnReminder: true })])).kind).toBe('weekday');
    expect(dailyLineFor(day(14), facts(recorded, [loan({ personName: null })])).kind).toBe('weekday');
    expect(dailyLineFor(day(14), facts(recorded, [loan({ outstanding: 0 })])).kind).toBe('weekday');
    expect(dailyLineFor(day(13), facts([key(12)], [loan()])).kind).toBe('weekday');
  });

  it('never counts an entry made on the day itself or after it', () => {
    expect(dailyLineFor(day(11), facts([key(10), key(11), key(12)]))).toEqual({ kind: 'weekEnd', count: 1 });
  });
});

describe('factsWindowStart', () => {
  it('reaches back to the start of the month, or of a week that began before it', () => {
    expect(factsWindowStart(day(14))).toEqual(new Date(2026, 9, 1));
    expect(factsWindowStart(day(3))).toEqual(new Date(2026, 8, 27));
  });
});
