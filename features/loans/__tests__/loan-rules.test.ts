import type { LoanRepaymentRow } from '@/data/repositories/loans';
import { loanBlockerOf, loanPayloadOf, loanStory, newLoanDraft, repaidShare, repaymentAccounts, repaymentBlockerOf, timeOf, timeText } from '@/features/loans/loan-rules';

const draft = (over = {}) => ({ ...newLoanDraft('lend', 7, 2), amountText: '120', ...over });
const payment = (id: number, type: 'CR' | 'DR', amount: number, datetime: string): LoanRepaymentRow => ({ id, type, amount, datetime, note: '', accountName: 'Everyday', accountCurrency: 'USD' });

describe('a new loan', () => {
  it('needs an amount, an account, and for money lent, a person', () => {
    expect(loanBlockerOf(draft({ amountText: '' }))).toBe('amount');
    expect(loanBlockerOf(draft({ amountText: '0' }))).toBe('amount');
    expect(loanBlockerOf(draft({ personId: null }))).toBe('person');
    expect(loanBlockerOf(draft({ accountId: null }))).toBe('account');
    expect(loanBlockerOf(draft())).toBeNull();
  });

  it('lets money be borrowed from nobody in particular', () => {
    expect(loanBlockerOf(draft({ type: 'borrow', personId: null }))).toBeNull();
  });

  it('saves the loan in the account\'s currency, with the due day as picked', () => {
    const now = new Date('2026-10-08T10:00:00Z');
    const saved = loanPayloadOf(draft({ note: ' For the car ', dueDate: new Date(2026, 10, 30) }), { id: 2, currency: 'EUR' }, now);
    expect(saved.data).toEqual({ personId: 7, type: 'lend', principal: 120, currency: 'EUR', accountId: 2, dueDate: '2026-11-30', note: 'For the car' });
    expect(saved.txPayload).toEqual({ note: 'For the car', datetime: '2026-10-08T10:00:00.000Z' });
    expect(loanPayloadOf(draft({ type: 'borrow', personId: null }), { id: 2, currency: 'USD' }, now).data).toMatchObject({ personId: undefined, dueDate: undefined });
  });
});

describe('a repayment', () => {
  it('is more than nothing and no more than is outstanding', () => {
    expect(repaymentBlockerOf('', 100, 1)).toBe('amount');
    expect(repaymentBlockerOf('100.01', 100, 1)).toBe('tooMuch');
    expect(repaymentBlockerOf('100', 100, 1)).toBeNull();
    expect(repaymentBlockerOf('40', 100, null)).toBe('account');
  });

  it('accepts exactly what is owed despite a rounding crumb', () => {
    expect(repaymentBlockerOf('33.33', 33.330000000000005, 1)).toBeNull();
    expect(repaymentBlockerOf('33.33', 33.32999999999999, 1)).toBeNull();
  });

  it('offers only accounts in the loan\'s currency, the loan\'s own first', () => {
    const accounts = [{ id: 1, currency: 'USD' }, { id: 2, currency: 'EUR' }, { id: 3, currency: 'USD' }];
    expect(repaymentAccounts(accounts, { currency: 'USD', accountId: 3 }).map((a) => a.id)).toEqual([3, 1]);
  });
});

describe('the loan as a story', () => {
  const lent = payment(1, 'DR', 500, '2026-08-01T09:00:00Z');
  const back1 = payment(2, 'CR', 200, '2026-09-01T09:00:00Z');
  const back2 = payment(3, 'CR', 300, '2026-10-01T09:00:00Z');

  it('tells it oldest first and ends with what is left', () => {
    const story = loanStory({ type: 'lend', outstanding: 300, dueDate: '2026-11-01', computedStatus: 'active' }, [back1, lent]);
    expect(story.map((event) => event.kind)).toEqual(['opened', 'repayment', 'remaining']);
    expect(story[2]).toEqual({ kind: 'remaining', amount: 300, due: '2026-11-01', overdue: false });
  });

  it('says when what is left is overdue', () => {
    expect(loanStory({ type: 'lend', outstanding: 300, dueDate: '2026-09-15', computedStatus: 'overdue' }, [lent]).at(-1)).toMatchObject({ kind: 'remaining', overdue: true });
  });

  it('ends settled once repaid', () => {
    expect(loanStory({ type: 'lend', outstanding: 0, dueDate: null, computedStatus: 'repaid' }, [lent, back1, back2]).map((e) => e.kind)).toEqual(['opened', 'repayment', 'repayment', 'settled']);
  });

  it('reads money borrowed the other way round: it comes in, and repayments go out', () => {
    const story = loanStory({ type: 'borrow', outstanding: 100, dueDate: null, computedStatus: 'active' }, [payment(1, 'CR', 400, '2026-08-01T09:00:00Z'), payment(2, 'DR', 300, '2026-09-01T09:00:00Z')]);
    expect(story.map((event) => event.kind)).toEqual(['opened', 'repayment', 'remaining']);
  });

  it('measures how much has come back, never outside 0 to 1', () => {
    expect(repaidShare({ principal: 500, repaid: 200 })).toBe(0.4);
    expect(repaidShare({ principal: 500, repaid: 900 })).toBe(1);
    expect(repaidShare({ principal: 0, repaid: 0 })).toBe(0);
  });
});

describe('reminder times', () => {
  it('reads a saved time, and falls back to nine in the morning', () => {
    expect(timeOf('18:30')).toEqual({ hour: 18, minute: 30 });
    expect(timeOf(null)).toEqual({ hour: 9, minute: 0 });
    expect(timeOf('25:99')).toEqual({ hour: 9, minute: 0 });
  });

  it('writes a time as the shipped app does', () => {
    expect(timeText({ hour: 7, minute: 5 })).toBe('07:05');
  });
});
