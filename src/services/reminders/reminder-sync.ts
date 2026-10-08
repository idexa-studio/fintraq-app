import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq, ne } from 'drizzle-orm';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { StorageKeys } from '@/shared/contracts/storage-keys';
import { db } from '@/src/db/client';
import { loans, persons } from '@/src/db/schema';
import i18n from '@/shared/i18n';
import { LoggerService } from '@/src/services/logger.service';
import { REMINDER_SOUND, REMINDERS_CHANNEL_ID } from '@/src/services/notification.service';
import {
  capReminders,
  IOS_PENDING_LIMIT,
  isAppReminderId,
  localDateKey,
  parseClock,
  planDailyReminders,
  planLoanReminders,
  PlannedReminder,
} from '@/src/services/reminders/reminder-plan';

const REMINDER_MESSAGE_KEYS = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'] as const;

type StoredProfile = { reminderEnabled?: boolean; reminderTime?: string };

const readProfile = async (): Promise<StoredProfile> => {
  try {
    const raw = await AsyncStorage.getItem(StorageKeys.PROFILE);
    return raw ? (JSON.parse(raw) as StoredProfile) : {};
  } catch {
    return {};
  }
};

const contentFor = (reminder: PlannedReminder): Notifications.NotificationContentInput => {
  switch (reminder.kind) {
    case 'daily': {
      // A different nudge each day; the date picks it so a resync doesn't reshuffle the text.
      const key = REMINDER_MESSAGE_KEYS[reminder.date.getDate() % REMINDER_MESSAGE_KEYS.length]!;
      return { title: i18n.t(`notifications.${key}.title`), body: i18n.t(`notifications.${key}.body`), sound: REMINDER_SOUND };
    }
    case 'emi':
      return reminder.loanType === 'lend'
        ? { title: i18n.t('notifications.paymentIncoming'), body: i18n.t('notifications.lendEmiBody', { name: reminder.personName }), sound: REMINDER_SOUND }
        : { title: i18n.t('notifications.emiDue'), body: i18n.t('notifications.borrowEmiBody', { name: reminder.personName }), sound: REMINDER_SOUND };
    case 'due': {
      const when =
        reminder.daysBefore === 0
          ? i18n.t('notifications.today')
          : reminder.daysBefore === 1
            ? i18n.t('notifications.tomorrow')
            : i18n.t('notifications.inDays', { count: reminder.daysBefore });
      return reminder.loanType === 'lend'
        ? { title: i18n.t('notifications.loanDueSoon'), body: i18n.t('notifications.lendDueBody', { name: reminder.personName, when }), sound: REMINDER_SOUND }
        : { title: i18n.t('notifications.repaymentDueSoon'), body: i18n.t('notifications.borrowDueBody', { name: reminder.personName, when }), sound: REMINDER_SOUND };
    }
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
  if (permission.status === 'granted') {
    const dailyTime = profile.reminderEnabled ? parseClock(profile.reminderTime ?? '20:00') : null;
    const loanRows = await db
      .select({
        id: loans.id,
        type: loans.type,
        personName: persons.name,
        dueDate: loans.dueDate,
        emiReminderEnabled: loans.emiReminderEnabled,
        emiReminderDay: loans.emiReminderDay,
        emiReminderTime: loans.emiReminderTime,
        dueReminderEnabled: loans.dueReminderEnabled,
        dueReminderDaysBefore: loans.dueReminderDaysBefore,
        dueReminderTime: loans.dueReminderTime,
      })
      .from(loans)
      .leftJoin(persons, eq(loans.personId, persons.id))
      // A settled loan has nothing left to remind about.
      .where(ne(loans.status, 'repaid'));

    planned = capReminders(
      [...(dailyTime ? planDailyReminders(now, dailyTime, skipDateKey) : []), ...planLoanReminders(now, loanRows)],
      Platform.OS === 'ios' ? IOS_PENDING_LIMIT : null,
    );
  }

  // Replace, never patch: every sync re-arms each alarm, so one scheduled as inexact (before the
  // user allowed exact alarms) becomes exact on the next launch or resume.
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled.filter((n) => isAppReminderId(n.identifier)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})),
  );
  for (const reminder of planned) {
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: contentFor(reminder),
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
