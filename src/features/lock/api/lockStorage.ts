import * as SecureStore from 'expo-secure-store';

const KEY_PIN_HASH = 'luno_lock_pin_hash';
const KEY_LOCK_MODE = 'luno_lock_mode'; // 'biometric' | 'pin' | null

export type LockMode = 'biometric' | 'pin';

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
