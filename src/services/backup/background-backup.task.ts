import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, {
  AndroidForegroundServiceType,
  EventType,
  RepeatFrequency,
  TimeUnit,
  TriggerType,
} from 'react-native-notify-kit';
import { LoggerService } from '../logger.service';
import { AutoBackupFrequency, resolveAutoBackupFrequency, runAutoBackupIfDue } from './auto-backup.service';

// Scheduling now rides Android's AlarmManager via notifee trigger notifications —
// the same primitive WhatsApp/every reliable Android app uses for periodic work —
// instead of expo-background-task's self-chaining WorkManager one-shot, which
// silently died forever if any single execution got killed before it could
// re-enqueue the next run. AlarmManager triggers are natively repeating and
// survive reboot (notifee re-arms them via its own BOOT_COMPLETED receiver), so
// there is no app-managed re-enqueue step left to fail.
const SCHEDULER_TRIGGER_ID = 'fintraq_auto_backup_scheduler';
const FOREGROUND_NOTIFICATION_ID = 'cloud_backup_status';
const LAST_SCHEDULED_FREQUENCY_KEY = '@fintraq_bg_task_last_frequency';

/** Runs the actual backup inside a real Android foreground service (visible, OS-protected execution). */
notifee.registerForegroundService(() => runAutoBackupIfDue().then(() => undefined));

// Must run at module load — this is how notifee headlessly relaunches JS when
// the OS delivers a scheduled trigger while the app is fully killed.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type !== EventType.DELIVERED || detail.notification?.id !== SCHEDULER_TRIGGER_ID) {
    return;
  }

  LoggerService.info('TASK_MANAGER', 'AlarmManager woke the background backup scheduler');

  try {
    await notifee.cancelNotification(SCHEDULER_TRIGGER_ID);
    await notifee.displayNotification({
      id: FOREGROUND_NOTIFICATION_ID,
      title: 'Cloud Backup Syncing',
      body: 'Preparing workspace snapshot...',
      android: {
        channelId: 'backup_status',
        asForegroundService: true,
        foregroundServiceTypes: [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_DATA_SYNC],
        ongoing: true,
        onlyAlertOnce: true,
        pressAction: { id: 'default' },
        progress: { max: 100, current: 5, indeterminate: false },
      },
    });
  } catch (error) {
    LoggerService.error('TASK_MANAGER', 'Failed to start background backup foreground service', error);
  }
});

function frequencyToTrigger(frequency: AutoBackupFrequency) {
  if (frequency === '15min') {
    return { type: TriggerType.INTERVAL as const, interval: 15, timeUnit: TimeUnit.MINUTES };
  }

  const repeatFrequency =
    frequency === 'daily' ? RepeatFrequency.DAILY
    : frequency === 'weekly' ? RepeatFrequency.WEEKLY
    : RepeatFrequency.MONTHLY;

  return {
    type: TriggerType.TIMESTAMP as const,
    timestamp: Date.now() + 60_000,
    repeatFrequency,
    alarmManager: true,
  };
}

/** Registers the AlarmManager-backed auto-backup schedule. No-ops if already scheduled at this frequency. */
export async function registerBackgroundBackupTaskAsync(): Promise<void> {
  try {
    const frequency = await resolveAutoBackupFrequency();
    const lastFrequency = await AsyncStorage.getItem(LAST_SCHEDULED_FREQUENCY_KEY);

    if (frequency === 'off') {
      if (lastFrequency) {
        await notifee.cancelTriggerNotification(SCHEDULER_TRIGGER_ID);
        await AsyncStorage.removeItem(LAST_SCHEDULED_FREQUENCY_KEY);
        LoggerService.info('TASK_MANAGER', 'Cancelled background backup schedule (auto-backup disabled).');
      }
      return;
    }

    if (frequency === lastFrequency) return;

    await notifee.createTriggerNotification(
      {
        id: SCHEDULER_TRIGGER_ID,
        title: 'Cloud Backup',
        body: 'Syncing your workspace...',
        android: { channelId: 'backup_status' },
      },
      frequencyToTrigger(frequency),
    );

    await AsyncStorage.setItem(LAST_SCHEDULED_FREQUENCY_KEY, frequency);
    LoggerService.info('TASK_MANAGER', `Scheduled background backup (frequency: ${frequency})`);
  } catch (error) {
    LoggerService.warn('TASK_MANAGER', 'Failed to schedule background backup', error);
  }
}
