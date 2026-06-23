import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
  init() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
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

    // On Android, we need to set up a channel for notifications
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return finalStatus === 'granted';
  },

  /**
   * scheduleDailyReminder: Schedules a repeating daily notification at the specified time.
   * @param timeStr "HH:mm" format (e.g., "20:00")
   */
  async scheduleDailyReminder(timeStr: string) {
    const [hours, minutes] = timeStr.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes)) {
      console.warn('[NotificationService] Invalid time format provided:', timeStr);
      return;
    }

    // Check if the exact same schedule is already in place — avoid cancel+reschedule race
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    const alreadyScheduled = existing.some((n) => {
      if (n.identifier !== 'daily_reminder') return false;
      const t = n.trigger as { hour?: number; minute?: number };
      return t?.hour === hours && t?.minute === minutes;
    });

    if (alreadyScheduled) {
      console.log(`[NotificationService] Daily reminder already scheduled for ${timeStr}, skipping.`);
      return;
    }

    // Cancel existing before creating a new one (different time)
    await this.cancelAllReminders();

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

    console.log(`[NotificationService] Daily reminder scheduled for ${timeStr}`);
  },

  /**
   * dismissToday: Skips any pending reminders for today and resumes the cycle tomorrow.
   * Useful when the user has already recorded their transactions for the day.
   */
  async dismissToday(timeStr: string) {
    // Cancel the current trigger so today's notification is suppressed
    await this.cancelAllReminders();

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

    console.log(`[NotificationService] Reminder dismissed for today. Resuming tomorrow at ${timeStr}`);
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
   * cancelAllReminders: Stops all future notifications.
   */
  async cancelAllReminders() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};
