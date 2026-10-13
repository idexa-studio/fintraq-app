import { dailyText, loanDueText } from '@/platform/notifications/notification-copy';
import { notificationPreviews } from '@/platform/notifications/notification-previews';

jest.mock('@/platform/notifications/notifications', () => ({ NotificationService: {} }));

describe('every notification the app can send', () => {
  const previews = notificationPreviews();

  it('has a title and a body, with every blank filled in', () => {
    for (const preview of previews) {
      for (const text of [preview.title, preview.body]) {
        expect(text.trim()).not.toBe('');
        // A missing key comes back as its own dotted path; an unfilled value keeps its braces.
        expect(text).not.toMatch(/^[a-zA-Z]+(\.[a-zA-Z_]+)+$/);
        expect(text).not.toMatch(/\{\{|\}\}|undefined|null|NaN/);
      }
    }
  });

  it('is each listed once', () => {
    const ids = previews.map((preview) => preview.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps to the voice: no shouting, no emoji, a title that fits a collapsed notification', () => {
    for (const { title, body } of previews) {
      expect(`${title} ${body}`).not.toMatch(/!|\p{Extended_Pictographic}/u);
      expect(title).not.toMatch(/[A-Z]{3,}/);
      expect(title.length).toBeLessThanOrEqual(24);
    }
  });
});

describe('the words', () => {
  it('says who and how much in a loan’s title, and when in its body', () => {
    const loan = { loanId: 1, loanType: 'lend', personName: 'Priya', outstanding: 300, currency: 'USD' } as const;
    expect(loanDueText(loan, 1)).toEqual({ title: 'Priya owes you $300.00', body: 'Due tomorrow. Add the repayment when it arrives.' });
    expect(loanDueText({ ...loan, loanType: 'borrow' }, 3)).toEqual({ title: 'You owe Priya $300.00', body: 'Due in 3 days. Add the repayment once you have paid.' });
    expect(loanDueText({ ...loan, personName: null }, 0).title).toBe('You are owed $300.00');
  });

  it('counts what was recorded without naming it twice', () => {
    expect(dailyText({ kind: 'weekEnd', count: 1 }).title).toBe('1 recorded this week');
    expect(dailyText({ kind: 'weekEnd', count: 12 }).title).toBe('12 recorded this week');
    expect(dailyText({ kind: 'monthEnd', month: new Date(2026, 9, 1), count: 42 })).toEqual({
      title: 'Last day of October',
      body: '42 recorded so far. Add anything missing and the month is complete.',
    });
  });
});
