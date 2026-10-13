import type { KeypadKey } from '@/design';

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

/** Whether coming back after `elapsed` away should ask for the lock again. An unknown time away counts as long. */
export const shouldLockAfter = (elapsed: number | null): boolean => elapsed === null || elapsed > GRACE_PERIOD_MS;

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
