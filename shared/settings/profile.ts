import { StorageKeys } from '@/shared/contracts/storage-keys';
import type { AppLanguage } from '@/shared/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The user's settings, as saved on the phone and carried in every backup.
 * Fields are only ever added, each with a default: an install or a backup
 * from an older version simply lacks the newer ones.
 */
export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  defaultCurrency: string;
  theme: 'system' | 'light' | 'dark';
  language: AppLanguage;
  reminderEnabled: boolean;
  /** 24-hour "HH:mm", e.g. "20:00". */
  reminderTime: string;
  /** Anonymous usage analytics and crash reports. On unless the user turns it off. */
  shareUsageData: boolean;
};

export const DEFAULT_PROFILE: UserProfile = {
  name: '',
  email: '',
  phone: '',
  defaultCurrency: 'USD',
  theme: 'system',
  language: 'system',
  reminderEnabled: false,
  reminderTime: '20:00',
  shareUsageData: true,
};

/**
 * What is saved, exactly as saved: null on a fresh install, and possibly
 * missing newer fields. Throws if storage cannot be read or holds something
 * unreadable, so each caller decides what a failure means for it.
 */
export async function readStoredProfile(): Promise<Partial<UserProfile> | null> {
  const raw = await AsyncStorage.getItem(StorageKeys.PROFILE);
  return raw ? (JSON.parse(raw) as Partial<UserProfile>) : null;
}

/** The saved settings with every missing field filled from the defaults. */
export async function loadProfile(): Promise<UserProfile> {
  return { ...DEFAULT_PROFILE, ...(await readStoredProfile()) };
}

export async function saveProfile(profile: Partial<UserProfile>): Promise<void> {
  await AsyncStorage.setItem(StorageKeys.PROFILE, JSON.stringify(profile));
}
