import { getEntryDays, getReminderLoans } from '@/data/repositories/reminders';
import { StorageKeys } from '@/shared/contracts/storage-keys';
import { LoggerService } from '@/shared/logging/logger';
import { readStoredProfile } from '@/shared/settings/profile';
import type { UserProfile } from '@/shared/settings/profile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { dailyLineFor, factsWindowStart } from '@/platform/notifications/daily-line';
import type { DailyFacts } from '@/platform/notifications/daily-line';
import { reminderContent } from '@/platform/notifications/notification-copy';
import { REMINDER_SOUND, REMINDERS_CHANNEL_ID } from '@/platform/notifications/notifications';
import {
  capReminders,
  IOS_PENDING_LIMIT,
  isAppReminderId,
  localDateKey,
  parseClock,
  planDailyReminders,
  planLoanReminders,
  PlannedReminder,
} from '@/platform/notifications/reminder-plan';

const readProfile = async (): Promise<Partial<UserProfile>> => {
  try {
    return (await readStoredProfile()) ?? {};
  } catch {
    return {};
  }
};

async function runSync(): Promise<void> {
  const now = new Date();
  const [profile, skipDateKey, permission] = await Promise.all([
    readProfile(),
    AsyncStorage.getItem(StorageKeys.REMINDER_SKIPPED_DATE).catch(() => null),
    Notifications.getPermissionsAsync(),
  ]);

  let planned: PlannedReminder[] = [];
  let facts: DailyFacts = { entryDays: [], lastEntryDay: null, loans: [] };
  if (permission.status === 'granted') {
    const dailyTime = profile.reminderEnabled ? parseClock(profile.reminderTime ?? '20:00') : null;
    const [loanRows, entries] = await Promise.all([getReminderLoans(), getEntryDays(localDateKey(factsWindowStart(now)), localDateKey(now))]);
    facts = { ...entries, loans: loanRows.map((loan) => ({ ...loan, hasOwnReminder: loan.dueReminderEnabled })) };

    planned = capReminders(
      [...(dailyTime ? planDailyReminders(now, dailyTime, skipDateKey) : []), ...planLoanReminders(now, loanRows)],
      Platform.OS === 'ios' ? IOS_PENDING_LIMIT : null,
    );
  }

  // Replace, never patch: every sync re-arms each alarm, so one scheduled as inexact (before the
  // user allowed exact alarms) becomes exact on the next launch or resume. It is also what keeps
  // each line true: the text is written again from the records as they are now.
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled.filter((n) => isAppReminderId(n.identifier)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})),
  );
  for (const reminder of planned) {
    const { title, body, path } = reminderContent(reminder, dailyLineFor(reminder.date, facts));
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: { title, body, sound: REMINDER_SOUND, data: { path } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder.date, channelId: REMINDERS_CHANNEL_ID },
    });
  }
  LoggerService.info('REMINDERS', `Synced ${planned.length} reminders`);
}

let queue: Promise<void> = Promise.resolve();

/**
 * Makes the scheduled OS reminders match settings and loans exactly. Safe to call often (launch,
 * resume, after any change); calls are serialised so two syncs never interleave cancels and adds.
 */
export function syncReminders(): Promise<void> {
  queue = queue
    .then(runSync)
    .catch((e) => LoggerService.warn('REMINDERS', 'Reminder sync failed', e));
  return queue;
}

/** The user logged something today: the next sync leaves out today's nudge; tomorrow is normal. */
export async function markLoggedToday(): Promise<void> {
  await AsyncStorage.setItem(StorageKeys.REMINDER_SKIPPED_DATE, localDateKey(new Date())).catch(() => {});
}
