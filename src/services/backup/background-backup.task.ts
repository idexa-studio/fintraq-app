import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { LoggerService } from '../logger.service';
import { resolveAutoBackupFrequency, runAutoBackupIfDue } from './auto-backup.service';

export const BACKGROUND_BACKUP_TASK_NAME = 'fintraq-background-backup';

// Must run unconditionally at module load, not inside a component or effect:
// when the OS relaunches the JS engine headlessly to execute this task, it
// re-evaluates the app's module graph from the entry point, and TaskManager
// only knows how to run a task if `defineTask` has already registered its
// executor by the time the task fires.

TaskManager.defineTask(BACKGROUND_BACKUP_TASK_NAME, async () => {
  try {
    await LoggerService.info('TASK_MANAGER', 'OS background task executor fired', undefined, 'BACKGROUND');
    const result = await runAutoBackupIfDue();
    await LoggerService.info('TASK_MANAGER', `Background task completed with outcome: ${result.outcome.toUpperCase()}`, { outcome: result.outcome }, 'BACKGROUND');
    return result.outcome === 'failed'
      ? BackgroundTask.BackgroundTaskResult.Failed
      : BackgroundTask.BackgroundTaskResult.Success;
  } catch (error: any) {
    await LoggerService.error('TASK_MANAGER', `Unhandled background task error: ${error?.message || String(error)}`, { error: String(error) }, 'BACKGROUND');
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/**
 * Registers the OS-level background backup task (Android WorkManager / iOS
 * BGTaskScheduler) so scheduled auto-backups keep running even when the app
 * is fully killed, not just backgrounded. Registration is idempotent — safe
 * to call on every app launch. The OS decides the actual execution cadence;
 * `runAutoBackupIfDue()` is still the one deciding whether a backup is
 * actually due each time the OS wakes the task.
 */
export async function registerBackgroundBackupTaskAsync(): Promise<void> {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status !== BackgroundTask.BackgroundTaskStatus.Available) {
      console.log('[BackgroundBackupTask] Background tasks unavailable on this device/OS setting.');
      return;
    }

    const frequency = await resolveAutoBackupFrequency();
    if (frequency === 'off') {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_BACKUP_TASK_NAME);
      if (isRegistered) {
        await BackgroundTask.unregisterTaskAsync(BACKGROUND_BACKUP_TASK_NAME);
        console.log('[BackgroundBackupTask] Unregistered background task (auto-backup disabled).');
      }
      return;
    }

    // Dev 15min mode uses 15m minimum interval; Production (daily/weekly/monthly) uses 12h (720m).
    const minimumInterval = frequency === '15min' ? 15 : 12 * 60;

    await BackgroundTask.registerTaskAsync(BACKGROUND_BACKUP_TASK_NAME, {
      minimumInterval,
    });
    console.log(`[BackgroundBackupTask] Registered background task with ${minimumInterval}m minimum interval.`);
  } catch (error) {
    console.warn('[BackgroundBackupTask] Failed to register:', error);
  }
}
