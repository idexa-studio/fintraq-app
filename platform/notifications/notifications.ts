import * as Notifications from 'expo-notifications';
import notifee, { AndroidImportance as NotifeeAndroidImportance, AndroidNotificationSetting } from 'react-native-notify-kit';
import { Platform } from 'react-native';
import { LoggerService } from '@/shared/logging/logger';
import { backupText, channelText, NOTIFICATION_PATHS } from '@/platform/notifications/notification-copy';
import type { NotificationText } from '@/platform/notifications/notification-copy';

export const CLOUD_BACKUP_NOTIFICATION_ID = 'cloud_backup_status';
/**
 * Android channel for daily and loan reminders. A channel's sound is fixed once created, so the
 * chime needs a channel of its own; the old one ('default', silent-default sound) is removed.
 */
export const REMINDERS_CHANNEL_ID = 'reminders_chime';
const LEGACY_REMINDERS_CHANNEL_ID = 'default';
/** Bundled by the expo-notifications plugin (app.json `sounds`): res/raw on Android, the app bundle on iOS. */
export const REMINDER_SOUND = 'fintraq_reminder.wav';
/**
 * Status-bar icon for notifications posted through notify-kit: the drawable expo-notifications
 * generates from app.json's notification icon. Without it Android shows the launcher icon, which
 * renders as a solid blob in the status bar.
 */
const SMALL_ICON = 'notification_icon';
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
        ...channelText.backup(),
        importance: NotifeeAndroidImportance.LOW,
      })
      .catch((e) => {
        backupChannelPromise = null;
        LoggerService.warn('NOTIFICATION', 'Failed to create backup channel', e);
      });
  }
  return backupChannelPromise;
}

/** A backup notification that stays until read, and opens Backup when tapped. */
async function presentBackupNotice({ title, body }: NotificationText): Promise<void> {
  try {
    await ensureBackupChannel();
    await notifee.displayNotification({
      id: CLOUD_BACKUP_NOTIFICATION_ID,
      title,
      body,
      data: { path: NOTIFICATION_PATHS.backup },
      android: { channelId: BACKUP_CHANNEL_ID, smallIcon: SMALL_ICON, autoCancel: true, pressAction: { id: 'default' } },
    });
  } catch (e) {
    LoggerService.warn('NOTIFICATION', 'Failed to present backup notification', e);
  }
}

/** Every call to the system's notification APIs goes through here; the words come from notification-copy. */
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
          // Renaming a channel keeps the user's choices for it; only a new id would reset them.
          ...channelText.reminders(),
          importance: Notifications.AndroidImportance.MAX,
          sound: REMINDER_SOUND,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C', // design-system-ignore: native Android LED colour
        });

        // Reminders are re-armed on the new channel by every sync, so nothing still points here.
        await Notifications.deleteNotificationChannelAsync(LEGACY_REMINDERS_CHANNEL_ID).catch(() => {});

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

  /** Posts a reminder at once, as it would arrive. For reading a line on a real lock screen. */
  async sendNow({ title, body, path }: NotificationText & { path: string }) {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: REMINDER_SOUND, data: { path } },
      trigger: { channelId: REMINDERS_CHANNEL_ID }, // no date: fires immediately
    });
  },

  /** The ongoing notification while a backup runs: what it is doing, and how far along. */
  async presentBackupProgressNotification(progress: number, stageText: string) {
    // iOS has no ongoing/progress notification style — each update would post a fresh banner.
    if (Platform.OS !== 'android') return;
    try {
      await ensureBackupChannel();
      const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));
      await notifee.displayNotification({
        id: CLOUD_BACKUP_NOTIFICATION_ID,
        title: backupText.running(),
        body: stageText,
        data: { path: NOTIFICATION_PATHS.backup },
        android: {
          channelId: BACKUP_CHANNEL_ID,
          smallIcon: SMALL_ICON,
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

  /** A backup failed for a reason that may pass. Left in place: a failure nobody saw is not handled. */
  presentBackupFailedNotification: () => presentBackupNotice(backupText.failed()),

  /** Backup stopped because the Google session ended: retrying cannot fix it, so say what will. */
  presentBackupReconnectNotification: () => presentBackupNotice(backupText.reconnect()),

  /** Takes the backup notification away. A backup that worked says nothing: it just goes. */
  async dismissBackupNotification() {
    try {
      await notifee.cancelNotification(CLOUD_BACKUP_NOTIFICATION_ID).catch(() => {});
    } catch {
      // Ignore dismiss error
    }
  },
};
