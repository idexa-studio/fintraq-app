import { DRAFT_KEEP_MS, isWorthKeeping, readDraft, writeDraft } from '@/features/transactions/entry-draft';
import type { EntryDraft } from '@/features/transactions/entry-draft';

const NOW = Date.parse('2026-10-16T12:00:00Z');
const draft = (over: Partial<EntryDraft> = {}): EntryDraft => ({
  type: 'DR', amountText: '42.50', accountId: 3, toAccountId: null, categoryId: 7, personId: 2, when: new Date('2026-10-16T11:58:00Z'), note: 'Lunch', savedAt: NOW - 5000, ...over,
});

describe('a new transaction kept while typing', () => {
  it('comes back exactly as it was written', () => {
    const kept = draft({ type: 'TR', toAccountId: 4, personId: null });
    expect(readDraft(writeDraft(kept), NOW)).toEqual(kept);
  });

  it('keeps the day and time it was for, not the time it is read', () => {
    const back = readDraft(writeDraft(draft({ when: new Date('2026-10-14T09:15:00Z') })), NOW);
    expect(back?.when.toISOString()).toBe('2026-10-14T09:15:00.000Z');
  });

  it('is offered for a day, and dropped after', () => {
    expect(readDraft(writeDraft(draft({ savedAt: NOW - DRAFT_KEEP_MS })), NOW)).not.toBeNull();
    expect(readDraft(writeDraft(draft({ savedAt: NOW - DRAFT_KEEP_MS - 1 })), NOW)).toBeNull();
  });

  it('is kept only when something was typed: an amount or a note', () => {
    expect(isWorthKeeping({ amountText: '', note: '' })).toBe(false);
    expect(isWorthKeeping({ amountText: '  ', note: ' ' })).toBe(false);
    expect(isWorthKeeping({ amountText: '5', note: '' })).toBe(true);
    expect(isWorthKeeping({ amountText: '', note: 'Taxi' })).toBe(true);
    expect(readDraft(writeDraft(draft({ amountText: '', note: '' })), NOW)).toBeNull();
  });

  it('is no draft when nothing is stored or what is stored cannot be read', () => {
    expect(readDraft(null, NOW)).toBeNull();
    expect(readDraft('', NOW)).toBeNull();
    expect(readDraft('{not json', NOW)).toBeNull();
    expect(readDraft('null', NOW)).toBeNull();
    expect(readDraft(JSON.stringify({ ...JSON.parse(writeDraft(draft())), type: 'XX' }), NOW)).toBeNull();
    expect(readDraft(JSON.stringify({ ...JSON.parse(writeDraft(draft())), when: 'yesterday' }), NOW)).toBeNull();
    expect(readDraft(JSON.stringify({ ...JSON.parse(writeDraft(draft())), savedAt: undefined }), NOW)).toBeNull();
  });

  it('drops an id that is not a whole number, and keeps the rest', () => {
    const back = readDraft(JSON.stringify({ ...JSON.parse(writeDraft(draft())), accountId: '3', categoryId: 1.5 }), NOW);
    expect(back?.accountId).toBeNull();
    expect(back?.categoryId).toBeNull();
    expect(back?.amountText).toBe('42.50');
  });

  it('keeps how it repeats, and reads one kept before 2.1.0 as not repeating', () => {
    const repeating = draft({ repeat: { cadence: 'month', mode: 'add', ends: 'times', endDate: null, endTimes: 6 } });
    expect(readDraft(writeDraft(repeating), NOW)).toEqual(repeating);
    expect(readDraft(writeDraft(draft()), NOW)?.repeat).toBeUndefined();
  });

  it('drops a Repeat it cannot read, and keeps the rest', () => {
    const raw = JSON.stringify({ ...JSON.parse(writeDraft(draft())), repeat: { cadence: 'daily', mode: 'ask', ends: 'never' } });
    expect(readDraft(raw, NOW)).toEqual(draft());
  });
});
