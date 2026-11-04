import type { RepeatDraft } from '@/features/recurring';
import { CADENCES } from '@/shared/calc/recurrence';
import type { Cadence } from '@/shared/calc/recurrence';
import type { TransactionType } from '@/shared/types';

/**
 * A new transaction being typed, kept on the phone so that it outlives the app being started
 * again under it: a change of font size or display size, or Android reclaiming the app while it
 * was in the background. Only a new entry is kept; a saved transaction can simply be edited again.
 */
export type EntryDraft = {
  type: TransactionType;
  amountText: string;
  accountId: number | null;
  toAccountId: number | null;
  categoryId: number | null;
  personId: number | null;
  /** When the transaction happened, as typed or as it stood when the entry was opened. */
  when: Date;
  note: string;
  /** How it repeats, once Repeat is chosen. Left out by drafts kept before 2.1.0, which do not repeat. */
  repeat?: RepeatDraft;
  /** When the draft was last written (epoch ms). */
  savedAt: number;
};

/** A draft older than this is about a day already past, and is dropped rather than offered back. */
export const DRAFT_KEEP_MS = 24 * 60 * 60 * 1000;

const TYPES: readonly TransactionType[] = ['DR', 'CR', 'TR'];

/** Whether there is anything in it worth giving back: an amount or a note. The rest are defaults. */
export const isWorthKeeping = (draft: Pick<EntryDraft, 'amountText' | 'note'>): boolean => draft.amountText.trim() !== '' || draft.note.trim() !== '';

/** The draft as stored. */
export const writeDraft = (draft: EntryDraft): string => JSON.stringify({ ...draft, when: draft.when.getTime() });

const idOrNull = (value: unknown): number | null => (typeof value === 'number' && Number.isInteger(value) ? value : null);

const ENDS: readonly unknown[] = ['never', 'date', 'times'];

/** A kept Repeat, or undefined when there is none or it cannot be read: the entry then does not repeat. */
function repeatOf(value: unknown): RepeatDraft | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const r = value as Record<string, unknown>;
  const cadence = r.cadence === null ? null : CADENCES.includes(r.cadence as Cadence) ? (r.cadence as Cadence) : undefined;
  if (cadence === undefined || (r.mode !== 'ask' && r.mode !== 'add') || !ENDS.includes(r.ends)) return undefined;
  return { cadence, mode: r.mode, ends: r.ends as RepeatDraft['ends'], endDate: typeof r.endDate === 'string' ? r.endDate : null, endTimes: idOrNull(r.endTimes) };
}

/** The stored draft, if there is one still worth offering at `now`; anything unreadable is no draft. */
export function readDraft(raw: string | null, now: number): EntryDraft | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (!TYPES.includes(v.type as TransactionType) || typeof v.amountText !== 'string' || typeof v.note !== 'string') return null;
  if (typeof v.when !== 'number' || !Number.isFinite(v.when) || typeof v.savedAt !== 'number' || !Number.isFinite(v.savedAt)) return null;
  if (now - v.savedAt > DRAFT_KEEP_MS) return null;
  const draft: EntryDraft = {
    type: v.type as TransactionType,
    amountText: v.amountText,
    accountId: idOrNull(v.accountId),
    toAccountId: idOrNull(v.toAccountId),
    categoryId: idOrNull(v.categoryId),
    personId: idOrNull(v.personId),
    when: new Date(v.when),
    note: v.note,
    ...(repeatOf(v.repeat) ? { repeat: repeatOf(v.repeat) } : {}),
    savedAt: v.savedAt,
  };
  return isWorthKeeping(draft) ? draft : null;
}
