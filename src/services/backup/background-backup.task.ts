import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { LoggerService } from '../logger.service';
import { NotificationService } from '../notification.service';
import { resolveAutoBackupEnabled, runAutoBackupIfDue } from './auto-backup.service';

const AUTO_BACKUP_TASK = 'fintraq-auto-backup-task';

// WorkManager (Android) / BGTaskScheduler (iOS) floor the interval around 15 minutes and the
// OS decides actual timing — there is no way to get exact-time delivery here, unlike the old
// AlarmManager hack (which was exact but got killed by OEM battery managers, hence "not working").
// Prod registers at the real 24h cadence; dev registers at the 15min floor so a background
// firing can actually be observed within a test session instead of waiting a day.
const MINIMUM_INTERVAL_MINUTES = __DEV__ ? 15 : 24 * 60;

// Must run at module load so the task is defined before TaskManager/BackgroundTask
// can invoke it, including when the OS relaunches the app headlessly.
TaskManager.defineTask(AUTO_BACKUP_TASK, async () => {
  LoggerService.info('TASK_MANAGER', 'OS woke background backup task');

  try {
    const result = await runAutoBackupIfDue(false);
    LoggerService.info('TASK_MANAGER', `Background auto-backup outcome: ${result.outcome.toUpperCase()}`);
    if (result.outcome === 'skipped') {
      await NotificationService.dismissBackupNotification();
    }
    return result.outcome === 'failed' ? BackgroundTask.BackgroundTaskResult.Failed : BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    LoggerService.error('TASK_MANAGER', 'Failed to execute background auto-backup task', error);
    await NotificationService.presentBackupFailedNotification();
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/** Registers (or unregisters) the WorkManager/BGTaskScheduler-backed auto-backup schedule. */
export async function registerBackgroundBackupTaskAsync(): Promise<void> {
  try {
    const enabled = await resolveAutoBackupEnabled();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(AUTO_BACKUP_TASK);

    if (!enabled) {
      if (isRegistered) {
        await BackgroundTask.unregisterTaskAsync(AUTO_BACKUP_TASK);
        await NotificationService.dismissBackupNotification();
        LoggerService.info('TASK_MANAGER', 'Unregistered background backup task (disabled).');
      }
      return;
    }

    if (isRegistered) return;

    await BackgroundTask.registerTaskAsync(AUTO_BACKUP_TASK, { minimumInterval: MINIMUM_INTERVAL_MINUTES });
    LoggerService.info('TASK_MANAGER', `Registered background backup task (minimumInterval: ${MINIMUM_INTERVAL_MINUTES}min)`);
  } catch (error) {
    LoggerService.warn('TASK_MANAGER', 'Failed to register background backup task', error);
  }
}
