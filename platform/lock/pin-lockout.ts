/** Wrong PINs allowed before any wait is imposed. */
export const PIN_FREE_ATTEMPTS = 5;
const FIRST_LOCKOUT_MS = 30_000;
const MAX_LOCKOUT_MS = 15 * 60_000;

/**
 * How long the PIN pad stays disabled after the `failures`-th wrong PIN in a row. A six-digit PIN
 * has a million combinations; without a wait they can be tried by hand in an afternoon. Nothing
 * for the first few slips, then 30 s doubling up to 15 minutes.
 */
export function pinLockoutMs(failures: number): number {
  if (failures < PIN_FREE_ATTEMPTS) return 0;
  return Math.min(FIRST_LOCKOUT_MS * 2 ** (failures - PIN_FREE_ATTEMPTS), MAX_LOCKOUT_MS);
}

/** Remaining wait as "m:ss". */
export function formatLockoutRemaining(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
