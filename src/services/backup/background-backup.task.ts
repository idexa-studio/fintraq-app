import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { LoggerService } from '../logger.service';
import { resolveAutoBackupFrequency, runAutoBackupIfDue } from './auto-backup.service';

export const BACKGROUND_BACKUP_TASK_NAME = 'fintraq-background-backup';

// Android re-enqueues with CANCEL_AND_REENQUEUE on every registerTaskAsync()
// call, resetting the countdown — track last interval to skip no-op re-registers.
const LAST_REGISTERED_INTERVAL_KEY = '@fintraq_bg_task_last_interval';

// Must run at module load — OS relaunches JS headlessly to run this task.
TaskManager.defineTask(BACKGROUND_BACKUP_TASK_NAME, async () => {
  try {
    LoggerService.info('TASK_MANAGER', 'OS woke the background backup task');
    const result = await runAutoBackupIfDue();
    LoggerService.info('TASK_MANAGER', `Task finished with outcome: ${result.outcome}`);
    return result.outcome === 'failed'
      ? BackgroundTask.BackgroundTaskResult.Failed
      : BackgroundTask.BackgroundTaskResult.Success;
  } catch (error: any) {
    LoggerService.error('TASK_MANAGER', 'Unhandled error in background task', error?.message || String(error));
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/** Registers the OS-level background backup task. No-ops if already registered at this interval. */
export async function registerBackgroundBackupTaskAsync(): Promise<void> {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status !== BackgroundTask.BackgroundTaskStatus.Available) {
      LoggerService.info('TASK_MANAGER', 'Background tasks unavailable on this device/OS setting.');
      return;
    }

    const frequency = await resolveAutoBackupFrequency();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_BACKUP_TASK_NAME);

    if (frequency === 'off') {
      if (isRegistered) {
        await BackgroundTask.unregisterTaskAsync(BACKGROUND_BACKUP_TASK_NAME);
        await AsyncStorage.removeItem(LAST_REGISTERED_INTERVAL_KEY);
        LoggerService.info('TASK_MANAGER', 'Unregistered background task (auto-backup disabled).');
      }
      return;
    }

    // Dev 15min mode uses 15m minimum interval; Production (daily/weekly/monthly) uses 12h (720m).
    const minimumInterval = frequency === '15min' ? 15 : 12 * 60;

    const lastIntervalStr = await AsyncStorage.getItem(LAST_REGISTERED_INTERVAL_KEY);
    const lastInterval = lastIntervalStr ? parseInt(lastIntervalStr, 10) : null;

    if (isRegistered && lastInterval === minimumInterval) return;

    await BackgroundTask.registerTaskAsync(BACKGROUND_BACKUP_TASK_NAME, {
      minimumInterval,
    });
    await AsyncStorage.setItem(LAST_REGISTERED_INTERVAL_KEY, String(minimumInterval));
    LoggerService.info('TASK_MANAGER', `Registered background task with ${minimumInterval}m minimum interval.`);
  } catch (error) {
    LoggerService.warn('TASK_MANAGER', 'Failed to register', error);
  }
}
