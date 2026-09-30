import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { StorageKeys } from '@/src/constants/keys';
import { LoggerService } from '@/src/services/logger.service';
import { NotificationService } from '@/src/services/notification.service';
import { resolveAutoBackupEnabled, runAutoBackupIfDue } from './auto-backup.service';

const AUTO_BACKUP_TASK = 'fintraq-auto-backup-task';

// How often the OS may wake us to *check*, deliberately shorter than the 12h backup interval.
// The wake timer and the backup clock are independent: a foreground backup resets the backup
// clock but not the OS timer, so with equal intervals a wake can land just before the backup is
// due, skip, and leave the next chance a full interval later (worst case ~24h between backups).
// A 4h check cadence bounds that to ~16h. Wakes that aren't due are a cheap AsyncStorage read.
// Android cold-start rescheduling is fixed natively (patches/expo-background-task+1.0.10.patch).
export const BACKGROUND_CHECK_INTERVAL_MINUTES = 4 * 60;

// expo-task-manager only reschedules WorkManager on a task's first-ever registration.
// Re-registering an existing task just updates stored options, no reschedule (verified
// in TaskService.java). Track last-scheduled interval; force unregister+register when it changes.
const LAST_REGISTERED_INTERVAL_KEY = StorageKeys.AUTO_BACKUP_LAST_REGISTERED_INTERVAL;

// Must run at module load — OS can relaunch app headlessly to invoke this task.
TaskManager.defineTask(AUTO_BACKUP_TASK, async () => {
  LoggerService.info('TASK_MANAGER', 'OS woke background backup task');

  try {
    const result = await runAutoBackupIfDue(false);
    LoggerService.info('TASK_MANAGER', `Background auto-backup outcome: ${result.outcome.toUpperCase()}`);
    return result.outcome === 'failed' ? BackgroundTask.BackgroundTaskResult.Failed : BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    // runAutoBackupIfDue reports its own failures; this only catches unexpected throws.
    LoggerService.error('TASK_MANAGER', 'Unexpected error in background auto-backup task', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

let registrationInFlight: Promise<void> | null = null;

async function syncRegistration(): Promise<void> {
  const status = await BackgroundTask.getStatusAsync();
  if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
    // iOS Background App Refresh off / Low Power Mode — registering would throw.
    LoggerService.warn('TASK_MANAGER', 'Background tasks are restricted on this device; relying on foreground checks.');
    return;
  }

  const enabled = await resolveAutoBackupEnabled();
  const isRegistered = await TaskManager.isTaskRegisteredAsync(AUTO_BACKUP_TASK);

  if (!enabled) {
    if (isRegistered) {
      await BackgroundTask.unregisterTaskAsync(AUTO_BACKUP_TASK);
      await AsyncStorage.removeItem(LAST_REGISTERED_INTERVAL_KEY);
      await NotificationService.dismissBackupNotification();
      LoggerService.info('TASK_MANAGER', 'Unregistered background backup task (disabled).');
    }
    return;
  }

  const lastIntervalStr = await AsyncStorage.getItem(LAST_REGISTERED_INTERVAL_KEY);
  const lastInterval = lastIntervalStr ? parseInt(lastIntervalStr, 10) : null;

  if (isRegistered && lastInterval === BACKGROUND_CHECK_INTERVAL_MINUTES) return;

  if (isRegistered) {
    // Interval changed (e.g. app update) — force unregister so the next register actually reschedules.
    await BackgroundTask.unregisterTaskAsync(AUTO_BACKUP_TASK);
  }

  await BackgroundTask.registerTaskAsync(AUTO_BACKUP_TASK, { minimumInterval: BACKGROUND_CHECK_INTERVAL_MINUTES });
  await AsyncStorage.setItem(LAST_REGISTERED_INTERVAL_KEY, String(BACKGROUND_CHECK_INTERVAL_MINUTES));
  LoggerService.info('TASK_MANAGER', `Registered background backup task (minimumInterval: ${BACKGROUND_CHECK_INTERVAL_MINUTES}min)`);
}

/**
 * Registers (or unregisters) the WorkManager/BGTaskScheduler-backed auto-backup schedule.
 * Serialised: the root layout and the auto-backup toggle can call this concurrently, and two
 * interleaved unregister/register sequences can leave the task unregistered.
 */
export function registerBackgroundBackupTaskAsync(): Promise<void> {
  const previous = registrationInFlight ?? Promise.resolve();
  const next = previous
    .then(syncRegistration)
    .catch((error) => LoggerService.warn('TASK_MANAGER', 'Failed to sync background backup task registration', error));
  registrationInFlight = next;
  void next.finally(() => {
    if (registrationInFlight === next) registrationInFlight = null;
  });
  return next;
}
