import AsyncStorage from '@react-native-async-storage/async-storage';
import { IS_PREMIUM_OVERRIDE_ALLOWED } from '@/src/constants/iap';
import { RETIRED_AUTO_BACKUP_FREQUENCY_KEY, StorageKeys } from '@/src/constants/keys';
import { resolveLanguage, SupportedLanguage } from '@/src/i18n';
import { LoggerService } from '@/src/services/logger.service';
import type { CloudBackupFileMeta } from './backup.types';

/**
 * The only module that reads or writes backup-related persisted state. Keys and value formats
 * are unchanged from earlier releases so existing installs keep their settings.
 */

type PremiumSnapshot = { isPremium?: unknown };
type ProfileSnapshot = { language?: unknown };

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isFileMeta(value: unknown): value is CloudBackupFileMeta {
  if (typeof value !== 'object' || value === null) return false;
  const meta = value as Record<string, unknown>;
  return typeof meta.id === 'string' && meta.id.length > 0 && typeof meta.modifiedTime === 'string';
}

export const BackupPreferences = {
  /**
   * Pro entitlement as last persisted by PremiumProvider. The headless task has no React tree,
   * so it reads the snapshot directly; the dev override (development builds only) wins, as it
   * does in the provider.
   */
  async isProEntitled(): Promise<boolean> {
    try {
      const [premium, devOverride] = await AsyncStorage.multiGet([StorageKeys.PREMIUM, StorageKeys.PREMIUM_DEV_OVERRIDE]);
      if (IS_PREMIUM_OVERRIDE_ALLOWED) {
        if (devOverride[1] === 'FORCED_ON') return true;
        if (devOverride[1] === 'FORCED_OFF') return false;
      }
      return Boolean(parseJson<PremiumSnapshot>(premium[1])?.isPremium);
    } catch (e) {
      LoggerService.error('BACKUP_PREFS', 'Failed to read pro status', e);
      return false;
    }
  },

  /** The user's auto-backup switch, independent of entitlement. */
  async isAutoBackupSwitchOn(): Promise<boolean> {
    return (await AsyncStorage.getItem(StorageKeys.AUTO_BACKUP_ENABLED)) === 'true';
  },

  async setAutoBackupSwitch(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(StorageKeys.AUTO_BACKUP_ENABLED, enabled ? 'true' : 'false');
  },

  /** Auto-backup is effective only for Pro users who have switched it on. */
  async isAutoBackupActive(): Promise<boolean> {
    const [entitled, switchOn] = await Promise.all([this.isProEntitled(), this.isAutoBackupSwitchOn()]);
    return entitled && switchOn;
  },

  /** Epoch ms of the last successful backup (manual or automatic); 0 if never. */
  async getLastBackupAt(): Promise<number> {
    const parsed = parseInt((await AsyncStorage.getItem(StorageKeys.AUTO_BACKUP_LAST_AUTO_TIME)) ?? '', 10);
    return Number.isFinite(parsed) ? parsed : 0;
  },

  /**
   * Whether this install has backed up to, or restored from, the connected Drive account. Until it
   * has, a backup already in Drive may belong to another install (an old phone, or this one before
   * a reinstall) and must not be overwritten without the user saying so. See `isOwnBackup`.
   */
  async hasSyncedWithDrive(): Promise<boolean> {
    return (await this.getLastBackupAt()) > 0;
  },

  /**
   * Whether the Drive file `fileId` is one this install made or restored. The remembered id
   * outlives a disconnect, so reconnecting the same Google account carries on backing up; a
   * different account, or a fresh install, doesn't match and has to be confirmed.
   */
  async isOwnBackup(fileId: string): Promise<boolean> {
    if (await this.hasSyncedWithDrive()) return true;
    return (await AsyncStorage.getItem(StorageKeys.AUTO_BACKUP_SYNCED_FILE_ID)) === fileId;
  },

  async getCachedBackupMeta(): Promise<CloudBackupFileMeta | null> {
    const parsed = parseJson<unknown>(await AsyncStorage.getItem(StorageKeys.AUTO_BACKUP_LAST_BACKUP_META));
    return isFileMeta(parsed) ? parsed : null;
  },

  async setCachedBackupMeta(meta: CloudBackupFileMeta): Promise<void> {
    await AsyncStorage.setItem(StorageKeys.AUTO_BACKUP_LAST_BACKUP_META, JSON.stringify(meta));
  },

  /** `startedAt` (not completion time) anchors the schedule, matching earlier releases. */
  async recordSuccessfulBackup(meta: CloudBackupFileMeta, startedAt: number): Promise<void> {
    await AsyncStorage.multiSet([
      [StorageKeys.AUTO_BACKUP_LAST_BACKUP_META, JSON.stringify(meta)],
      [StorageKeys.AUTO_BACKUP_LAST_AUTO_TIME, String(startedAt)],
      [StorageKeys.AUTO_BACKUP_SYNCED_FILE_ID, meta.id],
    ]);
  },

  /** Forget cached Drive state (on disconnect, or after deleting the remote file). Keeps the switch. */
  async clearBackupCache(): Promise<void> {
    await AsyncStorage.multiRemove([StorageKeys.AUTO_BACKUP_LAST_BACKUP_META, StorageKeys.AUTO_BACKUP_LAST_AUTO_TIME]);
  },

  /** Every backup key, for factory reset. */
  allKeys(): string[] {
    return [
      StorageKeys.AUTO_BACKUP_ENABLED,
      StorageKeys.AUTO_BACKUP_LAST_BACKUP_META,
      StorageKeys.AUTO_BACKUP_LAST_AUTO_TIME,
      StorageKeys.AUTO_BACKUP_SYNCED_FILE_ID,
      RETIRED_AUTO_BACKUP_FREQUENCY_KEY,
    ];
  },

  /** Returns true the first time only — the battery-optimisation hint is shown once per install. */
  async claimBatteryPrompt(): Promise<boolean> {
    if (await AsyncStorage.getItem(StorageKeys.AUTO_BACKUP_BATTERY_PROMPT_SHOWN)) return false;
    await AsyncStorage.setItem(StorageKeys.AUTO_BACKUP_BATTERY_PROMPT_SHOWN, 'true');
    return true;
  },

  /**
   * The app language the user picked (SettingsProvider profile). The headless task has no
   * I18nProvider, so without this its notifications would follow the system language instead.
   */
  async getPreferredLanguage(): Promise<SupportedLanguage> {
    const profile = parseJson<ProfileSnapshot>(await AsyncStorage.getItem(StorageKeys.PROFILE));
    return resolveLanguage(typeof profile?.language === 'string' ? profile.language : 'system');
  },
};
