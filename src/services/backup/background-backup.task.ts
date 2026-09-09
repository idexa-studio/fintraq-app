import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, {
  AndroidImportance,
  EventType,
  RepeatFrequency,
  TriggerType,
} from 'react-native-notify-kit';
import { LoggerService } from '../logger.service';
import { NotificationService } from '../notification.service';
import {
  AUTO_BACKUP_FREQUENCY_THRESHOLDS_MS,
  AUTO_BACKUP_STORAGE_KEYS,
  AutoBackupFrequency,
  AutoBackupFrequencyEnum,
  resolveAutoBackupFrequency,
  runAutoBackupIfDue,
} from './auto-backup.service';

const SCHEDULER_TRIGGER_ID = 'fintraq_auto_backup_trigger';
const LAST_SCHEDULED_FREQUENCY_KEY = '@fintraq_bg_task_last_frequency';

// Must run at module load — this is how notifee headlessly relaunches JS when
// the OS delivers a scheduled AlarmManager trigger while the app is killed/backgrounded.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (detail.notification?.id !== SCHEDULER_TRIGGER_ID) {
    return;
  }

  // Dismiss any static OS trigger notification immediately so it never lingers
  await notifee.cancelNotification(SCHEDULER_TRIGGER_ID).catch(() => {});

  if (type === EventType.DISMISSED || type === EventType.TRIGGER_NOTIFICATION_CREATED) {
    return;
  }

  LoggerService.info('TASK_MANAGER', `AlarmManager woke background backup scheduler (event type: ${type})`);

  try {
    const result = await runAutoBackupIfDue(false);
    LoggerService.info('TASK_MANAGER', `Headless background auto-backup outcome: ${result.outcome.toUpperCase()}`);
    if (result.outcome === 'skipped') {
      await NotificationService.dismissBackupNotification();
    }
  } catch (error) {
    LoggerService.error('TASK_MANAGER', 'Failed to execute background auto-backup task', error);
    await NotificationService.presentBackupFailedNotification();
  }

  // In 1-min dev mode, re-arm the next 1-min trigger for continuous dev testing
  const currentFrequency = await resolveAutoBackupFrequency();
  if (currentFrequency === AutoBackupFrequencyEnum.DEV_ONE_MIN) {
    await registerBackgroundBackupTaskAsync(true);
  }
});

async function frequencyToTrigger(frequency: AutoBackupFrequency) {
  let repeatFrequency: RepeatFrequency;
  switch (frequency) {
    case AutoBackupFrequencyEnum.DEV_ONE_MIN:
      repeatFrequency = RepeatFrequency.HOURLY;
      break;
    case AutoBackupFrequencyEnum.DAILY:
      repeatFrequency = RepeatFrequency.DAILY;
      break;
    case AutoBackupFrequencyEnum.WEEKLY:
      repeatFrequency = RepeatFrequency.WEEKLY;
      break;
    case AutoBackupFrequencyEnum.MONTHLY:
      repeatFrequency = RepeatFrequency.MONTHLY;
      break;
    default:
      repeatFrequency = RepeatFrequency.DAILY;
      break;
  }

  const lastAutoTimeStr = await AsyncStorage.getItem(AUTO_BACKUP_STORAGE_KEYS.LAST_AUTO_BACKUP_TIME);
  const now = Date.now();
  const lastAutoTime = lastAutoTimeStr ? parseInt(lastAutoTimeStr, 10) : 0;
  const intervalMs = AUTO_BACKUP_FREQUENCY_THRESHOLDS_MS[frequency] ?? (24 * 60 * 60 * 1000);

  // If previous backup happened recently, target (lastAutoTime + intervalMs); otherwise start in 60s
  const targetTime = lastAutoTime > 0 ? lastAutoTime + intervalMs : now + 60_000;
  const firstTriggerTimestamp = Math.max(now + 60_000, targetTime);

  return {
    type: TriggerType.TIMESTAMP as const,
    timestamp: firstTriggerTimestamp,
    repeatFrequency,
    alarmManager: {
      allowWhileIdle: true,
    },
  };
}

/** Registers the AlarmManager-backed auto-backup schedule. Ensures alarm stays armed. */
export async function registerBackgroundBackupTaskAsync(forceReschedule = false): Promise<void> {
  try {
    const frequency = await resolveAutoBackupFrequency();
    const activeTriggers = await notifee.getTriggerNotificationIds();
    const isScheduled = activeTriggers.includes(SCHEDULER_TRIGGER_ID);
    const lastFrequency = await AsyncStorage.getItem(LAST_SCHEDULED_FREQUENCY_KEY);

    if (frequency === AutoBackupFrequencyEnum.OFF) {
      if (isScheduled || lastFrequency) {
        await notifee.cancelTriggerNotification(SCHEDULER_TRIGGER_ID);
        await notifee.cancelNotification(SCHEDULER_TRIGGER_ID).catch(() => {});
        await NotificationService.dismissBackupNotification();
        await AsyncStorage.removeItem(LAST_SCHEDULED_FREQUENCY_KEY);
        LoggerService.info('TASK_MANAGER', 'Cancelled background backup schedule (disabled).');
      }
      return;
    }

    // If already scheduled, frequency hasn't changed, and not forced, keep active trigger intact
    if (!forceReschedule && isScheduled && frequency === lastFrequency) {
      return;
    }

    // Cancel existing trigger if frequency changed or forced
    if (isScheduled) {
      await notifee.cancelTriggerNotification(SCHEDULER_TRIGGER_ID);
      await notifee.cancelNotification(SCHEDULER_TRIGGER_ID).catch(() => {});
      await NotificationService.dismissBackupNotification();
    }

    // Ensure the notification channel is created prior to trigger notification registration
    await notifee.createChannel({
      id: 'backup_status',
      name: 'Cloud Backup Progress',
      importance: AndroidImportance.LOW,
    });

    await notifee.createTriggerNotification(
      {
        id: SCHEDULER_TRIGGER_ID,
        title: '☁️ Cloud Backup',
        body: 'Syncing your workspace in background...',
        android: { channelId: 'backup_status' },
      },
      await frequencyToTrigger(frequency),
    );

    await AsyncStorage.setItem(LAST_SCHEDULED_FREQUENCY_KEY, frequency);
    LoggerService.info('TASK_MANAGER', `Scheduled background backup (frequency: ${frequency})`);
  } catch (error) {
    LoggerService.warn('TASK_MANAGER', 'Failed to schedule background backup', error);
  }
}
