import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { SecureStoreKeys } from '@/shared/contracts/storage-keys';
import { pinLockoutMs } from '@/platform/lock/pin-lockout';

const KEY_PIN_HASH = SecureStoreKeys.PIN_HASH;
const KEY_LOCK_MODE = SecureStoreKeys.LOCK_MODE; // 'biometric' | 'pin' | null
const KEY_PIN_FAILURES = SecureStoreKeys.PIN_FAILURES;

type PinFailures = { count: number; until: number };
const NO_FAILURES: PinFailures = { count: 0, until: 0 };

async function readPinFailures(): Promise<PinFailures> {
  try {
    const parsed = JSON.parse((await SecureStore.getItemAsync(KEY_PIN_FAILURES)) ?? 'null') as Partial<PinFailures> | null;
    return typeof parsed?.count === 'number' && typeof parsed.until === 'number' ? { count: parsed.count, until: parsed.until } : NO_FAILURES;
  } catch {
    return NO_FAILURES;
  }
}

export type LockMode = 'biometric' | 'pin';

async function sha256(text: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    text
  );
}

const toLockMode = (val: string | null): LockMode | null => (val === 'biometric' || val === 'pin' ? val : null);

export const LockStorage = {
  async getLockMode(): Promise<LockMode | null> {
    return toLockMode(await SecureStore.getItemAsync(KEY_LOCK_MODE));
  },

  /**
   * Blocking read for the first render: the app must know it is locked before it draws anything.
   * An unreadable keystore is reported as "no lock" rather than crashing the launch.
   */
  getLockModeSync(): LockMode | null {
    try {
      return toLockMode(SecureStore.getItem(KEY_LOCK_MODE));
    } catch {
      return null;
    }
  },

  async setLockMode(mode: LockMode): Promise<void> {
    await SecureStore.setItemAsync(KEY_LOCK_MODE, mode);
  },

  async clearLockMode(): Promise<void> {
    await SecureStore.deleteItemAsync(KEY_LOCK_MODE);
    await SecureStore.deleteItemAsync(KEY_PIN_HASH);
    await SecureStore.deleteItemAsync(KEY_PIN_FAILURES);
  },

  async setPin(pin: string): Promise<void> {
    const hash = await sha256(pin);
    await SecureStore.setItemAsync(KEY_PIN_HASH, hash);
    await SecureStore.deleteItemAsync(KEY_PIN_FAILURES);
  },

  /**
   * Checks a PIN. Wrong attempts are counted in the keystore (so restarting the app doesn't reset
   * them) and, past a few, impose a growing wait during which every attempt is refused.
   */
  async verifyPin(pin: string): Promise<boolean> {
    const stored = await SecureStore.getItemAsync(KEY_PIN_HASH);
    if (!stored) return false;
    const failures = await readPinFailures();
    if (failures.until > Date.now()) return false;

    if ((await sha256(pin)) === stored) {
      if (failures.count > 0) await SecureStore.deleteItemAsync(KEY_PIN_FAILURES);
      return true;
    }
    const count = failures.count + 1;
    await SecureStore.setItemAsync(KEY_PIN_FAILURES, JSON.stringify({ count, until: Date.now() + pinLockoutMs(count) }));
    return false;
  },

  /** When the PIN pad accepts input again (epoch ms); 0 when it isn't locked out. */
  async getPinLockoutUntil(): Promise<number> {
    const { until } = await readPinFailures();
    return until > Date.now() ? until : 0;
  },

  async hasPin(): Promise<boolean> {
    const val = await SecureStore.getItemAsync(KEY_PIN_HASH);
    return val !== null;
  },
};
