import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { StorageKeys } from '@/shared/contracts/storage-keys';
import i18n from '@/shared/i18n';
import { LoggerService } from '@/src/services/logger.service';
import { NotificationService } from '@/src/services/notification.service';
import { runAutoBackupIfDue } from './auto-backup.service';
import { BackupPreferences } from './backup-preferences';
import { BACKGROUND_CHECK_INTERVAL_MINUTES } from './backup-schedule';

const AUTO_BACKUP_TASK = 'fintraq-auto-backup-task';

// expo-task-manager only reschedules the native worker on a task's first registration;
// re-registering an existing task just updates its stored options. Track the interval we last
// registered with and unregister+register when it changes (e.g. after an app update).
const LAST_REGISTERED_INTERVAL_KEY = StorageKeys.AUTO_BACKUP_LAST_REGISTERED_INTERVAL;

/**
 * Headless runs have no I18nProvider, so i18n starts on the system language. Apply the user's
 * chosen language so background notifications match the app.
 */
async function applyPreferredLanguage(): Promise<void> {
  try {
    const language = await BackupPreferences.getPreferredLanguage();
    if (i18n.language !== language) await i18n.changeLanguage(language);
  } catch (e) {
    LoggerService.warn('TASK_MANAGER', 'Could not apply preferred language', e);
  }
}

// Must run at module load — the OS can relaunch the app headlessly to invoke this task.
TaskManager.defineTask(AUTO_BACKUP_TASK, async () => {
  LoggerService.info('TASK_MANAGER', 'OS woke background backup task');
  try {
    await applyPreferredLanguage();
    const result = await runAutoBackupIfDue(false);
    LoggerService.info('TASK_MANAGER', `Background auto-backup outcome: ${result.outcome.toUpperCase()}`);
    return result.outcome === 'failed' ? BackgroundTask.BackgroundTaskResult.Failed : BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    // runAutoBackupIfDue reports its own failures; this only catches unexpected throws.
    LoggerService.error('TASK_MANAGER', 'Unexpected error in background auto-backup task', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

async function syncRegistration(): Promise<void> {
  const status = await BackgroundTask.getStatusAsync();
  if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
    // iOS Background App Refresh off / Low Power Mode / simulator — registering would throw.
    LoggerService.warn('TASK_MANAGER', 'Background tasks are restricted on this device; relying on foreground checks.');
    return;
  }

  const [active, isRegistered] = await Promise.all([
    BackupPreferences.isAutoBackupActive(),
    TaskManager.isTaskRegisteredAsync(AUTO_BACKUP_TASK),
  ]);

  if (!active) {
    if (isRegistered) {
      await BackgroundTask.unregisterTaskAsync(AUTO_BACKUP_TASK);
      await AsyncStorage.removeItem(LAST_REGISTERED_INTERVAL_KEY);
      await NotificationService.dismissBackupNotification();
      LoggerService.info('TASK_MANAGER', 'Unregistered background backup task (inactive).');
    }
    return;
  }

  const lastInterval = parseInt((await AsyncStorage.getItem(LAST_REGISTERED_INTERVAL_KEY)) ?? '', 10);
  if (isRegistered && lastInterval === BACKGROUND_CHECK_INTERVAL_MINUTES) return;

  if (isRegistered) await BackgroundTask.unregisterTaskAsync(AUTO_BACKUP_TASK);
  await BackgroundTask.registerTaskAsync(AUTO_BACKUP_TASK, { minimumInterval: BACKGROUND_CHECK_INTERVAL_MINUTES });
  await AsyncStorage.setItem(LAST_REGISTERED_INTERVAL_KEY, String(BACKGROUND_CHECK_INTERVAL_MINUTES));
  LoggerService.info('TASK_MANAGER', `Registered background backup task (minimumInterval: ${BACKGROUND_CHECK_INTERVAL_MINUTES}min)`);
}

let registrationQueue: Promise<void> = Promise.resolve();

/**
 * Brings the OS task registration in line with the current setting (registers or unregisters).
 * Serialised: app launch and the auto-backup toggle can call this concurrently, and two
 * interleaved unregister/register sequences can leave the task unregistered.
 */
export function syncBackgroundBackupTask(): Promise<void> {
  registrationQueue = registrationQueue
    .then(syncRegistration)
    .catch((error) => LoggerService.warn('TASK_MANAGER', 'Failed to sync background backup task registration', error));
  return registrationQueue;
}
