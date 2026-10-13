import { Platform } from 'react-native';

/**
 * Where a phone's automatic backup lives: the owner's Google Drive on Android, their iCloud on
 * iPhone (owner, 2026-10-08).
 *
 * iCloud is not built yet: it needs the Apple developer programme, which is not held. Until it is,
 * an iPhone is told that iCloud backup is coming and is never offered Google Drive in its place.
 * The backup file works on both. When iCloud is built, it joins here and this flag goes.
 */
export type CloudStore = 'googleDrive' | 'iCloud';

export const CLOUD_STORE: CloudStore = Platform.OS === 'ios' ? 'iCloud' : 'googleDrive';

export const IS_CLOUD_BACKUP_BUILT = CLOUD_STORE === 'googleDrive';
