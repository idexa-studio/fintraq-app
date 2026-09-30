import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { StorageKeys } from '@/src/constants/keys';
import { LoggerService } from '@/src/services/logger.service';
import { NotificationService } from '@/src/services/notification.service';
import { ReviewPromptService } from '@/src/services/review-prompt.service';
import { BackupLock } from './backup-lock';
import { getBackupState } from './backup-state';
import { getCachedBackupFileId, isCloudBackupRunning, runCloudBackup } from './cloud-backup.service';
import { CloudBackupFileMeta, GoogleDriveService } from './google-drive.service';

// Fixed schedule — no user-facing frequency choice. Same in all builds.
export const AUTO_BACKUP_INTERVAL_MINUTES = 12 * 60;
export const AUTO_BACKUP_INTERVAL_MS = AUTO_BACKUP_INTERVAL_MINUTES * 60 * 1000;

// Checks land a little early (OS jitter, a foreground check just shy of the mark). Without
// slack an 11h59m check is skipped and the next chance may be many hours away.
const DUE_TOLERANCE_MS = 30 * 60 * 1000;

type PremiumSnapshot = { isPremium?: unknown };

async function isProUserActive(): Promise<boolean> {
  try {
    const [storedPremium, storedDev] = await Promise.all([
      AsyncStorage.getItem(StorageKeys.PREMIUM),
      AsyncStorage.getItem(StorageKeys.PREMIUM_DEV_OVERRIDE),
    ]);

    if (storedDev === 'FORCED_ON') return true;
    if (storedDev === 'FORCED_OFF') return false;

    if (storedPremium) {
      const parsed = JSON.parse(storedPremium) as PremiumSnapshot | null;
      return Boolean(parsed?.isPremium);
    }
  } catch (err) {
    LoggerService.error('AUTO_BACKUP', 'Failed to read pro status from storage', err);
  }
  return false;
}

export async function resolveAutoBackupEnabled(isPremiumOverride?: boolean): Promise<boolean> {
  const isPro = isPremiumOverride !== undefined ? isPremiumOverride : await isProUserActive();
  if (!isPro) return false;

  const autoVal = await AsyncStorage.getItem(StorageKeys.AUTO_BACKUP_ENABLED);
  return autoVal === 'true';
}

/** Epoch ms of the last successful backup (manual or automatic), 0 if never. */
export async function getLastBackupTime(): Promise<number> {
  const raw = await AsyncStorage.getItem(StorageKeys.AUTO_BACKUP_LAST_AUTO_TIME);
  const parsed = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export type AutoBackupSkipReason = 'not_pro' | 'disabled' | 'signed_out' | 'busy' | 'not_due';

export type AutoBackupResult =
  | { outcome: 'ran'; meta: CloudBackupFileMeta }
  | { outcome: 'skipped'; reason: AutoBackupSkipReason }
  | { outcome: 'failed'; error: unknown };

function skipped(tag: string, reason: AutoBackupSkipReason, detail = ''): AutoBackupResult {
  LoggerService.info('AUTO_BACKUP', `[${tag}] Skipped: ${reason}${detail ? ` (${detail})` : ''}`);
  // Clears a sticky "syncing" notification left behind if the OS killed a previous run mid-upload.
  // Never while busy: that notification belongs to the run in progress.
  if (reason !== 'busy') void NotificationService.dismissBackupNotification();
  return { outcome: 'skipped', reason };
}

/**
 * Runs the auto-backup if it's due. Shared by the foreground checks (launch, resume,
 * backgrounding) and the headless OS task. `force` bypasses gating for the Developer screen.
 */
export async function runAutoBackupIfDue(force = false): Promise<AutoBackupResult> {
  const isBackground = AppState.currentState !== 'active';
  const tag = isBackground ? 'BACKGROUND' : 'FOREGROUND';

  LoggerService.info('AUTO_BACKUP', `[${tag}] Checking eligibility (force: ${force}, appState: ${AppState.currentState})`);

  if (!force) {
    if (!(await isProUserActive())) return skipped(tag, 'not_pro');
    if (!(await resolveAutoBackupEnabled(true))) return skipped(tag, 'disabled');
  }

  if (isCloudBackupRunning() || getBackupState().isBackingUp || BackupLock.isRestoring() || getBackupState().isRestoring) {
    return skipped(tag, 'busy');
  }

  if (!force) {
    const elapsed = Date.now() - (await getLastBackupTime());
    if (elapsed < AUTO_BACKUP_INTERVAL_MS - DUE_TOLERANCE_MS) {
      return skipped(tag, 'not_due', `${Math.round(elapsed / 60_000)}min / ${AUTO_BACKUP_INTERVAL_MINUTES}min`);
    }
  }

  const currentUser = await GoogleDriveService.getCurrentUser();
  if (!currentUser) return skipped(tag, 'signed_out');

  LoggerService.info('AUTO_BACKUP', `[${tag}] Starting auto-backup for ${currentUser.email}`);

  try {
    const meta = await runCloudBackup({
      trigger: force ? 'dev_qa' : isBackground ? 'auto_background' : 'auto_foreground',
      knownFileId: await getCachedBackupFileId(),
    });
    if (!isBackground) {
      // Review dialog needs a foreground screen, skip for headless task.
      void ReviewPromptService.maybeRequestReview();
    }
    return { outcome: 'ran', meta };
  } catch (error) {
    return { outcome: 'failed', error };
  }
}

// Let launch/resume work (queries, splash, remote config) settle before touching the network.
const FOREGROUND_CHECK_DELAY_MS = 4_000;

/**
 * Wires the foreground auto-backup checks — the reliable path, since OS background scheduling
 * is best-effort. Checks on launch and on every resume; on Android also when the app is
 * backgrounded (the process usually survives long enough to finish). iOS suspends apps within
 * seconds of backgrounding, which would cut uploads off mid-flight, so it relies on resume +
 * BGTaskScheduler instead. Returns a cleanup function.
 */
export function startAutoBackupTriggers(): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastState = AppState.currentState;

  const run = () => {
    runAutoBackupIfDue().catch((e) => LoggerService.warn('AUTO_BACKUP', 'Auto-backup check threw', e));
  };

  const scheduleForegroundCheck = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (AppState.currentState === 'active') run();
    }, FOREGROUND_CHECK_DELAY_MS);
  };

  if (AppState.currentState === 'active') scheduleForegroundCheck();

  const sub = AppState.addEventListener('change', (next) => {
    if (next === 'active' && lastState !== 'active') {
      scheduleForegroundCheck();
    } else if (next === 'background') {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (Platform.OS === 'android') run();
    }
    lastState = next;
  });

  return () => {
    if (timer) clearTimeout(timer);
    sub.remove();
  };
}
