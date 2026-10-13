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

/** The release whose changes "What is new" describes. Raise it when the note is rewritten for a later one. */
export const WHATS_NEW_RELEASE = 2;

/**
 * Shown to someone who was using the app before this release, once. A new install is marked as
 * having seen it when setup finishes, since nothing is new to someone who has just arrived.
 */
export function showsWhatsNew(seenRelease: string | null): boolean {
  const seen = Number.parseInt(seenRelease ?? '', 10);
  return !(Number.isFinite(seen) && seen >= WHATS_NEW_RELEASE);
}
