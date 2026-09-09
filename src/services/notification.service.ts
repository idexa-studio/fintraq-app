import * as Notifications from 'expo-notifications';
import notifee, { AndroidImportance as NotifeeAndroidImportance } from 'react-native-notify-kit';
import { Platform } from 'react-native';
import { LoggerService } from '@/src/services/logger.service';

const REMINDER_POOL = [
  { title: "Financial Hygiene Check 🧼", body: "Where did those funds go? Log your spends now to keep your dashboard accurate." },
  { title: "Your Streak is Sweating 💦", body: "Don't let your persistence drop. Log one transaction today to save your streak." },
  { title: "Fintraq OS: Action Required ⚠️", body: "A gap in your data detected. Ensure your financial ledger is up to date." },
  { title: "The Money Trail 👣", body: "Keeping track of every cent is the first step to freedom. Spend 30 seconds logging now." },
  { title: "Wallet Audit 🧐", body: "Did you buy lunch? Coffee? A small spend is still a spend. Log it in Fintraq." },
  { title: "Consistency > Intensity 🔄", body: "Tiny daily tracking wins lead to massive insights. Keep going!" },
  { title: "Don't Break the Chain ⛓️", body: "Your streak is looking strong. Keep it alive by logging today's activity." },
  { title: "Mindful Spending 🧘", body: "Knowledge is power. Log your latest transaction to see its impact on your runway." },
];

export const CLOUD_BACKUP_NOTIFICATION_ID = 'cloud_backup_status';

// The single notifee.onBackgroundEvent listener lives in background-backup.task.ts —
// notifee only keeps the last-registered handler, so it must not be set here too.

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
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Reminders & Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await notifee.createChannel({
          id: 'backup_status',
          name: 'Cloud Backup Progress',
          importance: NotifeeAndroidImportance.LOW,
        });
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
   * scheduleDailyReminder: Schedules a repeating daily notification at the specified time.
   * @param timeStr "HH:mm" format (e.g., "20:00")
   */
  async scheduleDailyReminder(timeStr: string) {
    const [hours, minutes] = timeStr.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes)) {
      LoggerService.warn('NOTIFICATION', 'Invalid reminder time format', timeStr);
      return;
    }

    // Check if the exact same schedule is already in place — avoid cancel+reschedule race
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    const alreadyScheduled = existing.some((n) => {
      if (n.identifier !== 'daily_reminder') return false;
      const t = n.trigger as { hour?: number; minute?: number; value?: { hour?: number; minute?: number } };
      const h = t?.hour ?? t?.value?.hour;
      const m = t?.minute ?? t?.value?.minute;
      return h === hours && m === minutes;
    });

    if (alreadyScheduled) {
      LoggerService.info('NOTIFICATION', `Daily reminder already scheduled for ${timeStr}, skipping`);
      return;
    }

    // Cancel previous daily reminder trigger specifically without wiping other notifications
    await Notifications.cancelScheduledNotificationAsync('daily_reminder').catch(() => {});

    // Pick a random message from the pool
    const randomIndex = Math.floor(Math.random() * REMINDER_POOL.length);
    const message = REMINDER_POOL[randomIndex];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
      identifier: 'daily_reminder',
    });

    LoggerService.info('NOTIFICATION', `Daily reminder scheduled for ${timeStr}`);
  },

  /**
   * dismissToday: Skips any pending reminders for today and resumes the cycle tomorrow.
   * Useful when the user has already recorded their transactions for the day.
   */
  async dismissToday(timeStr: string) {
    // Cancel the current daily reminder trigger specifically without wiping other notifications
    await Notifications.cancelScheduledNotificationAsync('daily_reminder').catch(() => {});

    const [hours, minutes] = timeStr.split(':').map(Number);

    // Re-schedule using DAILY — the OS will fire it at the same time tomorrow
    // (a DAILY trigger that was just cancelled and rescheduled won't fire again
    // until the next 24-hour cycle.)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Stay consistent! ✍️",
        body: "You're already doing great. Let's keep the streak alive tomorrow as well.",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
      identifier: 'daily_reminder',
    });

    LoggerService.info('NOTIFICATION', `Reminder dismissed for today, resuming tomorrow at ${timeStr}`);
  },

  /**
   * triggerInstantNotification: Fires a sample notification immediately.
   * Useful for manual QA/Dev verification of branding and behavior.
   */
  async triggerInstantNotification() {
    const randomIndex = Math.floor(Math.random() * REMINDER_POOL.length);
    const message = REMINDER_POOL[randomIndex];

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
    try {
      const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));
      const cleanStage = stageText || 'Syncing workspace data to Google Drive...';

      await notifee.displayNotification({
        id: CLOUD_BACKUP_NOTIFICATION_ID,
        title: '☁️ Cloud Backup Syncing',
        body: cleanStage,
        android: {
          channelId: 'backup_status',
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
    await this.presentBackupProgressNotification(5, 'Starting background backup...');
  },

  /**
   * presentBackupCompleteNotification: Shows OS push when background backup finishes.
   */
  async presentBackupCompleteNotification() {
    try {
      await notifee.displayNotification({
        id: CLOUD_BACKUP_NOTIFICATION_ID,
        title: '✅ Cloud Backup Complete',
        body: 'Your workspace history was safely backed up to cloud storage.',
        android: {
          channelId: 'backup_status',
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
      await notifee.displayNotification({
        id: CLOUD_BACKUP_NOTIFICATION_ID,
        title: '⚠️ Cloud Backup Failed',
        body: 'Could not complete cloud backup. Please check your internet connection.',
        android: {
          channelId: 'backup_status',
          autoCancel: true,
          pressAction: { id: 'default' },
        },
      });
    } catch (e) {
      LoggerService.warn('NOTIFICATION', 'Failed to present backup failed notification', e);
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

  /**
   * cancelByIdentifiers: Cancels specific notifications by ID without touching others.
   */
  async cancelByIdentifiers(ids: string[]) {
    await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id)));
  },

  /**
   * scheduleLoanEmiReminder: Schedules monthly EMI reminder for a loan.
   * iOS: single repeating calendar trigger. Android: 6 individual monthly triggers.
   * Returns array of scheduled notification identifiers (store on the loan record).
   */
  async scheduleLoanEmiReminder(
    loanId: number,
    day: number,
    timeStr: string,
    personName: string,
    loanType: 'lend' | 'borrow',
  ): Promise<string[]> {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return [];

    const title = loanType === 'lend' ? 'Payment incoming?' : 'EMI due today';
    const body = loanType === 'lend'
      ? `${personName} should send you a repayment today.`
      : `Don't forget — send ${personName} their repayment today.`;

    const ids: string[] = [];

    if (Platform.OS === 'ios') {
      const identifier = `loan_emi_${loanId}`;
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: { title, body, sound: true },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          day,
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });
      ids.push(identifier);
    } else {
      // Android: schedule next 6 months individually
      const now = new Date();
      for (let i = 0; i < 6; i++) {
        const target = new Date(now.getFullYear(), now.getMonth() + i, day, hours, minutes, 0);
        if (target <= now) continue;
        const identifier = `loan_emi_${loanId}_${target.getFullYear()}_${target.getMonth()}`;
        await Notifications.scheduleNotificationAsync({
          identifier,
          content: { title, body, sound: true },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: target,
          },
        });
        ids.push(identifier);
      }
    }

    return ids;
  },

  /**
   * extendAndroidEmiReminders: On app launch (Android only), fills gaps in next 6-month
   * notification window for loans with active EMI reminders.
   */
  async extendAndroidEmiReminders(
    configs: {
      loanId: number;
      day: number;
      timeStr: string;
      personName: string;
      loanType: 'lend' | 'borrow';
      existingIds: string[];
    }[],
  ): Promise<Map<number, string[]>> {
    if (Platform.OS !== 'android') return new Map();
    const result = new Map<number, string[]>();

    for (const cfg of configs) {
      const [hours, minutes] = cfg.timeStr.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) continue;

      const title = cfg.loanType === 'lend' ? 'Payment incoming?' : 'EMI due today';
      const body = cfg.loanType === 'lend'
        ? `${cfg.personName} should send you a repayment today.`
        : `Don't forget — send ${cfg.personName} their repayment today.`;

      const now = new Date();
      const newIds = [...cfg.existingIds];

      for (let i = 0; i < 6; i++) {
        const target = new Date(now.getFullYear(), now.getMonth() + i, cfg.day, hours, minutes, 0);
        if (target <= now) continue;
        const identifier = `loan_emi_${cfg.loanId}_${target.getFullYear()}_${target.getMonth()}`;
        if (cfg.existingIds.includes(identifier)) continue;
        await Notifications.scheduleNotificationAsync({
          identifier,
          content: { title, body, sound: true },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: target,
          },
        });
        newIds.push(identifier);
      }

      result.set(cfg.loanId, newIds);
    }

    return result;
  },

  /**
   * scheduleLoanDueReminder: Schedules a one-time reminder before loan due date.
   * Returns the notification identifier.
   */
  async scheduleLoanDueReminder(
    loanId: number,
    dueDate: string,
    daysBefore: number,
    timeStr: string,
    personName: string,
    loanType: 'lend' | 'borrow',
  ): Promise<string | null> {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;

    const due = new Date(dueDate);
    const target = new Date(due.getFullYear(), due.getMonth(), due.getDate() - daysBefore, hours, minutes, 0);
    if (target <= new Date()) return null;

    const identifier = `loan_due_${loanId}`;
    const dayLabel = daysBefore === 0 ? 'today' : daysBefore === 1 ? 'tomorrow' : `in ${daysBefore} days`;
    const title = loanType === 'lend' ? 'Loan due soon' : 'Repayment due soon';
    const body = loanType === 'lend'
      ? `${personName}'s loan is due ${dayLabel}.`
      : `Your loan repayment to ${personName} is due ${dayLabel}.`;

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: { title, body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: target,
      },
    });

    return identifier;
  },
};
