import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { runAutoBackupIfDue } from './auto-backup.service';

export const BACKGROUND_BACKUP_TASK_NAME = 'fintraq-background-backup';

// Must run unconditionally at module load, not inside a component or effect:
// when the OS relaunches the JS engine headlessly to execute this task, it
// re-evaluates the app's module graph from the entry point, and TaskManager
// only knows how to run a task if `defineTask` has already registered its
// executor by the time the task fires.
TaskManager.defineTask(BACKGROUND_BACKUP_TASK_NAME, async () => {
  try {
    const result = await runAutoBackupIfDue();
    console.log('[BackgroundBackupTask] Run result:', result.outcome);
    return result.outcome === 'failed'
      ? BackgroundTask.BackgroundTaskResult.Failed
      : BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.warn('[BackgroundBackupTask] Unhandled error:', error);
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

    await BackgroundTask.registerTaskAsync(BACKGROUND_BACKUP_TASK_NAME, {
      minimumInterval: 12 * 60, // minutes; OS treats this as a minimum, not exact
    });
  } catch (error) {
    console.warn('[BackgroundBackupTask] Failed to register:', error);
  }
}
