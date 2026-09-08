import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, {
  EventType,
  RepeatFrequency,
  TimeUnit,
  TriggerType,
} from 'react-native-notify-kit';
import { LoggerService } from '../logger.service';
import { AutoBackupFrequency, AutoBackupFrequencyEnum, resolveAutoBackupFrequency, runAutoBackupIfDue } from './auto-backup.service';

const SCHEDULER_TRIGGER_ID = 'fintraq_auto_backup_scheduler';
const LAST_SCHEDULED_FREQUENCY_KEY = '@fintraq_bg_task_last_frequency';

// Must run at module load — this is how notifee headlessly relaunches JS when
// the OS delivers a scheduled AlarmManager trigger while the app is killed/backgrounded.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type !== EventType.DELIVERED || detail.notification?.id !== SCHEDULER_TRIGGER_ID) {
    return;
  }

  LoggerService.info('TASK_MANAGER', 'AlarmManager woke background backup scheduler');

  try {
    const result = await runAutoBackupIfDue();
    LoggerService.info('TASK_MANAGER', `Headless background auto-backup outcome: ${result.outcome.toUpperCase()}`);
  } catch (error) {
    LoggerService.error('TASK_MANAGER', 'Failed to execute background auto-backup task', error);
  }
});

function frequencyToTrigger(frequency: AutoBackupFrequency) {
  if (frequency === AutoBackupFrequencyEnum.DEV_TWO_MIN) {
    return {
      type: TriggerType.INTERVAL as const,
      interval: 2,
      timeUnit: TimeUnit.MINUTES,
    };
  }

  const repeatFrequency =
    frequency === AutoBackupFrequencyEnum.DAILY ? RepeatFrequency.DAILY
    : frequency === AutoBackupFrequencyEnum.WEEKLY ? RepeatFrequency.WEEKLY
    : RepeatFrequency.MONTHLY;

  return {
    type: TriggerType.TIMESTAMP as const,
    timestamp: Date.now() + 60_000,
    repeatFrequency,
    alarmManager: true,
  };
}

/** Registers the AlarmManager-backed auto-backup schedule. Ensures alarm stays armed. */
export async function registerBackgroundBackupTaskAsync(): Promise<void> {
  try {
    const frequency = await resolveAutoBackupFrequency();
    const activeTriggers = await notifee.getTriggerNotificationIds();
    const isScheduled = activeTriggers.includes(SCHEDULER_TRIGGER_ID);
    const lastFrequency = await AsyncStorage.getItem(LAST_SCHEDULED_FREQUENCY_KEY);

    if (frequency === AutoBackupFrequencyEnum.OFF) {
      if (isScheduled || lastFrequency) {
        await notifee.cancelTriggerNotification(SCHEDULER_TRIGGER_ID);
        await AsyncStorage.removeItem(LAST_SCHEDULED_FREQUENCY_KEY);
        LoggerService.info('TASK_MANAGER', 'Cancelled background backup schedule (disabled).');
      }
      return;
    }

    // If already scheduled and frequency hasn't changed, keep active trigger intact
    if (isScheduled && frequency === lastFrequency) {
      return;
    }

    // Cancel existing trigger if frequency changed
    if (isScheduled) {
      await notifee.cancelTriggerNotification(SCHEDULER_TRIGGER_ID);
    }

    await notifee.createTriggerNotification(
      {
        id: SCHEDULER_TRIGGER_ID,
        title: 'Cloud Backup',
        body: 'Syncing your workspace in background...',
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
