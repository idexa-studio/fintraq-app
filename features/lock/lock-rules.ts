import type { KeypadKey } from '@/design';
import type { AppStateStatus } from 'react-native';

/** How many digits a PIN has. The shipped app's PINs are six digits and stay valid. */
export const PIN_LENGTH = 6;

/** Leaving the app for less than this does not lock it: a glance at a notification is not walking away. */
export const GRACE_PERIOD_MS = 3000;

/** The digits after a key press: one more, one fewer, or unchanged when full or the key is not a digit. */
export function pinAfter(pin: string, key: KeypadKey): string {
  if (key === 'delete') return pin.slice(0, -1);
  if (pin.length >= PIN_LENGTH || !/^\d$/.test(key)) return pin;
  return pin + key;
}

export const isCompletePin = (pin: string): boolean => pin.length === PIN_LENGTH;

/**
 * Whether the app has been left. Only `background` counts. On iOS the app is also `inactive` while
 * something covers it without leaving it: the Face ID sheet the lock itself asks for, Control
 * Centre, a call banner. Counting that as leaving locked the app again the moment Face ID unlocked
 * it, and asked again, without end. Android never reports `inactive`.
 */
export const hasLeftTheApp = (state: AppStateStatus): boolean => state === 'background';

/**
 * Whether becoming active again asks for the lock: only when the app was left (`leftAt`, from
 * `hasLeftTheApp`) for longer than the grace period. Becoming active without having been left, as
 * the Face ID sheet closing does, never asks: counting that as an unknown time away locked the app
 * the moment Face ID unlocked it, and asked again without end. A cold start is locked from the
 * start, so it needs nothing here.
 */
export const shouldLockOnReturn = (leftAt: number | null, now: number): boolean => leftAt !== null && now - leftAt > GRACE_PERIOD_MS;

/** Choosing a PIN: typed once, then typed again to make sure. */
export type PinSetup = { step: 'choose' } | { step: 'confirm'; first: string };

export type PinSetupResult =
  | { kind: 'next'; setup: PinSetup }
  /** The two entries differ, so choosing starts again. */
  | { kind: 'mismatch'; setup: PinSetup }
  | { kind: 'done'; pin: string };

/** What a completed entry does at each step. */
export function pinSetupAfter(setup: PinSetup, entered: string): PinSetupResult {
  if (setup.step === 'choose') return { kind: 'next', setup: { step: 'confirm', first: entered } };
  return entered === setup.first ? { kind: 'done', pin: entered } : { kind: 'mismatch', setup: { step: 'choose' } };
}
