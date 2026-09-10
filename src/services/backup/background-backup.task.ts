import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { LoggerService } from '../logger.service';
import { NotificationService } from '../notification.service';
import { AutoBackupFrequency, AutoBackupFrequencyEnum, resolveAutoBackupFrequency, runAutoBackupIfDue } from './auto-backup.service';

const AUTO_BACKUP_TASK = 'fintraq-auto-backup-task';

// WorkManager (Android) / BGTaskScheduler (iOS) floor the interval around 15 minutes and the
// OS decides actual timing — there is no way to get exact-time delivery here, unlike the old
// AlarmManager hack (which was exact but got killed by OEM battery managers, hence "not working").
const FREQUENCY_TO_MINUTES: Record<AutoBackupFrequency, number> = {
  [AutoBackupFrequencyEnum.OFF]: 0,
  [AutoBackupFrequencyEnum.DAILY]: 24 * 60,
  [AutoBackupFrequencyEnum.WEEKLY]: 7 * 24 * 60,
  [AutoBackupFrequencyEnum.MONTHLY]: 30 * 24 * 60,
};

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
    const frequency = await resolveAutoBackupFrequency();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(AUTO_BACKUP_TASK);

    if (frequency === AutoBackupFrequencyEnum.OFF) {
      if (isRegistered) {
        await BackgroundTask.unregisterTaskAsync(AUTO_BACKUP_TASK);
        await NotificationService.dismissBackupNotification();
        LoggerService.info('TASK_MANAGER', 'Unregistered background backup task (disabled).');
      }
      return;
    }

    const minimumInterval = FREQUENCY_TO_MINUTES[frequency];
    await BackgroundTask.registerTaskAsync(AUTO_BACKUP_TASK, { minimumInterval });
    LoggerService.info('TASK_MANAGER', `Registered background backup task (frequency: ${frequency}, minimumInterval: ${minimumInterval}min)`);
  } catch (error) {
    LoggerService.warn('TASK_MANAGER', 'Failed to register background backup task', error);
  }
}
