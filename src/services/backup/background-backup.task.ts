import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { LoggerService } from '../logger.service';
import { NotificationService } from '../notification.service';
import { resolveAutoBackupEnabled, runAutoBackupIfDue } from './auto-backup.service';

const AUTO_BACKUP_TASK = 'fintraq-auto-backup-task';

// expo-task-manager only reschedules WorkManager on a task's first-ever registration.
// Re-registering an existing task just updates stored options, no reschedule (verified
// in TaskService.java). Track last-scheduled interval; force unregister+register when it changes.
const LAST_REGISTERED_INTERVAL_KEY = '@fintraq_bg_task_last_interval';

// WorkManager/BGTaskScheduler floor ~15min, OS decides actual timing. Prod = 24h, dev = 15min floor.
const MINIMUM_INTERVAL_MINUTES = __DEV__ ? 15 : 24 * 60;

// Must run at module load — OS can relaunch app headlessly to invoke this task.
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
        await AsyncStorage.removeItem(LAST_REGISTERED_INTERVAL_KEY);
        await NotificationService.dismissBackupNotification();
        LoggerService.info('TASK_MANAGER', 'Unregistered background backup task (disabled).');
      }
      return;
    }

    const lastIntervalStr = await AsyncStorage.getItem(LAST_REGISTERED_INTERVAL_KEY);
    const lastInterval = lastIntervalStr ? parseInt(lastIntervalStr, 10) : null;

    if (isRegistered && lastInterval === MINIMUM_INTERVAL_MINUTES) return;

    if (isRegistered) {
      // Interval changed — force unregister so the next register actually reschedules.
      await BackgroundTask.unregisterTaskAsync(AUTO_BACKUP_TASK);
    }

    await BackgroundTask.registerTaskAsync(AUTO_BACKUP_TASK, { minimumInterval: MINIMUM_INTERVAL_MINUTES });
    await AsyncStorage.setItem(LAST_REGISTERED_INTERVAL_KEY, String(MINIMUM_INTERVAL_MINUTES));
    LoggerService.info('TASK_MANAGER', `Registered background backup task (minimumInterval: ${MINIMUM_INTERVAL_MINUTES}min)`);
  } catch (error) {
    LoggerService.warn('TASK_MANAGER', 'Failed to register background backup task', error);
  }
}
