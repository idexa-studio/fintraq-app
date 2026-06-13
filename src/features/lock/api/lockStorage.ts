import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { SecureStoreKeys } from '../../../constants/keys';

const KEY_PIN_HASH = SecureStoreKeys.PIN_HASH;
const KEY_LOCK_MODE = SecureStoreKeys.LOCK_MODE; // 'biometric' | 'pin' | null

export type LockMode = 'biometric' | 'pin';

async function sha256(text: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    text
  );
}

export const LockStorage = {
  async getLockMode(): Promise<LockMode | null> {
    const val = await SecureStore.getItemAsync(KEY_LOCK_MODE);
    if (val === 'biometric' || val === 'pin') return val;
    return null;
  },

  async setLockMode(mode: LockMode): Promise<void> {
    await SecureStore.setItemAsync(KEY_LOCK_MODE, mode);
  },

  async clearLockMode(): Promise<void> {
    await SecureStore.deleteItemAsync(KEY_LOCK_MODE);
    await SecureStore.deleteItemAsync(KEY_PIN_HASH);
  },

  async setPin(pin: string): Promise<void> {
    const hash = await sha256(pin);
    await SecureStore.setItemAsync(KEY_PIN_HASH, hash);
  },

  async verifyPin(pin: string): Promise<boolean> {
    const stored = await SecureStore.getItemAsync(KEY_PIN_HASH);
    if (!stored) return false;
    const hash = await sha256(pin);
    return hash === stored;
  },

  async hasPin(): Promise<boolean> {
    const val = await SecureStore.getItemAsync(KEY_PIN_HASH);
    return val !== null;
  },
};
