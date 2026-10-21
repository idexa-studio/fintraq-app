/**
 * Finding your way round: the one-time tips on the tabs, and the note shown once to someone
 * arriving from an older version. Pure, for testing.
 */

/**
 * The tabs that carry a tip. Each names something on that screen that cannot be seen by looking;
 * Insights has none, since its own section hint already says a category can be tapped.
 */
export const TIP_IDS = ['activity', 'plan'] as const;
export type TipId = (typeof TIP_IDS)[number];

/** Kept beside the tips: Insights was opened with something recorded, which ticks Home's step for it. */
export const INSIGHTS_OPENED = 'insights-opened';

/** What has been seen is kept as a list of names, so one more can be added without a new key. */
export function parseSeen(stored: string | null): string[] {
  if (!stored) return [];
  try {
    const value: unknown = JSON.parse(stored);
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export const withSeen = (seen: readonly string[], id: string): string[] => (seen.includes(id) ? [...seen] : [...seen, id]);

/** What is left once the tips are brought back: everything that is not a tip. */
export const withoutTips = (seen: readonly string[]): string[] => seen.filter((id) => !(TIP_IDS as readonly string[]).includes(id));

/**
 * The release whose changes "What is new" describes: 2 was the new look (2.0), 3 is repeating
 * items and the spendable balance (2.1.0). Raise it when the note is rewritten for a later one.
 */
export const WHATS_NEW_RELEASE = 3;

/** The new look's release: someone who saw its note knows the five tabs. */
const NEW_LOOK_RELEASE = 2;

/**
 * Which note: `newLook` for someone arriving from before 2.0 (1.2.4 left no release behind), who
 * has never seen the new look and gets it with what 2.1 adds; `latest` for someone who has.
 */
export type WhatsNewNote = 'newLook' | 'latest';

/** Each note's lines, in the order they are read. */
export const WHATS_NEW_POINTS: Record<WhatsNewNote, readonly string[]> = {
  newLook: ['tabs', 'settings', 'budgets', 'repeating', 'spendable', 'records'],
  latest: ['repeating', 'upcoming', 'spendable'],
};

/**
 * The note to show someone, once, or null. A new install is marked as having seen it when setup
 * finishes, since nothing is new to someone who has just arrived.
 */
export function whatsNewNote(seenRelease: string | null): WhatsNewNote | null {
  const seen = Number.parseInt(seenRelease ?? '', 10);
  if (Number.isFinite(seen) && seen >= WHATS_NEW_RELEASE) return null;
  return Number.isFinite(seen) && seen >= NEW_LOOK_RELEASE ? 'latest' : 'newLook';
}

export const showsWhatsNew = (seenRelease: string | null): boolean => whatsNewNote(seenRelease) !== null;
