import * as Notifications from 'expo-notifications';
import notifee, { AndroidImportance as NotifeeAndroidImportance, AndroidNotificationSetting } from 'react-native-notify-kit';
import { Platform } from 'react-native';
import { LoggerService } from './logger.service';
import i18n from '@/src/i18n';

const REMINDER_KEYS = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'] as const;

const pickReminder = () => {
  const key = REMINDER_KEYS[Math.floor(Math.random() * REMINDER_KEYS.length)];
  return { title: i18n.t(`notifications.${key}.title`), body: i18n.t(`notifications.${key}.body`) };
};

export const CLOUD_BACKUP_NOTIFICATION_ID = 'cloud_backup_status';
/** Android channel for daily and loan reminders (kept as 'default' so existing installs keep their settings). */
export const REMINDERS_CHANNEL_ID = 'default';
const BACKUP_CHANNEL_ID = 'backup_status';

let backupChannelPromise: Promise<unknown> | null = null;

/**
 * The headless background task can post before init() has ever run in this process
 * (or before the app was first opened after an update), so create the channel on demand.
 * createChannel is idempotent; memoised so progress updates don't re-issue it.
 */
function ensureBackupChannel(): Promise<unknown> {
  if (Platform.OS !== 'android') return Promise.resolve();
  if (!backupChannelPromise) {
    backupChannelPromise = notifee
      .createChannel({
        id: BACKUP_CHANNEL_ID,
        name: i18n.t('notifications.channelBackup'),
        importance: NotifeeAndroidImportance.LOW,
      })
      .catch((e) => {
        backupChannelPromise = null;
        LoggerService.warn('NOTIFICATION', 'Failed to create backup channel', e);
      });
  }
  return backupChannelPromise;
}

/**
 * NotificationService: Centralized infrastructure for local device reminders.
 * 
 * DESIGN PHILOSOPHY:
 * 1. Single Source of Truth: All OS-level notification calls happen here.
 * 2. High Reliability: Handles permission checks and re-scheduling gracefully.
 * 3. Minimal Impact: Cancels all previous schedules before creating new ones to avoid duplicates.
 */
export const NotificationService = {
  /**
   * Configures how the app should handle notifications while foregrounded.
   */
  async init() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync(REMINDERS_CHANNEL_ID, {
          name: i18n.t('notifications.channelReminders'),
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C', // design-system-ignore: native Android LED colour
        });

        await ensureBackupChannel();
      } catch (e) {
        LoggerService.warn('NOTIFICATION', 'Failed to set up notification channel', e);
      }
    }
  },

  /**
   * Checks current permission status. Returns true if granted.
   */
  async checkPermissions(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  },

  /**
   * Requests notification permissions from the OS.
   */
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    await this.init();
    return finalStatus === 'granted';
  },

  /**
   * Whether Android lets the app fire reminders at the exact minute. Android 14+ turns this off
   * for new installs; without it the OS may deliver reminders late to save battery.
   */
  async hasExactAlarmAccess(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    try {
      const settings = await notifee.getNotificationSettings();
      return settings.android.alarm !== AndroidNotificationSetting.DISABLED;
    } catch {
      return true;
    }
  },

  /** Opens Android's "Alarms & reminders" access screen for the app (no-op below Android 12). */
  async openExactAlarmSettings(): Promise<void> {
    if (Platform.OS !== 'android') return;
    await notifee.openAlarmPermissionSettings().catch(() => {});
  },

  /**
   * triggerInstantNotification: Fires a sample notification immediately.
   * Useful for manual QA/Dev verification of branding and behavior.
   */
  async triggerInstantNotification() {
    const message = pickReminder();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `[TEST] ${message.title}`,
        body: message.body,
        sound: true,
      },
      trigger: null, // null means trigger immediately
    });
  },

  /**
   * presentBackupProgressNotification: Shows a sticky OS notification with native Android progress bar & text progress via react-native-notify-kit.
   */
  async presentBackupProgressNotification(progress: number, stageText: string) {
    // iOS has no ongoing/progress notification style — each update would post a fresh banner.
    if (Platform.OS !== 'android') return;
    try {
      await ensureBackupChannel();
      const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));
      const cleanStage = stageText || i18n.t('notifications.syncingStage');

      await notifee.displayNotification({
        id: CLOUD_BACKUP_NOTIFICATION_ID,
        title: i18n.t('notifications.backupSyncing'),
        body: cleanStage,
        android: {
          channelId: BACKUP_CHANNEL_ID,
          ongoing: true,
          onlyAlertOnce: true,
          pressAction: { id: 'default' },
          progress: {
            max: 100,
            current: clampedProgress,
            indeterminate: false,
          },
        },
      });
    } catch (e) {
      LoggerService.warn('NOTIFICATION', 'Failed to present backup progress notification', e);
    }
  },

  /**
   * presentBackupStartNotification: Alias for 5% initial progress notification.
   */
  async presentBackupStartNotification() {
    await this.presentBackupProgressNotification(5, i18n.t('notifications.startingBackup'));
  },

  /**
   * presentBackupCompleteNotification: Shows OS push when background backup finishes.
   */
  async presentBackupCompleteNotification() {
    try {
      await ensureBackupChannel();
      await notifee.displayNotification({
        id: CLOUD_BACKUP_NOTIFICATION_ID,
        title: i18n.t('notifications.backupComplete'),
        body: i18n.t('notifications.backupCompleteBody'),
        android: {
          channelId: BACKUP_CHANNEL_ID,
          autoCancel: true,
          pressAction: { id: 'default' },
        },
      });
    } catch (e) {
      LoggerService.warn('NOTIFICATION', 'Failed to present backup complete notification', e);
    }
  },

  /**
   * presentBackupFailedNotification: Shows OS push if background backup fails.
   */
  async presentBackupFailedNotification() {
    try {
      await ensureBackupChannel();
      await notifee.displayNotification({
        id: CLOUD_BACKUP_NOTIFICATION_ID,
        title: i18n.t('notifications.backupFailed'),
        body: i18n.t('notifications.backupFailedBody'),
        android: {
          channelId: BACKUP_CHANNEL_ID,
          autoCancel: true,
          pressAction: { id: 'default' },
        },
      });
    } catch (e) {
      LoggerService.warn('NOTIFICATION', 'Failed to present backup failed notification', e);
    }
  },

  /**
   * presentBackupReconnectNotification: Backup stopped because the Google session ended —
   * retrying can't fix it, so tell the user the one action that will.
   */
  async presentBackupReconnectNotification() {
    try {
      await ensureBackupChannel();
      await notifee.displayNotification({
        id: CLOUD_BACKUP_NOTIFICATION_ID,
        title: i18n.t('notifications.backupReconnect'),
        body: i18n.t('notifications.backupReconnectBody'),
        android: {
          channelId: BACKUP_CHANNEL_ID,
          autoCancel: true,
          pressAction: { id: 'default' },
        },
      });
    } catch (e) {
      LoggerService.warn('NOTIFICATION', 'Failed to present backup reconnect notification', e);
    }
  },

  /**
   * dismissBackupNotification: Clears the cloud backup status notification.
   */
  async dismissBackupNotification() {
    try {
      await notifee.cancelNotification(CLOUD_BACKUP_NOTIFICATION_ID).catch(() => {});
    } catch {
      // Ignore dismiss error
    }
  },

  /**
   * cancelAllReminders: Stops all future notifications.
   */
  async cancelAllReminders() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};
